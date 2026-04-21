# S10BA2: bot-skills CRUD API

## Task 정보
- **Task ID**: S10BA2
- **Task Name**: bot-skills CRUD API
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: BA
- **Dependencies**: S10DB1
- **Agent**: `api-developer-core`

## Task 목표

/api/bots/[id]/skills GET/POST/DELETE — 봇에 마운트된 스킬 관리.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/bots/[id]/skills/route.ts` | bot-skills CRUD API |

## 구현 사양

GET: mcw_bot_skills 조인. POST: {skill_id, config} upsert. DELETE: ?skill_id= 로 해제. 소유권 체크.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
