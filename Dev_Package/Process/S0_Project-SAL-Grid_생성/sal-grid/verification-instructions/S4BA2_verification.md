# S4BA2 검증 지시서

## 검증 대상
- Task ID: S4BA2
- Task 이름: 마켓플레이스/수익 API

## 검증 체크리스트
- [ ] 파일 존재 확인: api/Backend_APIs/marketplace.js, revenue.js
- [ ] @task S4BA2 주석 존재 (각 파일 상단)
- [ ] kebab-case 파일명 규칙 준수
- [ ] POST /api/marketplace/publish 구현
- [ ] GET /api/marketplace/skills 구현
- [ ] GET /api/revenue/:botId 구현
- [ ] 인증 미들웨어 적용 (publish, revenue)
- [ ] 하드코딩 없음
- [ ] 오류 처리 (400, 401, 403, 500)

## Area별 추가 검증 (BA — Backend APIs)
- [ ] publish: skill_marketplace 테이블 INSERT
- [ ] skills: is_active=true 필터링
- [ ] skills: category 쿼리 파라미터 지원
- [ ] revenue: 본인 봇 외 403 응답
- [ ] revenue: bot_revenue_events 집계 쿼리
- [ ] S4DB1 테이블 참조 올바름
