# S4T4 검증 지시서

## 검증 대상
- Task ID: S4T4
- Task 이름: 전체 통합 테스트

## 검증 체크리스트
- [ ] 파일 존재 확인: tests/marketplace.test.js, revenue.test.js, inheritance.test.js, regression.test.js
- [ ] @task S4T4 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] 각 테스트 파일 최소 5개 테스트 케이스
- [ ] package.json test:integration 스크립트 존재
- [ ] 하드코딩 API 키 없음 (테스트 환경변수 사용)
- [ ] 오류 처리: 테스트 실패 시 명확한 메시지

## Area별 추가 검증 (T — Testing)
- [ ] marketplace.test.js: publish/skills/install API 테스트
- [ ] revenue.test.js: 수익 집계 로직 검증
- [ ] inheritance.test.js: 상속 설정/수락 플로우 테스트
- [ ] regression.test.js: 기존 인증/챗봇/대화 API 포함
- [ ] setup/teardown으로 테스트 데이터 정리
- [ ] 성공 케이스와 실패 케이스 모두 포함
