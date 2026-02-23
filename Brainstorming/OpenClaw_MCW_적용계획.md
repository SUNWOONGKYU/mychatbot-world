# OpenClaw → My Chatbot World 전체 적용 계획

## Context

OpenClaw (145K GitHub stars) 프로젝트를 분석하여 MCW에 적용 가능한 12개 항목을 도출했다.
사용자가 **전부 적용**을 요청. 즉시/중기/장기 3단계로 나눠 순차 구현한다.

---

## 수정 대상 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `js/app.js` | 스킬 systemPrompt 추가, 스킬 프리셋, per-persona 스토리지 메서드, 후크 시스템, 세션키 체계 |
| `js/chat.js` | 스킬 botConfig 전송, SSE 스트리밍 수신, 컨텍스트 압축, Silent Reply, 채널 어댑터 인터페이스, 세션키 |
| `js/home.js` | 스킬 프리셋 UI, per-persona 스토리지 위임, DM 보안 설정 UI |
| `js/kb-manager.js` | 벡터 메모리 검색 인터페이스 추가 |
| `api/chat.js` | 스킬 주입, SSE 스트리밍, API 키 로테이션+쿨다운, 토큰 예산, 컨텍스트 압축, 후크 실행 |
| `api/chat-stream.js` | **새 파일** — SSE 스트리밍 엔드포인트 |
| `api/skills.js` | **새 파일** — 스킬 카탈로그/SKILL.md 서빙 |
| `api/channels.js` | **새 파일** — 채널 어댑터 라우터 (장기) |
| `skills/*/SKILL.md` | **새 파일 21개** — 스킬 마크다운 파일 |
| `js/channel-adapter.js` | **새 파일** — 채널 어댑터 추상 레이어 |
| `vercel.json` | SSE 엔드포인트 라우팅 추가 |

---

## Phase 1: 즉시 적용 (4개 항목)

### 1-1. API 키 로테이션 + 쿨다운
**파일**: `api/chat.js`

현재 단순 순차 워터폴을 **다중 키 + 쿨다운**으로 개선.

### 1-2. 응답 스트리밍 (SSE)
**파일**: `api/chat-stream.js` (새 파일), `js/chat.js`, `vercel.json`

### 1-3. 컨텍스트 오버플로우 자동 압축
**파일**: `api/chat.js`, `api/chat-stream.js`

### 1-4. Silent Reply 토큰
**파일**: `api/chat.js`, `js/chat.js`

---

## Phase 2: 중기 적용 (5개 항목)

### 2-1. 스킬 시스템 실체화
**파일**: `js/app.js`, `js/chat.js`, `api/chat.js`, `js/home.js`

### 2-2. 미니 후크 시스템
**파일**: `js/app.js`, `api/chat.js`

### 2-3. 채널 어댑터 패턴
**파일**: `js/channel-adapter.js` (새 파일), `js/chat.js`

### 2-4. DM 보안 정책
**파일**: `api/chat.js`, `js/home.js`

### 2-5. 세션 라우팅 키 체계
**파일**: `js/chat.js`, `js/kb-manager.js`

---

## Phase 3: 장기 적용 (3개 항목)

### 3-1. 벡터 메모리 시스템
**파일**: `js/kb-manager.js`, Supabase (pgvector)

### 3-2. 게이트웨이 아키텍처 (WebSocket → Supabase Realtime)

### 3-3. 에이전트 샌드박스 (설계만)

### 3-4. SKILL.md 파일 기반 전환

---

## 구현 순서

```
Step 1: api/chat.js 수정 (키 로테이션 + 스킬 주입 + 토큰 예산 + 컨텍스트 압축 + Silent Reply)
Step 2: js/app.js 수정 (21개 스킬 systemPrompt + per-persona 메서드 + 프리셋 + 후크 시스템)
Step 3: js/chat.js 수정 (스킬 전송 + SSE 수신 + Silent Reply 처리 + 세션키)
Step 4: api/chat-stream.js 새 파일 (SSE 스트리밍 엔드포인트)
Step 5: js/home.js 수정 (프리셋 UI + DM 정책 설정 UI)
Step 6: js/channel-adapter.js 새 파일 (채널 어댑터 추상 레이어)
Step 7: vercel.json 수정 (SSE 라우팅)
Step 8: skills/ 디렉토리 + 21개 SKILL.md 파일 + api/skills.js
Step 9: 벡터 메모리 (Supabase pgvector + kb-manager.js + api/embed.js)
Step 10: 게이트웨이/샌드박스 (설계 문서)
```

---

*작성일: 2026-02-23*
