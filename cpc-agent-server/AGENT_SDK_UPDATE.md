# Agent SDK 통합 업데이트 (v18.4)

> 작성일: 2026-02-25
> 범위: trader-bot, cpc-agent-server, mychatbot-world

---

## 변경 요약

CPC(Vercel + Supabase)와 로컬 PC 사이의 "마지막 연결"을 자동화했다.
기존에는 Claude Code 세션을 수동으로 켜고 `/cpc-engage`를 입력해야 했지만,
이제 Agent SDK 서버가 CPC 명령을 자동 수신하고 Claude Code를 자동 실행/종료한다.

### Before (수동)
```
웹챗봇 → CPC(Supabase) ──X──> [수동으로 켜야 하는 Claude Code]
                                  ↑ /cpc-engage 입력 필요
                                  ↑ 세션 꺼지면 연결 끊김
                                  ↑ 5분 타임아웃 후 OpenRouter 폴백
```

### After (자동)
```
웹챗봇 → CPC(Supabase) → Agent SDK 서버 → Claude Code (자동 실행/종료)
                           ↑ Supabase Realtime 감지 (즉시)
                           ↑ 또는 HTTP 폴링 폴백 (1초)
                           ↑ 서버만 켜져 있으면 수동 개입 없음
```

---

## 아키텍처

```
[웹챗봇 (Vercel) - 변경 없음]
    |
    +-- Claude 연락병 --> CPC(mychatbot-1/2/3)
    |                        |
    |                  [개발 PC: cpc-agent-server/server.py]
    |                        |
    |                  Agent SDK --> Claude Code (cwd=mychatbot-world/)
    |                        |
    |                  소대장이 코드 읽기/수정/검색/배포
    |
    +-- Trade 연락병 --> CPC(mychatbot-trader)
                             |
                       [트레이딩 PC: trader-bot/agent_server.py]
                             |
                       Agent SDK --> Claude Code (cwd=trader-bot/)
                             |
                       소대장이 KIS API, 분석, 지식 관리
```

---

## 변경 파일 목록

### Phase 1: trader-bot (트레이딩 PC)

| 파일 | 상태 | 변경 내용 |
|------|------|----------|
| `agent_server.py` | 신규 | Supabase Realtime + Agent SDK 메인 서버 |
| `config.py` | 수정 | CPC_POLL_INTERVAL 제거, SUPABASE/ANTHROPIC 키 추가 |
| `cpc.py` | 수정 | sync → async(httpx), get_pending_commands 제거 |
| `main.py` | 수정 | while True 폴링 루프 제거, handle_* 라이브러리화 |
| `requirements.txt` | 수정 | claude-agent-sdk, supabase, httpx 추가 |
| `.env.example` | 수정 | SUPABASE_KEY, ANTHROPIC_API_KEY 추가 |

### Phase 2: cpc-agent-server (개발 PC)

| 파일 | 상태 | 내용 |
|------|------|------|
| `server.py` | 신규 | mychatbot-1/2/3 처리, Agent SDK cwd=mychatbot-world |
| `config.py` | 신규 | SUPABASE, ANTHROPIC, PROJECT_CWD |
| `.env.example` | 신규 | 키 템플릿 |
| `requirements.txt` | 신규 | claude-agent-sdk, supabase, httpx, python-dotenv |

### Phase 3: 웹챗봇

| 파일 | 변경 |
|------|------|
| `js/cpc-client.js` (line 49) | TIMEOUT_MS: 300000 → 60000 (5분 → 1분) |

---

## 변경되지 않은 것

| 항목 | 이유 |
|------|------|
| CPC (Vercel + Supabase) | 다리 역할 그대로 유지 |
| kis.py | KIS API — CPC 의존성 없음 |
| analysis.py | 5대장/2쫄병 — CPC 의존성 없음 |
| knowledge.py | 지식 관리 — CPC 의존성 없음 |
| ai.py | intent 파싱 — CPC 의존성 없음 |
| 웹챗봇 UI | chat.js, cpc-client.js 핵심 로직 |

---

## 실행 방법

### 개발 PC (mychatbot-world)
```bash
cd cpc-agent-server
pip install -r requirements.txt
cp .env.example .env    # SUPABASE_KEY 입력
python server.py
```

### 트레이딩 PC (trader-bot)
```bash
cd trader-bot
pip install -r requirements.txt
cp .env.example .env    # SUPABASE_KEY, KIS 키 입력
python agent_server.py  # 소대장 (명령 대기)
python sentry.py        # 보초병 (자율매매, 별도 — 미구현)
```

---

## 명령 처리 흐름

```
1. 사용자가 웹챗봇에서 메시지 전송
2. 연락병 페르소나가 CPC에 PENDING 명령 생성
3. Agent SDK 서버가 Supabase Realtime으로 즉시 감지
   (Realtime 실패 시 1초 HTTP 폴링 폴백)
4. PENDING → ACKED 전환
5. Agent SDK가 Claude Code 세션을 자동 실행
   - cwd: 해당 프로젝트 디렉토리
   - 도구: Read, Write, Edit, Bash, Glob, Grep
   - 예산: $0.50/명령 (trader) / $1.00/명령 (dev)
6. Claude Code가 명령 처리 후 텍스트 결과 반환
7. ACKED → DONE + result 텍스트
8. 웹챗봇이 2초 폴링으로 DONE 감지, 채팅창에 결과 표시
```

---

## 환경 요구사항

- Python 3.10+
- ANTHROPIC_API_KEY (환경변수에 이미 설정됨)
- SUPABASE_KEY (Supabase anon key 필요)
- Claude Code CLI (claude-agent-sdk가 자동 번들)

---

## 검증 결과

| 항목 | 결과 |
|------|------|
| trader-bot agent_server.py | PASS |
| trader-bot config/cpc/main.py | PASS |
| cpc-agent-server 전체 | PASS |
| cpc-client.js 타임아웃 | PASS |
| 순환 import | PASS — 없음 |
| .gitignore 커버리지 | PASS |
