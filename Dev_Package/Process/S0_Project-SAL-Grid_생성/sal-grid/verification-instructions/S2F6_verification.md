# S2F6 검증 지시서

## 검증 대상
- Task ID: S2F6
- Task 이름: 게스트 체험 모드 UI

## 검증 체크리스트
- [ ] 파일 존재 확인: pages/guest/index.html, pages/guest/chat.html, js/guest-mode.js
- [ ] @task S2F6 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] 로그인 없이 pages/guest/ 접근 가능
- [ ] 메시지 10개 제한 카운터 UI 표시
- [ ] 10개 도달 시 회원가입 유도 모달 표시
- [ ] 봇 1개 생성 제한 체크 코드
- [ ] 하드코딩 없음
- [ ] S2BA4 API 연동 코드 존재

## Area별 추가 검증 (F — Frontend)
- [ ] 게스트 세션 localStorage에 저장
- [ ] 새로고침 후에도 사용량 카운트 유지
- [ ] 회원가입 유도 모달 닫기 버튼 존재
- [ ] 랜딩 페이지에 "무료 체험하기" 버튼 추가됨
