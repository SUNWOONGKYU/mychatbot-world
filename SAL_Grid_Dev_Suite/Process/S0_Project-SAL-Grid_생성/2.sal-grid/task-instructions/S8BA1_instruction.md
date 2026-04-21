# S8BA1: 공개 봇 조회 API — RLS 우회 (service_role)

## Task 정보
- **Task ID**: S8BA1
- **Stage**: S8 (런칭 후 사용자 피드백 대응)
- **Area**: BA (Backend APIs)
- **Dependencies**: S7FE9

## Task 목표

비로그인 사용자도 `/bot/[botId]` 페이지에서 봇 정보를 조회할 수 있도록, Supabase RLS(`mcw_bots_select` = owner/admin only)를 우회하는 공개 조회 API를 신설한다.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/bots/public/[username]/route.ts` | service_role_key 기반 단건 조회 + mcw_personas 조인, dm_policy/pairing_code 등 민감 필드 제외 |

## 요구사항

- `GET /api/bots/public/:username` — `:username`을 `id.eq` 또는 `username.eq`로 조회
- `persistSession:false`, `autoRefreshToken:false`로 서버 전용 클라이언트 구성
- 응답: `{ success, data: { bot, personas: [] } }`
- 봇 미존재 시 HTTP 404 (success:false)
- whitelist select로 민감 필드 노출 금지
