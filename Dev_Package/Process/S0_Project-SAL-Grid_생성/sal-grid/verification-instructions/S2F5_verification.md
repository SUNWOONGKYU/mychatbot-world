# S2F5 검증 지시서

## 검증 대상
- Task ID: S2F5
- Task 이름: VAD 음성 입력 개선

## 검증 체크리스트
- [ ] 파일 존재 확인: js/chat.js, package.json
- [ ] @task S2F5 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] @ricky0123/vad-web 패키지 package.json 포함
- [ ] 기존 4초 타이머 로직 제거됨
- [ ] MicVAD 또는 동등한 VAD 초기화 코드 존재
- [ ] onSpeechStart/onSpeechEnd 콜백 구현
- [ ] 하드코딩 없음
- [ ] 마이크 권한 없을 때 오류 처리
- [ ] 기존 텍스트 입력과 공존 가능

## Area별 추가 검증 (F — Frontend)
- [ ] 브라우저 마이크 API 사용 허가 요청 코드 존재
- [ ] VAD 초기화 실패 시 폴백 동작 코드
- [ ] 음성 녹음 중 시각적 피드백 UI 요소 존재
- [ ] 크로스 브라우저 호환성 고려 (Chrome, Safari)
