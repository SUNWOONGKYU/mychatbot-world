# S3BA5 검증 지시서

## 검증 대상
- Task ID: S3BA5
- Task 이름: 성장 지표/레벨 API

## 검증 체크리스트
- [ ] 파일 존재 확인: api/Backend_APIs/growth.js
- [ ] @task S3BA5 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] GET /api/growth/:botId 엔드포인트 구현
- [ ] 레벨 계산 로직 존재
- [ ] 응답에 level, experience, nextLevelExp, stats 포함
- [ ] 인증 미들웨어 적용
- [ ] 하드코딩 없음
- [ ] 오류 처리: 403 (다른 사용자 봇), 404 (없는 봇)

## Area별 추가 검증 (BA — Backend APIs)
- [ ] 경험치 계산식 명시적으로 코드에 존재
- [ ] S3DB2 bot_growth 테이블 참조
- [ ] stats 객체에 totalConversations, totalMessages 포함
- [ ] 레벨 임계값 상수로 정의 (매직 넘버 방지)
- [ ] Supabase 쿼리 환경변수 사용
