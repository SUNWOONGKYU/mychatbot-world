# S2S2 검증 지시서

## 검증 대상
- Task ID: S2S2
- Task 이름: 카카오 소셜 로그인

## 검증 체크리스트
- [ ] 파일 존재 확인: pages/auth/login.html 수정 확인
- [ ] @task S2S2 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] 로그인 페이지에 카카오 버튼 표시
- [ ] signInWithOAuth({ provider: 'kakao' }) 코드 존재
- [ ] 카카오 API 키 환경변수 사용 (하드코딩 금지)
- [ ] 기존 이메일/구글 로그인 영향 없음
- [ ] 오류 처리 포함

## Area별 추가 검증 (S — Security)
- [ ] OAuth Redirect URI가 설정 파일에 명시
- [ ] 카카오 로그인 후 세션 정상 생성 확인 코드
- [ ] CSRF 방지 state 파라미터 처리
- [ ] Supabase Auth 콜백 핸들러 존재
- [ ] 카카오 로그인 실패 시 에러 메시지 표시
