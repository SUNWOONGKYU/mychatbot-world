# S12BA1: /api/bots 응답 확장

## Task 정보
- **Task ID**: S12BA1
- **Stage**: S12 / **Area**: BA
- **Dependencies**: S12DB1

## 목표
`GET /api/bots` 응답에 포털 탭바 렌더링에 필요한 필드를 추가한다.

## 수정 파일
- `app/api/bots/route.ts`

## 추가 필드
```ts
type BotListItem = {
  id: string;
  name: string;
  avatar_url: string | null;
  order_index: number;       // 신규
  last_active: string | null; // 신규 — conversations.updated_at 최신
  unread_count: number;       // 신규 — 일단 0 고정 (후속 Task)
};
```

## 구현 포인트
- Bearer 인증 유지 (project_wizard_auth_policy)
- ORDER BY order_index ASC, created_at ASC
- last_active: `conversations` 테이블 left join, user_id 매칭되는 최근 updated_at (없으면 null)
- unread_count: 현재 Stage 에선 0 고정 (추후 Stage 에서 마지막 읽음 시간 비교)
