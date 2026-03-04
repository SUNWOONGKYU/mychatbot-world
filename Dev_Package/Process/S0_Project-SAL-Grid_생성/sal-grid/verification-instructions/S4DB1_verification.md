# S4DB1 검증 지시서

## 검증 대상
- Task ID: S4DB1
- Task 이름: Phase 3 DB (revenue, marketplace, inheritance)

## 검증 체크리스트
- [ ] 파일 존재 확인: supabase/migrations/20260304000003_phase3_revenue_marketplace_inheritance.sql
- [ ] 마이그레이션 파일명 타임스탬프 형식 준수
- [ ] bot_revenue_events 테이블 CREATE TABLE 구문 포함
- [ ] skill_marketplace 테이블 CREATE TABLE 구문 포함
- [ ] bot_inheritance 테이블 CREATE TABLE 구문 포함
- [ ] 하드코딩 없음
- [ ] RLS 정책 3개 테이블 포함
- [ ] 인덱스 포함

## Area별 추가 검증 (DB — Database)
- [ ] bot_revenue_events: event_type, amount, settled 컬럼 존재
- [ ] skill_marketplace: price, install_count, review_status 컬럼 존재
- [ ] bot_inheritance: heir_email, bot_ids (배열), condition_months 컬럼 존재
- [ ] SQL 문법 오류 없음
- [ ] S3DB2 마이그레이션 이후 적용 가능 (타임스탬프 순서)
- [ ] bots 테이블 외래키 참조 올바름
