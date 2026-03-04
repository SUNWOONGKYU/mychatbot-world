# S3CS1 검증 지시서

## 검증 대상
- Task ID: S3CS1
- Task 이름: 챗봇스쿨 콘텐츠 시스템

## 검증 체크리스트
- [ ] 파일 존재 확인: api/Backend_APIs/school-session.js, templates/school/ 3개 파일
- [ ] @task S3CS1 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] POST /api/school/session 엔드포인트 구현
- [ ] 시나리오 JSON 3개 이상 생성
- [ ] 하드코딩 없음
- [ ] 오류 처리 포함

## Area별 추가 검증 (CS — Content/System)
- [ ] 시나리오 JSON: scenarioId, scenarioName, steps 필드 포함
- [ ] API 응답에 response, sessionProgress 포함
- [ ] 시나리오 컨텍스트로 AI 응답 품질 차별화 (일반 대화와 다름)
- [ ] 완료 시 bot_growth 경험치 업데이트 코드 존재
- [ ] S3BA1 고급 대화 API 활용 구조
