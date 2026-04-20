# CPC Agent Server — 업무 인수인계서
> 작성일: 2026-03-18 | 작성자: 1소대장 (mychatbot-1)
> 다음 세션 소대장에게 전달하는 현재 상태 완전 인계서

---

## 1. 내가 누구인가 (소대장 정체성)

- **소대 ID**: `mychatbot-1`
- **프로젝트**: My Chatbot World (`G:/내 드라이브/mychatbot-world/`)
- **역할**: CPC(Claude Platoons Control) 시스템의 1소대장
- **세션 시작 시 반드시 실행**: `/cpc-engage` (cc-pid.txt 갱신 + RUNNING 상태 등록)

---

## 2. 시스템 구조 (v19.0 — 2026-03-18 기준)

### 핵심 흐름
```
모바일/웹챗봇 (mychatbot.world)
  → /api/cpc-proxy (Vercel 프록시)
  → Supabase cpc_commands 테이블 (PENDING 등록)
  → server.py 1초 폴링으로 감지
  → inject_watcher.py → cc_inject.py
  → AttachConsole(pane_pid) + WriteConsoleInputW
  → Claude Code 채팅창에 직접 주입
  → 소대장(나) 처리
  → cpc_respond.py → cc-response-{cmd_id}.txt
  → server.py가 읽어서 CPC DONE 처리
  → 웹챗봇 폴링으로 결과 수신
```

### inject 메시지 형식
```
[CPC:{cmd_id}:{platoon_id}] {사용자 텍스트}
예시: [CPC:cmd-1773829348653-piw3k4:mychatbot-1] 서버 상태 확인해줘
```

---

## 3. 핵심 파일 경로

| 파일 | 경로 | 역할 |
|------|------|------|
| Agent Server | `G:/내 드라이브/mychatbot-world/cpc-agent-server/server.py` | CPC 폴링 + inject 오케스트레이터 |
| CONIN$ 주입 | `cpc-agent-server/cc_inject.py` | AttachConsole + WriteConsoleInputW |
| 주입 감시자 | `cpc-agent-server/inject_watcher.py` | 큐 파일 감시 → cc_inject 호출 |
| 응답 헬퍼 | `cpc-agent-server/cpc_respond.py` | 소대장 응답 전달용 |
| 웹챗봇 CPC | `G:/내 드라이브/mychatbot-world/js/cpc-client.js` | 웹챗봇 CPC 연동 |
| AI 공유 유틸 | `G:/내 드라이브/mychatbot-world/api/_shared.js` | MODEL_STACK, 시스템 프롬프트 |
| Vercel 프록시 | `G:/내 드라이브/mychatbot-world/api/cpc-proxy.js` | Vercel Security Checkpoint 우회 |
| 아키텍처 다이어그램 | `cpc-agent-server/agent_sdk_architecture.svg` | 전체 구조도 |
| 흐름 다이어그램 | `G:/내 드라이브/mychatbot-world/cpc_flow_diagram.svg` | CPC 흐름도 v19.0 |

### 임시 파일 (Temp)
```
C:/Users/home/AppData/Local/Temp/
  cc-pid.txt                          ← Claude Code node.exe PID (inject 타겟)
  cc-inject-queue-{cc_pid}.json       ← 주입 큐 파일 (세션별 격리)
  cc-inject-done-{cc_pid}.json        ← 주입 완료 확인
  cc-response-{cmd_id}.txt            ← 소대장 응답 (cpc_respond.py가 작성)
```

---

## 4. CPC 응답 프로토콜

CPC 명령을 받으면 반드시 응답을 돌려보내야 함:

```bash
python "G:/내 드라이브/mychatbot-world/cpc-agent-server/cpc_respond.py" {cmd_id} "응답 내용"
```

**예시:**
```bash
python "G:/내 드라이브/mychatbot-world/cpc-agent-server/cpc_respond.py" "cmd-1773829348653-piw3k4" "서버 정상 동작 중입니다."
```

- 응답 타임아웃: **80초** (server.py 기준), 웹챗봇은 90초/120초(리모트)
- 타임아웃 후엔 Vercel AI 폴백(`/api/cpc-process`)이 처리함

---

## 5. 주요 설정값

| 항목 | 값 |
|------|-----|
| server.py 싱글톤 포트 | `127.0.0.1:19782` |
| CPC Proxy URL | `https://mychatbot.world/api/cpc-proxy` |
| Supabase ref | `hlpovizxnrnspobddxmq` (서울 리전) |
| CPC Vercel | `https://claude-platoons-control.vercel.app` |
| AI MODEL_STACK | gemini-2.5-flash → gpt-4o → claude-sonnet-4-6 → deepseek-chat |
| 웹챗봇 폴링 | 3초 간격 |
| server.py 폴링 | 1초 간격 |

---

## 6. 완료된 작업 (2026-03-18)

- [x] cc_inject.py — AttachConsole(pane_pid) 방식으로 완전 전환 (VBS/cpc-monitor 제거)
- [x] inject_watcher.py — 세션별 큐 파일 격리 (`cc-inject-queue-{cc_pid}.json`)
- [x] server.py — 싱글톤 포트 19782, HTTP 1초 폴링, 80초 타임아웃
- [x] cpc_flow_diagram.svg — v19.0으로 완전 업데이트 + 검증 완료
- [x] agent_sdk_architecture.svg — pane_pid 자동 추적 반영
- [x] _shared.js MODEL_STACK — 다이어그램과 완전 일치 (claude-sonnet-4-6)
- [x] Task Scheduler `CPC_AgentServer` — 로그인 시 server.py 자동 시작
- [x] Supabase `cpc_platoons.session_url` 컬럼 — 리모트 URL 저장용
- [x] `/api/cpc-proxy.js` — Vercel Security Checkpoint 우회 프록시
- [x] 웹챗봇 ↔ 소대장 양방향 교신 — 실 테스트 완료 확인

---

## 7. 미해결 이슈

| 이슈 | 원인 | 대응 |
|------|------|------|
| Remote Control 비활성화 | Anthropic 조직 정책 차단 | 해결 불가, 우회 없음 |
| cpc_flow_diagram.svg의 리모트 경로 | session_url DB 조회는 작동하나 URL 생성 자체가 안 됨 | 다이어그램 해당 경로는 미래용 |

---

## 8. 세션 시작 체크리스트

새 Claude Code 세션을 열었다면:

```
1. /cpc-engage 실행
   → cc-pid.txt 갱신 (현재 node.exe PID 저장)
   → CPC 상태 RUNNING 업데이트
   → PENDING 명령 있으면 자동 처리

2. server.py 실행 중인지 확인 (Task Scheduler가 자동 시작하지만 확인)
   → 포트 19782 바인딩 여부로 판단
   → 중복 실행 시 자동 종료됨 (싱글톤)

3. CPC 명령 수신 시 → cpc_respond.py로 반드시 응답
```

---

## 9. 다이어그램 vs 코드 검증 결과 (2026-03-18)

`cpc_flow_diagram.svg` 와 실제 구현 코드 전체 교차 검증 완료.
**모든 핵심 요소 일치 확인.** 다이어그램이 현재 구현을 정확히 반영함.

---

## 10. 외부 API 활용 예시 (이 세션에서 실증)

**NEIS 급식 API** — 학교 급식 조회 가능:
```python
# 학교 코드 조회
url = 'https://open.neis.go.kr/hub/schoolInfo?SCHUL_NM={학교명}&Type=json'

# 급식 조회 (ATPT_OFCDC_SC_CODE=Q10: 전라남도)
url = 'https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=Q10&SD_SCHUL_CODE=8601017&MLSV_YMD=20250918&Type=json'
# API 키 없이도 일 100건 무료 조회 가능
```

---

## 11. CPC Channel (Channels 기반 차세대 통신) — 구축 완료, 테스트 대기

### 배경
2026-03-20 Claude Code Channels 기능 발표 (v2.1.80, Research Preview).
기존 ConPTY 해킹(cc_inject.py) 대신 MCP 표준 프로토콜로 명령 수신 가능.

### 파일 위치
```
cpc-agent-server/cpc-channel/
├── cpc-channel.ts          ← TypeScript 소스
├── dist/cpc-channel.js     ← Bun 빌드 결과 (0.48MB)
├── package.json
└── node_modules/           ← @modelcontextprotocol/sdk
```

### MCP 등록 완료
`~/.claude/settings.json` → `mcp.servers.cpc-channel` 등록됨.

### 다음 소대장이 해야 할 것

**1단계: Claude Code 업데이트** (2.1.80 이상)
```bash
npm update -g @anthropic-ai/claude-code
```

**2단계: Channels로 실행**
```bash
claude --channels server:cpc-channel
# 또는:
claude --dangerously-load-development-channels server:cpc-channel
```

**3단계: 테스트**
- 웹챗봇 → 명령 전송 → Channel 이벤트로 Claude에게 푸시되는지 확인
- Claude가 `cpc_reply` 도구로 응답 → 웹챗봇에 결과 표시되는지 확인

**4단계: 성공 시 제거 대상**
- `cc_inject.py` — ConPTY 해킹 (불필요)
- `inject_watcher.py` — 큐 파일 감시 (불필요)
- `cc-pid.txt` 의존성 — PID 추적 (불필요)
- server.py의 inject 관련 코드 — Channel로 대체
- `/cpc-engage`의 cc-pid.txt 갱신 로직 — 불필요

### 구조 비교
```
[기존] 웹챗봇 → Supabase → server.py 폴링 → inject_watcher → cc_inject(ConPTY) → 채팅창
[신규] 웹챗봇 → Supabase → cpc-channel(MCP) → Channel 알림 → Claude 직접 수신
```

---

_이 인수인계서는 `G:/내 드라이브/mychatbot-world/cpc-agent-server/HANDOVER.md` 에 저장됨_
