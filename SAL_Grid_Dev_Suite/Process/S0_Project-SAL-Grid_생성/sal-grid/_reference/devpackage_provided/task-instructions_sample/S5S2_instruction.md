# S5S2: API Rate Limiting 구현

## Task 정보
- **Task ID**: S5S2
- **Task Name**: API Rate Limiting 구현
- **Stage**: S5 (개발 마무리)
- **Area**: S (Security)
- **Dependencies**: S5O1 (배포상황 최종 검증)

## Task 목표

API 남용 방지를 위한 Rate Limiting을 구현하여 서비스 안정성과 보안을 강화합니다.

## 구현 범위

### 1. Rate Limiting 미들웨어
- Vercel Edge Functions 호환 Rate Limiter 구현
- IP 기반 + User ID 기반 이중 제한

### 2. 제한 정책
| 엔드포인트 | 제한 | 윈도우 |
|-----------|------|--------|
| AI Q&A API | 30회 | 1분 |
| 인증 API | 10회 | 1분 |
| 일반 API | 100회 | 1분 |

### 3. 제한 초과 응답
- 429 Too Many Requests
- Retry-After 헤더 포함
- 남은 시간 정보 제공

### 4. 저장소
- Vercel KV 또는 Upstash Redis 사용
- 환경변수로 Redis URL 설정

## 수정/생성 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `api/Backend_Infra/rate-limiter.js` | Rate Limiting 모듈 생성 |
| `api/External/ai-qa.js` | Rate Limiter 적용 |
| `api/Security/google-login.js` | Rate Limiter 적용 |
| `vercel.json` | 환경변수 추가 (필요시) |

## 기술 명세

### Rate Limiter 인터페이스
```javascript
const { rateLimit, RateLimitError } = require('../Backend_Infra/rate-limiter');

// 사용 예시
const limiter = rateLimit({
  limit: 30,
  window: '1m',
  identifier: (req) => req.headers['x-forwarded-for'] || 'anonymous'
});

// API에서 사용
const result = await limiter.check(req);
if (!result.success) {
  return res.status(429).json({
    error: 'Too many requests',
    retryAfter: result.reset
  });
}
```

### 응답 헤더
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1704067200
Retry-After: 45
```

### 429 응답 형식
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 30,
  "remaining": 0,
  "reset": 1704067200,
  "retryAfter": 45,
  "message": "요청 한도를 초과했습니다. 45초 후에 다시 시도해주세요."
}
```

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/04_grid-writing-supabase.md` | Grid 업데이트 규칙 | Task 완료 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
