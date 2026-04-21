# S10BA6: 게스트 대화 허용 (URL/QR 접속자 정책)

## Task 정보
- **Task ID**: S10BA6
- **Task Name**: 게스트 대화 허용
- **Stage**: S10
- **Area**: BA
- **Dependencies**: S5BA8

## 배경

`/bot/[botId]` 는 QR/공유 URL 로 접속 가능한 공개 채팅 페이지. 하지만 `/api/chat` 및 `/api/chat/stream` 은 `getUserId()` null 시 401 반환하여 **URL/QR 방문자가 대화를 시작할 수 없는** 차단 상태.

## Task 목표

미인증 사용자에게 `guest-${crypto.randomUUID()}` 형식의 가명 ID 를 발급하여 대화 허용.

- `conversations.user_id` 컬럼은 TEXT, FK 없음 → 무결성 문제 없음
- 위저드(/create) 의 로그인 필수 정책과는 별개
- 이 정책은 메모리에도 반영하여 이후 세션 일관성 유지

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/chat/route.ts` | `const userId = authedUserId ?? \`guest-${crypto.randomUUID()}\`` |
| `app/api/chat/stream/route.ts` | 동일 폴백 추가 |

## 커밋
- `c3c7231 fix(chat): 스트림 RAG 캐스케이드 + 게스트 대화 허용`
