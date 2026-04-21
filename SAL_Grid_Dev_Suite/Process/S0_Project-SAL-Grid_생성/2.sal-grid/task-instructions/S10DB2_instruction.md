# S10DB2: mcw_bots 컬럼 확장

## Task 정보
- **Task ID**: S10DB2
- **Task Name**: mcw_bots 컬럼 확장
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: DB
- **Dependencies**: —
- **Agent**: `database-developer-core`

## Task 목표

mcw_bots에 tone(text), persona_traits(jsonb), learning_sources(jsonb) 컬럼을 추가한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/20260422_mcw_bots_columns.sql` | mcw_bots 컬럼 확장 |

## 구현 사양

ADD COLUMN IF NOT EXISTS 3개 — tone text, persona_traits jsonb default "{}", learning_sources jsonb default "[]". 기존 데이터 보존.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
