# Verification Instruction - S2M1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2M1

## Task Name
API 문서 v1

## Verification Checklist

### 1. 문서 존재 검증
- [ ] `API_DOCUMENTATION_V1.md` 파일 존재
- [ ] Markdown 형식 유효성

### 2. 문서 구조 검증
- [ ] Base URL 섹션 (Production, Development)
- [ ] Authentication 섹션 (Bearer Token)
- [ ] Endpoints 섹션

### 3. Auth API 문서화 검증
- [ ] POST /api/auth/google
- [ ] GET /api/auth/google/callback
- [ ] POST /api/auth/logout

### 4. Email API 문서화 검증
- [ ] POST /api/email/password-reset
- [ ] POST /api/email/welcome

### 5. Subscription API 문서화 검증
- [ ] GET /api/subscription/status
- [ ] POST /api/subscription/create
- [ ] POST /api/subscription/cancel

### 6. 엔드포인트 문서 품질 검증
- [ ] Method & URL
- [ ] Description
- [ ] Request Headers
- [ ] Request Body (JSON schema)
- [ ] Response (성공/실패)
- [ ] Error Codes
- [ ] Example (curl)

### 7. 에러 코드 표준화 검증
- [ ] 에러 응답 형식 정의
- [ ] 에러 코드 목록

## Test Commands
```bash
# 문서 존재 확인
ls -la docs/API_DOCUMENTATION_V1.md

# 엔드포인트 목록 확인
grep -E "^### |POST |GET |PUT |DELETE " docs/API_DOCUMENTATION_V1.md
```

## Expected Results
- API 문서 완성
- 모든 엔드포인트 문서화
- curl 예제 포함

## Verification Agent
documentation-specialist

## Pass Criteria
- 모든 인증 API 문서화
- 모든 이메일 API 문서화
- 모든 구독 API 문서화
- 에러 코드 표준화
- curl 예제 포함

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] API 문서가 `S2_개발-1차/Documentation/`에 저장되었는가?
