# S3DB2 검증 지시서

## 검증 대상
- Task ID: S3DB2
- Task 이름: Phase 2 DB 스키마 (bot_growth)

## 검증 체크리스트
- [ ] 파일 존재 확인: supabase/migrations/20260304000002_phase2_bot_growth.sql
- [ ] 마이그레이션 파일명 타임스탬프 형식 준수
- [ ] bot_growth 테이블 CREATE TABLE 구문 포함
- [ ] 하드코딩 없음
- [ ] RLS 정책 포함
- [ ] 인덱스 포함

## Area별 추가 검증 (DB — Database)
- [ ] bot_id UNIQUE 제약 존재
- [ ] bot_id가 bots 테이블 외래키 (ON DELETE CASCADE)
- [ ] experience, level, total_conversations 컬럼 존재
- [ ] updated_at 자동 갱신 트리거 포함
- [ ] SQL 문법 오류 없음
- [ ] S3DB1 마이그레이션 이후 적용 가능 (타임스탬프 순서)
