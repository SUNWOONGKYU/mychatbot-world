# API 레퍼런스 — CoCoBot World

> @task S9DC3
> 전체 OpenAPI 스펙: `docs/api/openapi.yaml`
> 에러 코드: `docs/api/error-codes.md`
> 인증: `docs/api/authentication.md`

## Base URL

- Production: `https://mychatbot.world`
- Staging: `https://staging.mychatbot.world`

## 인증

쿠키 기반 세션 (Supabase SSR). 관리자 엔드포인트는 추가로 `x-admin-key` 헤더 요구.

---

## 1. Health & System (2)

### `GET /api/health`
서비스 가용성 probe.

**응답 200**
```json
{
  "status": "ok",
  "time": "2026-04-20T05:12:34.567Z",
  "services": {
    "database": { "status": "ok", "latency_ms": 42 },
    "redis": { "status": "ok" },
    "openrouter": { "status": "ok" }
  }
}
```

**응답 503** (degraded 또는 down)

### `GET /api/metrics` · `POST /api/metrics`
웹 바이탈 수집 (POST) / Prometheus 메트릭 (GET — 내부용).

---

## 2. Auth (4)

### `GET /api/auth/me`
현재 로그인 유저 정보. 401 시 로그인 필요.

### `POST /api/auth/password`
비밀번호 변경. Body: `{ oldPassword, newPassword }`.

### `POST /api/auth/welcome-credits`
신규 가입자 환영 크레딧 1회 지급.

### `POST /api/auth/me/avatar`
프로필 이미지 업로드 (multipart/form-data, `file`).

---

## 3. Bots (8)

### `GET /api/bots`
로그인 유저의 봇 목록.

### `POST /api/bots`
새 봇 생성. Body: `{ name, greeting, persona, model?, isPublic? }`.

**응답 201** `{ id, url_slug, created_at }`

### `GET /api/bots/[id]`
봇 상세.

### `PATCH /api/bots/[id]`
봇 설정 수정. Body: 부분 필드.

### `DELETE /api/bots/[id]`
봇 삭제 (soft delete).

### `GET /api/bots/public`
공개 봇 목록 (검색/필터).

### `POST /api/bots/[id]/clone`
봇 복제.

### `GET /api/bots/[id]/growth`
봇 성장 통계 (대화 수, 고유 유저 등).

---

## 4. Chat (3)

### `POST /api/chat` (or `/api/ai/chat`)
일반 AI 대화. Body: `{ botId, messages: [{ role, content }] }`.

**응답 200**: JSON `{ content, creditUsed }`

### `POST /api/chat/stream`
스트리밍 AI 대화 (Server-Sent Events).

**응답 200**: `text/event-stream`
```
data: {"delta":"안녕"}

data: {"delta":"하세요"}

data: [DONE]
```

### `POST /api/guest-chat`
비로그인 게스트 대화 (제한적). IP rate limit 적용.

---

## 5. Bot Creation Wizard (4)

### `POST /api/create-bot/analyze`
사용자 설명으로부터 봇 persona 제안.

### `POST /api/create-bot/faq`
FAQ 자동 생성.

### `POST /api/create-bot/deploy`
최종 배포 (봇 activate).

### `POST /api/create-bot` (legacy)
원샷 봇 생성.

---

## 6. Credits (3)

### `GET /api/credits`
현재 잔고 + 요약.

**응답 200** `{ balance: 12500, currency: "KRW" }`

### `GET /api/credits/history`
크레딧 변동 이력 (페이지네이션).

### `GET /api/credits/usage`
일별 사용량 차트 데이터.

---

## 7. Payments (3)

### `POST /api/payments/bank-transfer`
무통장 결제 요청 생성. Body: `{ amount, buyer_name }`.

**응답 200** `{ id, status: 'pending', deposit_account, deposit_amount, expires_at }`

### `GET /api/payments/[id]`
결제 상태 조회.

### `POST /api/refunds`
환불 요청. Body: `{ paymentId, reason }`. 7일 청약철회 기간 내만 가능.

---

## 8. Skills (3)

### `GET /api/skills`
설치 가능 스킬 목록.

### `POST /api/skills/install`
스킬 설치. Body: `{ skillId, botId }`.

### `DELETE /api/skills/install/[id]`
설치 해제.

---

## 9. Community (5)

### `GET /api/community`
게시글 목록.

### `POST /api/community`
새 글 작성.

### `GET /api/community/[id]`
게시글 상세.

### `POST /api/community/like`
좋아요 토글.

### `POST /api/community/report`
신고.

---

## 10. Admin (4)

> 모든 admin 엔드포인트는 `x-admin-key` 헤더 필수.

### `GET /api/admin/stats`
전체 서비스 통계.

### `GET /api/admin/payments`
결제 관리 목록. Query: `status`, `from`, `to`.

### `POST /api/admin/payments/[id]/approve`
결제 수동 승인.

### `POST /api/admin/payments/[id]/reject`
결제 거절.

---

## 에러 응답 (공통)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요해요",
    "details": {}
  }
}
```

코드 목록: `docs/api/error-codes.md`

## Rate Limits

| Group | 제한 |
|-------|------|
| 비로그인 | IP당 60 req/min |
| 로그인 | 유저당 300 req/min |
| `/api/chat*` | 유저당 30 req/min |
| `/api/guest-chat` | IP당 10 req/min |
| `/api/admin/*` | 제한 없음 (내부) |

초과 시 HTTP 429 + `Retry-After` 헤더.

## 변경 이력

- 2026-04-20: 30+ 엔드포인트 그룹핑 문서 (S9DC3)
- 2026-__-__: OpenAPI 스펙 sync (S8DC1)

## 관련

- OpenAPI YAML: `docs/api/openapi.yaml`
- 에러 코드: `docs/api/error-codes.md`
- 인증 상세: `docs/api/authentication.md`
- 사용자 메시지 매핑: `lib/errors/user-facing.ts`
