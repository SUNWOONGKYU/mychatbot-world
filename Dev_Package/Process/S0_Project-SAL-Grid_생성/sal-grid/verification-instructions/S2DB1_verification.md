# S2DB1 검증 지시서

## 검증 대상
- Task ID: S2DB1
- Task 이름: Phase 1 DB 스키마 (usage_logs, bot_templates)

## 검증 체크리스트
- [ ] 파일 존재 확인: supabase/migrations/20260304000001_phase1_tables.sql
- [ ] 마이그레이션 파일명 타임스탬프 형식 준수
- [ ] usage_logs 테이블 CREATE TABLE 구문 포함
- [ ] bot_templates 테이블 CREATE TABLE 구문 포함
- [ ] 하드코딩 없음
- [ ] RLS 정책 두 테이블 모두 포함
- [ ] 인덱스 두 테이블 모두 포함

## Area별 추가 검증 (DB — Database)
- [ ] usage_logs: user_id, bot_id 외래키 정의
- [ ] usage_logs: guest_session_id TEXT 컬럼 존재
- [ ] bot_templates: category, persona_prompt, greeting, sample_faqs 컬럼 존재
- [ ] RLS: usage_logs 본인 레코드만 SELECT
- [ ] RLS: bot_templates 전체 읽기 허용
- [ ] SQL 문법 오류 없음 (세미콜론, 괄호 확인)
- [ ] 기존 S1DB1 테이블과 충돌 없음
