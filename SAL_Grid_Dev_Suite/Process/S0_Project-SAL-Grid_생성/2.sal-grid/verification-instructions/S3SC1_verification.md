# Verification Instruction - S3SC1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S3SC1

## Task Name
API 인증 미들웨어 (Rate Limiting, CORS 강화)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Security/lib/middleware/rate-limit.ts` 존재
- [ ] `Process/S3_개발-2차/Security/lib/middleware/cors.ts` 존재
- [ ] `Process/S3_개발-2차/Security/lib/middleware/auth.ts` 존재
- [ ] `Process/S3_개발-2차/Security/lib/middleware/logger.ts` 존재
- [ ] 각 파일 상단 `@task S3SC1` 주석 존재

### 2. Rate Limiting 검증
- [ ] 토큰 버킷 알고리즘 구현 확인 (tokens, lastRefill 필드)
- [ ] 한도 초과 시 HTTP 429 반환
- [ ] IP 기반 식별 로직 (`x-forwarded-for` 헤더 활용)
- [ ] 토큰 보충(refill) 로직 존재

### 3. CORS 검증
- [ ] `ALLOWED_ORIGINS` 화이트리스트 배열 정의
- [ ] `Access-Control-Allow-Origin` 헤더 조건부 설정
- [ ] `Access-Control-Allow-Methods` 명시
- [ ] 화이트리스트 외 오리진 차단 로직

### 4. API 키 검증
- [ ] `x-api-key` 헤더 검사 로직
- [ ] 인증 실패 시 HTTP 401 반환
- [ ] 공개 엔드포인트 예외 처리 (`/api/health`, `/api/auth` 등)
- [ ] API 키를 환경변수에서 로드

### 5. 로깅 검증
- [ ] 요청 timestamp, method, path 로깅
- [ ] IP 및 user_agent 로깅
- [ ] 구조화된 JSON 형식 로그 (프로덕션)

### 6. 미들웨어 통합 검증
- [ ] `middleware.ts` 파일에 미들웨어 체이닝 구현
- [ ] 실행 순서: CORS → Rate Limit → API Key → Logger
- [ ] TypeScript 컴파일 오류 없음

### 7. 통합 검증
- [ ] 선행 Task(S1SC1) 기존 인증과 충돌 없음
- [ ] Edge Runtime 호환 코드 (Node.js 전용 API 미사용)

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Security/lib/middleware/"

# Rate Limit 핵심 로직 확인
grep -n "429\|TokenBucket\|tokens" "Process/S3_개발-2차/Security/lib/middleware/rate-limit.ts"

# CORS 화이트리스트 확인
grep -n "ALLOWED_ORIGINS\|Access-Control" "Process/S3_개발-2차/Security/lib/middleware/cors.ts"

# API Key 검증 확인
grep -n "401\|x-api-key" "Process/S3_개발-2차/Security/lib/middleware/auth.ts"

# TypeScript 빌드 확인
npx tsc --noEmit
```

## Expected Results
- 4개 미들웨어 파일 모두 존재
- 각 미들웨어가 적절한 HTTP 상태 코드 반환 (401, 429)
- TypeScript 빌드 오류 없음

## Verification Agent
`security-specialist-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] TypeScript 빌드 에러 없음
- [ ] Rate Limiting 429, API Key 401 응답 확인
- [ ] CORS 화이트리스트 적용 확인
- [ ] Blocker 없음
