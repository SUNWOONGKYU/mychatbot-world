---
description: "CPC 소대장 자동 인식 및 Agent Server 가동 스킬"
user-invocable: true
---

# /cpc-engage — CPC 소대장 자동 인식 + Agent Server 가동

Claude Code 세션에 소대장 역할을 자동 배정하고, Agent Server를 백그라운드로 띄운다.
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

디렉토리 매핑에 없는 프로젝트면 사용자에게 소대 키를 질문한다.

프로젝트 경로 변수도 이 단계에서 설정한다:
```bash
PROJECT_PATH=$(pwd)
```

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

### 3단계: Agent Server 백그라운드 실행

프로젝트 루트의 `cpc-agent-server/server.py`를 백그라운드로 띄운다.
이미 실행 중이면 건너뛴다.

```bash
# 이미 실행 중인지 확인
ps aux | grep "server.py" | grep -v grep

# 실행 중이 아니면 백그라운드로 시작
cd "$PROJECT_PATH/cpc-agent-server" && python server.py &
```

- **성공**: "Agent Server 가동 완료 (PID: XXXX)" 출력
- **이미 실행 중**: "Agent Server 이미 실행 중 (PID: XXXX)" 출력
- **실패** (server.py 없음, 의존성 미설치 등): 에러 출력 후 계속 진행

### 4단계: CPC 소대 상태 업데이트 + 세션 ID + 리모트 URL 저장

**4-1. 세션 ID 파악**:

```bash
# 현재 프로젝트 폴더명으로 세션 파일 검색
PROJECT_FOLDER=$(basename "$PWD")
SESSION_ID=$(ls -t ~/.claude/projects/ 2>/dev/null | grep -i "$PROJECT_FOLDER" | head -1)
if [ -z "$SESSION_ID" ]; then
  SESSION_ID=$(ls -t ~/.claude/projects/ 2>/dev/null | head -1)
fi
```

**4-2. CPC 상태 + 세션 ID 저장**:

```bash
# {소대키}는 전체 소대 ID (예: mychatbot-1, ssalworks-2)
curl -s -X PATCH "https://claude-platoons-control.vercel.app/api/platoons/{소대키}/status" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"RUNNING\", \"purpose\": \"소대장 Claude Code 세션 + Agent Server 가동 중\", \"session_id\": \"$SESSION_ID\"}"
```

성공/실패 여부를 출력한다. 실패해도 소대장 역할 인식은 유지 (오프라인 모드).

**4-3. 리모트 컨트롤 URL 저장**: 사용자에게 리모트 컨트롤 활성화를 안내한다.

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
4. "리모트 URL 저장 완료 — 연락병을 통해 모바일 접속 가능" 출력
5. 사용자가 건너뛰면 이 단계는 스킵 (선택 사항, 나중에 실행 가능)

### 5단계: PENDING 명령 확인

CPC API에서 해당 소대의 대기 중 명령을 조회한다:
```bash
curl -s "https://claude-platoons-control.vercel.app/api/platoons/{소대키}/commands?status=PENDING"
```

- **PENDING 명령이 있으면**: 각 명령을 순서대로 처리한다
  1. `PATCH /api/commands/{id}/ack` — 수신 확인 (PENDING → ACKED)
  2. 명령 내용을 이 세션에서 직접 실행
  3. `PATCH /api/commands/{id}/done` — 결과와 함께 완료 보고 (ACKED → DONE)
- **PENDING 명령이 없으면**: "대기 중인 명령 없음" 출력

### 6단계: 가동 완료 보고

```
=== CPC {소대키} 소대장 가동 완료 ===
- 소대장: 이 세션 ({N}소대장)
- 세션 ID: {SESSION_ID}
- Agent Server: 백그라운드 (연락병 명령 자동 처리)
- 리모트 컨트롤: 연락병 요청 시 Agent Server가 온디맨드 생성
- 명령 대기 중. 웹 챗봇(연락병)에서 명령을 보내거나, 이 세션에서 직접 작업 가능.
```

## 중요 규칙
- 이 커맨드 실행 후, 이 세션은 해당 소대장으로서 동작한다
- Agent Server가 연락병 명령을 자동 수신/처리한다 (1초 폴링)
- CPC API 호출 실패 시에도 소대장 역할 인식은 유지한다 (오프라인 모드)
- 소대장은 분대장(Teammate)을 편성하고 서브에이전트를 투입할 수 있다
- 순차 배정: 1번째 세션→1소대장, 2번째 세션→2소대장, 3번째 세션→3소대장
