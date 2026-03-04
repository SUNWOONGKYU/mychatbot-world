# S4BA3 검증 지시서

## 검증 대상
- Task ID: S4BA3
- Task 이름: 상속 API

## 검증 체크리스트
- [ ] 파일 존재 확인: api/Backend_APIs/inheritance.js
- [ ] @task S4BA3 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] POST /api/inheritance 구현
- [ ] GET /api/inheritance 구현
- [ ] PATCH /api/inheritance/:id/accept 구현
- [ ] DELETE /api/inheritance/:id 구현
- [ ] 인증 미들웨어 적용
- [ ] 하드코딩 없음
- [ ] 오류 처리 (400, 401, 403, 404)

## Area별 추가 검증 (BA — Backend APIs)
- [ ] POST: bot_inheritance 테이블 INSERT
- [ ] GET: 본인 설정 + 본인이 상속인인 목록 모두 반환
- [ ] PATCH/accept: status 'accepted'로 변경
- [ ] DELETE: 본인 설정만 삭제 가능 (403 처리)
- [ ] S4DB1 bot_inheritance 테이블 참조 올바름
