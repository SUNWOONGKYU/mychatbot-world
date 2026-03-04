# Verification Instruction - S2F3

## Task ID
S2F3

## Task Name
회원가입 UI

## Verification Agent
code-reviewer

## Verification Criteria

### 1. 회원가입 폼 UI 확인
- [ ] 이메일 입력 필드 존재
- [ ] 비밀번호 입력 필드 존재
- [ ] 비밀번호 확인 필드 존재
- [ ] 회원가입 버튼 존재
- [ ] Google OAuth 로그인 링크/버튼

### 2. 폼 유효성 검사
- [ ] 이메일 형식 검증
- [ ] 비밀번호 최소 길이 검증 (8자 이상)
- [ ] 비밀번호 확인 일치 검증
- [ ] 실시간 에러 메시지 표시

### 3. API 연동
- [ ] S2BA4 회원가입 API 호출
- [ ] 성공 시 로그인 페이지로 리다이렉트
- [ ] 실패 시 에러 메시지 표시

### 4. 접근성 확인
- [ ] 폼 요소에 label 연결
- [ ] 키보드 탐색 가능
- [ ] 에러 메시지 스크린 리더 접근 가능

### 5. 모바일 반응형
- [ ] 모바일에서 폼 가독성
- [ ] 터치 영역 충분 (44px 이상)

## Test Commands
```bash
# E2E 테스트 (Playwright)
npx playwright test signup.spec.js

# 접근성 테스트
npx axe pages/auth/signup.html
```

## Build Verification
- [ ] HTML 문법 오류 없음
- [ ] CSS 스타일 정상 적용
- [ ] JavaScript 콘솔 에러 없음

## Integration Verification
- [ ] S2BA4 회원가입 API와 연동
- [ ] S2F1 Google 로그인 UI와 일관된 디자인
- [ ] 로그인 페이지와 연결

## Expected Files
- Production/Frontend/pages/auth/signup.html
- Production/Frontend/assets/js/signup.js
- S2_개발-1차/Frontend/pages/auth/signup.html

## Notes
- Google OAuth는 별도 버튼으로 제공
- 비밀번호 강도 표시기 권장
- 이용약관/개인정보 동의 체크박스 필요
