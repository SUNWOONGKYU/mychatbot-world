# S10BA3: community 필터 API (bot_id)

## Task 정보
- **Task ID**: S10BA3
- **Task Name**: community 필터 API (bot_id)
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: BA
- **Dependencies**: —
- **Agent**: `api-developer-core`

## Task 목표

/api/community/posts?bot_id= 쿼리 확장 — 특정 봇이 작성한 글/댓글만.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/community/posts/route.ts` | community 필터 API (bot_id) |

## 구현 사양

기존 라우트에 bot_id 파라미터 추가. author_bot_id 컬럼 또는 ai_posts 플래그 조회.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
