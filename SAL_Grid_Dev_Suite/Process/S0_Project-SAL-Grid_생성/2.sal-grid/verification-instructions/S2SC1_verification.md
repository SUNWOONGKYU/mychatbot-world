# Verification Instruction - S2SC1

## Task ID
S2SC1

## Verification Agent
qa-specialist

## Verification Method
1. `/login` 페이지 접속
2. Google 로그인 버튼 클릭 → Google OAuth 페이지 이동 확인
3. Kakao 로그인 버튼 클릭 → Kakao OAuth 페이지 이동 확인
4. 로그인 완료 후 `/dashboard` 리디렉트 확인
5. 비인증 상태에서 `/dashboard` 접근 → `/login` 리디렉트 확인

## Pass Criteria
- Google/Kakao 양쪽 모두 OAuth 페이지 이동 성공
- 콜백 후 세션 생성 + 리디렉트 정상
