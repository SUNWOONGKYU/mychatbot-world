# API Documentation

AI Avatar Chat Platform REST API 문서입니다.

---

## 📋 개요

### Base URL
- **Local**: `http://localhost:8000`
- **Development**: `https://api-dev.example.com`
- **Production**: `https://api.example.com`

### API 버전
현재 버전: **v1**

모든 엔드포인트는 `/api/v1/` prefix를 사용합니다.

---

## 🔐 인증 (Authentication)

### JWT Bearer Token

모든 보호된 엔드포인트는 JWT 토큰이 필요합니다.

**Header 형식**:
```
Authorization: Bearer <your_jwt_token>
```

### 토큰 획득

1. **회원가입** - `POST /api/v1/auth/register`
2. **로그인** - `POST /api/v1/auth/login`

두 엔드포인트 모두 `access_token`과 `refresh_token`을 반환합니다.

**토큰 유효기간**:
- Access Token: 1시간
- Refresh Token: 7일

---

## 📡 요청/응답 형식

### Request

**Content-Type**: `application/json`

**예시**:
```json
{
  "message": "Hello, how can you help me?",
  "persona_id": "business-assistant"
}
```

### Response

**Success (200 OK)**:
```json
{
  "response": "I can help you with scheduling, emails, and data analysis!",
  "emotion": "happy",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-09T18:00:00Z"
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Invalid credentials",
  "detail": "Email or password is incorrect",
  "status_code": 401
}
```

---

## 🚦 HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 204 | No Content | 성공 (응답 본문 없음) |
| 400 | Bad Request | 잘못된 요청 (validation 실패) |
| 401 | Unauthorized | 인증 필요 또는 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 429 | Too Many Requests | Rate limit 초과 |
| 500 | Internal Server Error | 서버 에러 |

---

## 🎭 6가지 챗봇 페르소나

API에서 사용 가능한 `persona_id` 값:

| persona_id | 이름 | 설명 |
|------------|------|------|
| `business-assistant` | 비즈니스 어시스턴트 | 일정 관리, 이메일, 데이터 분석 |
| `customer-service` | 고객 서비스 봇 | FAQ, 문제 해결, 24/7 응대 |
| `education-tutor` | 교육 튜터 | 학습 지원, 퀴즈, 피드백 |
| `healthcare-advisor` | 헬스케어 어드바이저 | 건강 정보, 약 복용 알림 |
| `entertainment-bot` | 엔터테인먼트 봇 | 스토리텔링, 게임, 추천 |
| `personal-assistant` | 개인 비서 | 커스터마이징 가능한 일상 지원 |

---

## 😊 감정 표현 (Emotions)

아바타가 표현할 수 있는 7가지 감정:

- `neutral` - 중립
- `happy` - 기쁨
- `sad` - 슬픔
- `angry` - 화남
- `surprised` - 놀람
- `thinking` - 생각 중
- `concerned` - 걱정

---

## 🔌 WebSocket

실시간 스트리밍 응답을 위한 WebSocket 엔드포인트:

**URL**: `ws://localhost:8000/ws/chat?token=<JWT_TOKEN>`

**연결 예시** (JavaScript):
```javascript
const token = 'your_jwt_token';
const ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`);

ws.onopen = () => {
  ws.send(JSON.stringify({
    message: "Hello!",
    persona_id: "business-assistant"
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.content);
};
```

**메시지 타입**:
- `chunk` - 응답 조각 (스트리밍)
- `complete` - 응답 완료
- `error` - 에러 발생

---

## 📊 Rate Limiting

API 요청 제한:

- **인증 없음**: 10 requests/분
- **인증 있음**: 100 requests/분
- **WebSocket**: 연결당 20 messages/분

Rate limit 초과 시 `429 Too Many Requests` 응답

---

## 🔄 버전 관리

API 버전은 URL path에 포함됩니다: `/api/v1/`

**지원 중단 정책**:
- 새 버전 출시 6개월 후 이전 버전 deprecated 선언
- Deprecated 선언 6개월 후 지원 중단

---

## 📚 참고 문서

- [OpenAPI Spec](./openapi-template.yaml)
- [예시: Chat Endpoint](./examples/chat-endpoint.md)
- [Swagger UI](http://localhost:8000/docs) (로컬 개발 서버)
- [ReDoc](http://localhost:8000/redoc) (로컬 개발 서버)

---

**마지막 업데이트**: 2026-02-09  
**API 버전**: 0.1.0

---

## 🎉 API 문서 완성!

전체 엔드포인트:
- ✅ /api/v1/auth/* (인증)
- ✅ /api/v1/chat/* (채팅)
- ✅ /api/v1/conversations/* (대화)
- ✅ /api/v1/voice/* (음성)
- ✅ /api/v1/search/* (검색)
- ✅ /ws/chat (WebSocket)
