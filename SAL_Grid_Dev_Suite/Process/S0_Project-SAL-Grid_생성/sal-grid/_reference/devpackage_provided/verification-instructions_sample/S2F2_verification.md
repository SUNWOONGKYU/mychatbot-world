# Verification Instruction - S2F2

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2F2

## Task Name
비밀번호 재설정 UI

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `pages/auth/forgot-password.html` (신규)
- [ ] `pages/auth/reset-password.html` (신규 또는 수정)
- [ ] `pages/auth/login.html` (수정 - 링크 추가)

### 2. 비밀번호 재설정 요청 페이지 검증
- [ ] 이메일 입력 필드
- [ ] "재설정 링크 발송" 버튼
- [ ] 성공 메시지 표시 영역
- [ ] 로그인 페이지 링크

### 3. 이메일 발송 연동 검증
- [ ] `/api/email/password-reset` API 호출
- [ ] POST 메서드 사용
- [ ] JSON 형식 요청
- [ ] 성공 시 메시지 표시

### 4. 비밀번호 재설정 페이지 검증
- [ ] URL 파라미터로 토큰 수신
- [ ] 새 비밀번호 입력 필드
- [ ] 비밀번호 확인 필드
- [ ] "비밀번호 변경" 버튼

### 5. 비밀번호 유효성 검사 검증
- [ ] 최소 8자 검증
- [ ] 영문/숫자 조합 검증
- [ ] 비밀번호 일치 확인
- [ ] 에러 메시지 표시

### 6. 로그인 페이지 링크 검증
- [ ] "비밀번호를 잊으셨나요?" 링크 존재
- [ ] forgot-password.html로 연결

## Test Commands
```bash
# 파일 존재 확인
ls -la pages/auth/forgot-password.html
ls -la pages/auth/reset-password.html

# 로그인 페이지 링크 확인
grep -E "(forgot|password)" pages/auth/login.html
```

## Expected Results
- 비밀번호 재설정 요청 페이지 존재
- 이메일 발송 API 연동
- 비밀번호 재설정 페이지 존재
- 유효성 검사 동작

## Verification Agent
frontend-developer

## Pass Criteria
- 비밀번호 재설정 요청 페이지 구현
- 이메일 발송 API 연동
- 비밀번호 재설정 페이지 구현
- 비밀번호 유효성 검사
- 로그인 페이지에 링크 추가

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] 코드가 `S2_개발-1차/Frontend/`에 저장되었는가?
- [ ] Production 코드가 `Production/Frontend/`에도 저장되었는가?
