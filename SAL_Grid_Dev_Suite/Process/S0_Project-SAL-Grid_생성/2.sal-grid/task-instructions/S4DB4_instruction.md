# S4DB4: SMS DB 확장 — mcw_skills 컬럼 추가 + skill_logs 테이블 생성

## Task 정보
- **Task ID**: S4DB4
- **Task Name**: SMS DB 확장 — mcw_skills 컬럼 추가 + skill_logs 테이블 생성
- **Stage**: S4 (개발 마무리)
- **Area**: DB (Database)
- **Dependencies**: S4DB3

## Task 목표

Skill Management System(SMS)을 위한 DB 스키마 확장.
- `mcw_skills` 테이블에 SMS 필수 컬럼 추가 (skill_content, origin, version, chatbot_id, success_rate, use_count)
- `skill_logs` 테이블 신규 생성 (Self-Made Skill 생성 파이프라인 재료)

## 핵심 주의사항

**`chatbot_id`는 반드시 TEXT 타입** — `mcw_bots.id`가 TEXT PK이므로 UUID로 선언 시 FK 타입 불일치 오류 발생

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/20260412000001_sms_schema.sql` | ALTER TABLE mcw_skills + CREATE TABLE skill_logs |

## 실행 방법

1. Supabase 대시보드 → SQL Editor
2. `supabase/migrations/20260412000001_sms_schema.sql` 내용 전체 복사 → 실행
3. 또는 `supabase db push` CLI 실행

## 검증 항목

- [ ] mcw_skills에 skill_content, origin, version, chatbot_id, success_rate, use_count 컬럼 추가됨
- [ ] chatbot_id가 TEXT 타입으로 mcw_bots.id FK 정상 연결됨
- [ ] skill_logs 테이블 생성됨
- [ ] RLS 정책 적용됨
- [ ] 인덱스 생성됨
