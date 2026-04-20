# 예약 시스템 스킬 (reservation)

상담 예약 받기 및 캘린더 연동 통합 스킬.

## 기능

- 상담/서비스 예약 정보 수집 (이름, 날짜/시간, 연락처, 메모)
- Supabase `skill_reservations` 테이블에 저장
- 구글 캘린더 자동 일정 추가 (선택)
- 예약 목록 조회, 취소, 수정 지원

## 설치

### 1. 환경 변수 설정

`.env.local`에 추가:

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

구글 캘린더 연동을 원한다면 프론트엔드에서 OAuth 토큰을 추가로 전달해야 합니다 (아래 참조).

### 2. Supabase 테이블 생성

Supabase SQL Editor에서 실행:

```sql
CREATE TABLE IF NOT EXISTS skill_reservations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id      TEXT NOT NULL,
  persona_id  TEXT,
  name        TEXT NOT NULL,
  datetime    TIMESTAMPTZ NOT NULL,
  contact     TEXT NOT NULL,
  note        TEXT DEFAULT '',
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 봇 ID 기준 인덱스
CREATE INDEX IF NOT EXISTS idx_skill_reservations_bot_id
  ON skill_reservations (bot_id, datetime ASC);

-- RLS 활성화 (필요 시)
ALTER TABLE skill_reservations ENABLE ROW LEVEL SECURITY;
```

### 3. API 라우트에 핸들러 등록

`api/skill-integrations.js`의 `switch (skillId)` 블록에 이미 등록되어 있습니다:

```js
case 'reservation':
  return await handleReservation(req, res, action, payload, botId, personaId);
```

## 사용법

### 예약 저장

```js
POST /api/skill-integrations
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "skillId": "reservation",
  "action": "save",
  "botId": "bot-uuid",
  "personaId": "persona-uuid",
  "payload": {
    "name": "홍길동",
    "datetime": "2024-03-15T14:00:00+09:00",
    "contact": "010-1234-5678",
    "note": "첫 방문입니다",
    "googleAccessToken": "<optional: 구글 OAuth 토큰>"
  }
}
```

응답:
```json
{
  "success": true,
  "reservationId": "uuid",
  "confirmCode": "RSV-ABC123",
  "calendarAdded": true,
  "message": "예약이 완료되었습니다! ..."
}
```

### 예약 목록 조회 (관리자)

```http
POST /api/skill-integrations
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "skillId": "reservation",
  "action": "list",
  "botId": "bot-uuid"
}
```

응답:
```json
{
  "reservations": [ /* 예약 객체 배열 */ ],
  "count": 5
}
```

### 예약 취소

```http
POST /api/skill-integrations
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "skillId": "reservation",
  "action": "cancel",
  "botId": "bot-uuid",
  "payload": {
    "reservationId": "uuid"
  }
}
```

응답:
```json
{
  "success": true,
  "message": "예약이 취소되었습니다. 추후 다시 예약하시면 도와드리겠습니다."
}
```

### 예약 수정

```http
POST /api/skill-integrations
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "skillId": "reservation",
  "action": "update",
  "botId": "bot-uuid",
  "payload": {
    "reservationId": "uuid",
    "datetime": "2024-03-16T10:00:00+09:00",
    "note": "오전으로 변경 요청"
  }
}
```

응답:
```json
{
  "success": true,
  "message": "예약이 수정되었습니다."
}
```

## 구글 캘린더 연동 (선택)

현재 클라이언트에서 OAuth 토큰을 전달하는 방식입니다.

### Google OAuth 토큰 발급 절차

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. **OAuth 2.0 Client ID** 생성 (Application type: Web application)
3. **Authorized redirect URIs**에 프론트엔드 콜백 URL 추가
4. 프론트엔드에서 `https://accounts.google.com/o/oauth2/v2/auth` 인증 흐름 구현
   - scope: `https://www.googleapis.com/auth/calendar.events`
5. 발급된 Access Token을 `payload.googleAccessToken`으로 전달

### 발송 흐름

1. 프론트엔드에서 Google OAuth 인증 흐름 구현
2. `googleAccessToken`을 `payload`에 포함하여 전송
3. 서버가 Google Calendar API (`/calendars/primary/events`) 에 일정 추가
4. 응답의 `calendarAdded: true` 로 성공 여부 확인

> 서버사이드 OAuth flow가 필요한 경우 Google Cloud Console에서 OAuth 2.0 앱을 설정하고 Refresh Token을 환경 변수로 관리하는 방식으로 전환하세요.

## 에러 처리

| 상황 | 동작 |
|------|------|
| Supabase 테이블 없음 | 인메모리 확인 코드(RSV-XXXXX) 반환 후 성공 응답 |
| 과거 날짜 입력 | 400 에러 + 안내 메시지 |
| 필수 필드 누락 | 400 에러 + 누락 필드 목록 |
| 구글 캘린더 실패 | 예약 저장은 성공, `calendarAdded: false` 반환 |

## 트러블슈팅

**Q. 예약 저장 시 "Supabase 테이블 없음" 오류**
- Supabase 대시보드에서 `skill_reservations` 테이블이 존재하는지 확인하세요.
- 테이블이 없으면 핸들러가 인메모리 확인 코드(RSV-XXXXX)를 발급하고 성공 응답을 반환하는 폴백 모드로 동작합니다.
- 영구 저장이 필요하다면 이 README의 Supabase 테이블 구조를 참고해 테이블을 생성하세요.

**Q. 구글 캘린더에 일정이 추가되지 않음 (`calendarAdded: false`)**
- `GOOGLE_ACCESS_TOKEN` 환경 변수가 설정됐는지 확인하세요.
- Google Access Token은 만료 시간(기본 1시간)이 있습니다. Refresh Token 기반 자동 갱신 로직을 구현하거나, 정기적으로 토큰을 갱신하세요.
- Google Cloud Console에서 Calendar API가 활성화됐는지 확인하세요.

**Q. 날짜/시간 형식 오류로 예약 저장 실패**
- `datetime` 필드는 ISO 8601 형식(예: `2024-03-15T14:00:00+09:00`)이어야 합니다.
- 자연어 날짜("내일 오후 2시")는 AI가 변환하지만, 최종 payload 전송 전 변환 결과를 반드시 확인하세요.

**Q. 과거 날짜로 예약 시도 시 400 오류**
- 예약 날짜는 현재 시각 이후여야 합니다. "지금 바로" 또는 과거 날짜는 허용되지 않습니다.
- 타임존이 올바르게 설정됐는지 확인하세요. 서버 타임존과 사용자 로컬 타임이 다르면 예상치 못한 오류가 발생할 수 있습니다.

---

## 파일 구조

```
reservation/
├── skill.json    # 스킬 메타데이터 + systemPrompt
├── handler.js    # 예약 저장/조회/취소/수정 + Google Calendar 연동
└── README.md     # 이 파일
```

## Actions 요약

| Action | 필수 payload | 설명 |
|--------|-------------|------|
| `save` | name, datetime, contact | 예약 저장 |
| `list` | 없음 (botId는 최상위 필드) | 예약 목록 조회 (관리자) |
| `cancel` | reservationId | 예약 취소 |
| `update` | reservationId + 변경 필드 (name/datetime/contact/note 중 하나 이상) | 예약 수정 |
