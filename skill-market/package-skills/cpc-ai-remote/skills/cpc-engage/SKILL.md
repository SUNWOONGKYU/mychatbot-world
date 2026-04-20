---
description: "CPC 소대장 자동 인식 및 MCP 명령 루프 가동 스킬"
user-invocable: true
---

# /cpc-engage

Claude Code 세션에 소대장 역할을 자동 배정하고, MCP 명령 대기 루프에 진입한다.
세션 시작 시 최초 1회 실행.

## 사용법

```
/cpc-engage        → 빈 소대 번호 자동 배정 (1→2→3 순차)
/cpc-engage 2      → 강제로 2소대장 지정 (수동 오버라이드)
```

## 인자
- `$ARGUMENTS` = 소대 번호 (1, 2, 3). **생략 시 자동 배정**.

## 실행 절차

### 0단계: 중복 실행 방지

이 세션에서 이미 `/cpc-engage`를 실행하여 소대장이 배정된 상태인지 확인한다.
(대화 내역에 "=== CPC 소대장 인식 완료 ===" 출력이 있었는지 확인)

- **이미 배정됨**: "이미 {소대키} 소대장으로 가동 중입니다. 재배정하려면 `/cpc-engage {번호}`로 지정하세요." 출력 후 **중단**.
- **미배정**: 다음 단계로 진행.

### 1단계: 프로젝트 식별

현재 작업 디렉토리(cwd)를 기반으로 프로젝트와 소대 키 접두사를 결정한다.

| 디렉토리 패턴 | 프로젝트 | 소대 키 접두사 |
|---------------|---------|---------------|
| `mychatbot-world` | My Chatbot World | `mychatbot` |
| `!SSAL_Works_Private` | SSALWorks | `ssalworks` |
| `AI_Study_Circle` | AI Study Circle | `studycircle` |
| `Development_PoliticianFinder_com` | Politician Finder | `politician` |
| `ValueLink` | ValueLink | `valuelink` |
| `trader-bot` | Trader Bot | `trader-bot` (번호 없음, 단일 소대) |

**특수 케이스 — trader-bot**: 소대 키가 `trader-bot`으로 고정 (번호 없음). 디렉토리에 `trader-bot`이 포함되면 자동 배정 로직(1→2→3)을 건너뛰고 바로 `trader-bot`을 소대 키로 사용한다.

디렉토리 매핑에 없는 프로젝트면 사용자에게 소대 키를 질문한다.

### 2단계: 소대 번호 자동 배정

`$ARGUMENTS`가 있으면 해당 번호를 사용한다 (수동 오버라이드).

`$ARGUMENTS`가 없으면 CPC API로 1~3번 소대 상태를 조회하여 **비어있는(IDLE) 가장 낮은 번호**를 자동 배정한다:

```bash
curl -s "https://claude-platoons-control.vercel.app/api/platoons" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
platoons = data if isinstance(data, list) else data.get('data', [])
prefix = '{소대키접두사}'
for n in ['1', '2', '3']:
    key = f'{prefix}-{n}'
    match = [p for p in platoons if p.get('platoon_key', p.get('id','')) == key]
    status = match[0].get('status','IDLE') if match else 'IDLE'
    if status != 'RUNNING':
        print(key)
        break
else:
    print('FULL')
"
```

- IDLE인 소대가 있으면 → 해당 번호 배정
- 3개 모두 RUNNING이면 → "소대 3개 모두 가동 중. 번호를 지정하세요." 출력 후 중단

배정 결과를 선언한다:
```
=== CPC 소대장 인식 완료 ===
프로젝트: {프로젝트명}
소대 키: {소대키}
역할: {N}소대장 (Opus)
```

### 3단계: CPC 소대 상태 업데이트 + 세션 ID

**3-1. 세션 ID 파악**:

```bash
PROJECT_FOLDER=$(basename "$PWD")
SESSION_ID=$(ls -t ~/.claude/projects/ 2>/dev/null | grep -i "$PROJECT_FOLDER" | head -1)
if [ -z "$SESSION_ID" ]; then
  SESSION_ID=$(ls -t ~/.claude/projects/ 2>/dev/null | head -1)
fi
```

**3-2. CPC 상태 + 세션 ID 저장**:

```bash
curl -s -X PATCH "https://claude-platoons-control.vercel.app/api/platoons/{소대키}/status" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"RUNNING\", \"purpose\": \"소대장 MCP 네이티브 세션 가동 중\", \"session_id\": \"$SESSION_ID\"}"
```

성공/실패 여부를 출력한다. 실패해도 소대장 역할 인식은 유지 (오프라인 모드).

**3-3. 리모트 컨트롤 URL 저장** (선택 사항):

> `claude remote-control`은 bash에서 실행 시 `--sdk-url` 에러로 죽는다.
> **반드시 Claude Code 채팅창에서 `/remote-control`을 실행해야 한다.**

1. 사용자에게 안내: "리모트 접속을 활성화하려면 **이 채팅창에서** `/remote-control`을 실행해 주세요."
2. 사용자가 `/remote-control` 실행 → URL이 표시됨
3. 표시된 URL을 CPC에 저장:
```bash
curl -s -X PATCH "https://claude-platoons-control.vercel.app/api/platoons/{소대키}/status" \
  -H "Content-Type: application/json" \
  -d '{"session_url": "[/remote-control 실행 후 표시된 URL]"}'
```
4. 사용자가 건너뛰면 이 단계는 스킵 (나중에 실행 가능)

### 4단계: MCP 명령 대기 루프 진입

**이 단계가 핵심이다.** MCP로 CPC 명령을 네이티브 수신·처리·보고한다.

`cpc` MCP 서버가 등록되어 있으므로 (`~/.claude/settings.json` → `mcpServers.cpc`) 아래 루프를 실행한다:

```
루프 시작 (중단 지시가 없는 한 계속 반복):

  1. cpc.wait_cpc_command(platoon_id="{소대키}", timeout=120) 호출
     - 명령이 오면 → {cmd_id, text, platoon_id} 반환
     - timeout이면 → null 반환 (다시 1번으로)

  2. cmd.text를 이 세션에서 직접 처리 (일반 Claude 작업처럼 실행)

  3. cpc.report_cpc_result(cmd_id=cmd.cmd_id, result="처리 결과 요약")
     → 연락병 웹챗봇에 결과가 표시됨

  4. 1번으로 돌아가 계속 대기
```

**규칙**:
- `wait_cpc_command`가 null을 반환해도 루프를 종료하지 않는다 — 즉시 다시 호출
- 사용자가 이 채팅창에서 직접 메시지를 보내면 → 처리 후 루프 재진입
- "CPC 대기 종료" 또는 사용자가 명시적으로 중단 요청 시에만 루프 종료

**가동 완료 메시지 출력 후 즉시 첫 번째 wait_cpc_command를 호출하여 루프를 시작한다.**

### 5단계: 가동 완료 보고

```
=== CPC {소대키} 소대장 가동 완료 ===
- 소대장: 이 세션 ({N}소대장)
- 세션 ID: {SESSION_ID}
- 수신 모드: MCP 네이티브 (wait_cpc_command 폴링)
- 명령 흐름: 웹챗봇 → CPC(Supabase) → MCP → Claude (네이티브 처리) → CPC → 웹챗봇
```

그 다음 즉시 루프 시작:
> `cpc.wait_cpc_command("{소대키}", timeout=120)` 호출 — 명령 대기 중...

## 중요 규칙
- 이 커맨드 실행 후, 이 세션은 해당 소대장으로서 동작한다
- **MCP 단독 수신**: server.py/inject 파이프라인은 삭제됨 (v20.0). MCP만 사용
- CPC API 호출 실패 시에도 소대장 역할 인식은 유지한다 (오프라인 모드)
- 소대장은 분대장(Teammate)을 편성하고 서브에이전트를 투입할 수 있다
- 순차 배정: 1번째 세션→1소대장, 2번째 세션→2소대장, 3번째 세션→3소대장
