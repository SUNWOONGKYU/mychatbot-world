# Verification Instruction - S2BA2

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2BA2

## Task Name
이메일 발송 API (Resend)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `api/email/password-reset.js` 존재
- [ ] `api/email/welcome.js` 존재
- [ ] `api/lib/email/templates.js` 존재

### 2. 비밀번호 재설정 API 검증
- [ ] POST /api/email/password-reset 엔드포인트
- [ ] 이메일 필수 파라미터 검증
- [ ] Supabase Auth resetPasswordForEmail 연동
- [ ] Resend 이메일 발송

### 3. 환영 이메일 API 검증
- [ ] POST /api/email/welcome 엔드포인트
- [ ] 이메일, 이름 파라미터 처리
- [ ] Resend 이메일 발송

### 4. 이메일 템플릿 검증
- [ ] 비밀번호 재설정 템플릿
- [ ] 환영 이메일 템플릿
- [ ] HTML 이메일 형식

### 5. API 응답 검증
```json
// 성공 응답
{ "message": "Password reset email sent" }
{ "message": "Welcome email sent" }

// 실패 응답
{ "error": "Email is required" }
```

### 6. 에러 처리 검증
- [ ] 필수 파라미터 누락 처리
- [ ] Resend API 에러 처리
- [ ] Supabase 에러 처리

## Test Commands
```bash
# 파일 존재 확인
ls -la api/email/

# API 테스트
curl -X POST http://localhost:3000/api/email/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Expected Results
- 이메일 API 동작
- 비밀번호 재설정 이메일 발송 성공
- 환영 이메일 발송 성공

## Verification Agent
backend-developer

## Pass Criteria
- 비밀번호 재설정 이메일 API 완료
- 환영 이메일 API 완료
- 이메일 템플릿 공통화 완료
- 에러 처리 구현

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] API 코드가 `S2_개발-1차/Backend_APIs/`에 저장되었는가?
- [ ] Production 코드가 `Production/Backend_APIs/`에도 저장되었는가?
