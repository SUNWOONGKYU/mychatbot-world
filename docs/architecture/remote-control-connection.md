# 클로드 연락병 리모트 컨트롤 연결

## 개요

외출 중 모바일 브라우저에서 mychatbot.world → 클로드 연락병에게 "리모트 연결"이라고 하면,
CPC를 통해 소대장에게 전달 → 소대장이 /rc 실행 → URL 생성 → CPC DONE → 채팅창에 클릭 가능 URL 표시.

## 핵심 원칙

- **리모트 컨트롤은 온디맨드** — /cpc-engage 시 사전 실행 아님
- 연락병이 "리모트 연결" 요청 → CPC 명령 → Agent Server → 소대장 /rc 실행
- 연락병 역할: **연결 요청만** (URL 전달 아님, URL은 CPC DONE으로 돌아옴)
- Agent Server가 subprocess로 `claude remote-control` 실행 → URL 캡처 → CPC 저장

## 흐름도

```
=== 온디맨드 리모트 컨트롤 ===

[모바일 브라우저 — mychatbot.world]
    │ "리모트 연결해줘" 또는 "1소대장 리모트"
    ▼
[클로드 연락병 (웹 챗봇)]
    │ AI가 CPC 명령으로 변환
    │   └─ POST /api/platoons/mychatbot-1/commands
    │      body: { text: "리모트 연결", source: "chatbot" }
    ▼
[CPC (Supabase)]
    │ cpc_commands INSERT → PENDING 상태
    ▼
[Agent Server (server.py)]
    │ Supabase Realtime / HTTP 폴링으로 PENDING 감지
    │ "리모트" 키워드 → start_remote_control() 호출
    │   └─ ACK 전송 (PENDING → ACKED)
    │   └─ claude remote-control 실행 (subprocess)
    │   └─ stdout에서 URL 캡처: https://claude.ai/code/session_xxx
    │   └─ CPC에 session_url 저장: PATCH /api/platoons/{id}/status
    │   └─ DONE 전송 (ACKED → DONE, result: "리모트 접속 URL: ...")
    ▼
[CPC DONE → 웹챗봇 표시]
    │ cpcSafeHtml: claude.ai/code URL → 클릭 가능 <a> 태그
    ▼
[사용자 클릭 → claude.ai/code 접속]
    └─ 모바일에서 소대장 세션 직접 제어
```

## 구성 요소

### 1. Supabase — `cpc_platoons.session_url`

- 소대장 세션의 리모트 URL 저장
- `GET /api/platoons`에서 `select('*')`로 자동 반영

### 2. CPC API — `status.js`

- `PATCH /api/platoons/{id}/status`
- `session_url` 필드 수용 (status와 독립적으로 저장 가능)

### 3. Agent Server — `server.py`

- `REMOTE_KEYWORDS` 패턴으로 리모트 명령 감지
- `start_remote_control()`: `claude remote-control` subprocess 실행
- stdout 청크 읽기로 URL 캡처 (최대 20초)
- URL → CPC session_url 저장 + DONE 반환

### 4. 클로드 연락병 (웹 챗봇)

- **시스템 프롬프트** (`_shared.js`): "리모트/원격/연결" → CPC 명령 생성
- **cpcSafeHtml**: `claude.ai/code` URL만 클릭 가능 링크로 변환

## 검증 방법

1. 모바일 → 연락병 → "리모트 연결" → CPC에 PENDING 명령 생성 확인
2. Agent Server가 PENDING 감지 → ACK → /rc 실행 확인
3. URL 캡처 → CPC DONE → 채팅창에 클릭 가능 URL 표시 확인
4. URL 클릭 → claude.ai/code에서 세션 접속 확인

## 보안 고려사항

- `cpcSafeHtml`: `escapeHtml` 후 `claude.ai/code` 패턴만 링크 변환 (XSS 방지)
- session_url은 공개 API 노출 → URL 보안은 claude.ai 측에 위임
