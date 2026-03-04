# S2BA4 검증 지시서

## 검증 대상
- Task ID: S2BA4
- Task 이름: 게스트 생성/템플릿/사용량 API

## 검증 체크리스트
- [ ] 파일 존재 확인: api/Backend_APIs/guest-create.js, templates.js, usage.js
- [ ] @task S2BA4 주석 존재 (각 파일 상단)
- [ ] kebab-case 파일명 규칙 준수
- [ ] POST /api/guest-create 인증 없이 접근 가능
- [ ] guest-create 응답에 botId, guestSessionId 포함
- [ ] GET /api/templates 템플릿 목록 반환
- [ ] GET /api/usage 인증 필요 및 사용량 반환
- [ ] 하드코딩 API 키 없음
- [ ] 각 엔드포인트 오류 처리 (400, 500)

## Area별 추가 검증 (BA — Backend APIs)
- [ ] guest-create: UUID 형식의 guestSessionId 생성
- [ ] templates: category 쿼리 파라미터 필터링 동작
- [ ] usage: 인증 없는 요청에 401 응답
- [ ] S2DB1 테이블 참조 올바름 (usage_logs, bot_templates)
- [ ] Supabase 클라이언트 환경변수 사용
