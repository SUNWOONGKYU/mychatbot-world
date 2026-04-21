# S10DB1: mcw_bot_skills 테이블 생성

## Task 정보
- **Task ID**: S10DB1
- **Task Name**: mcw_bot_skills 테이블 생성
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: DB
- **Dependencies**: —
- **Agent**: `database-developer-core`

## Task 목표

봇-스킬 마운트 메타데이터를 영속화하는 테이블을 생성한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/20260422_mcw_bot_skills.sql` | mcw_bot_skills 테이블 생성 |

## 구현 사양

columns: id uuid PK, bot_id uuid FK→mcw_bots, skill_id text, mounted_at timestamptz default now(), config jsonb. unique(bot_id, skill_id). RLS: owner only.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
