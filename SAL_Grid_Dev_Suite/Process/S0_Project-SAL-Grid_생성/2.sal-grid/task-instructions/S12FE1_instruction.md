# S12FE1: /hub 라우트 스켈레톤

## Task 정보
- **Task ID**: S12FE1
- **Stage**: S12 / **Area**: FE
- **Dependencies**: S12BA1

## 목표
`/hub` 페이지의 최소 골격을 구축한다.

## 생성 파일
- `app/hub/page.tsx` (Server Component, 인증 확인 + 초기 데이터 fetch)
- `app/hub/page-client.tsx` (Client Component, 탭바 + ChatWindow 마운트 영역)

## 구현 포인트
- 미로그인 시 `redirect('/login?redirect=/hub')`
- 서버에서 `/api/bots` 호출하여 bots[] prefetch
- 봇 0개면 "첫 페르소나를 만들어보세요" CTA (→ /create)
- 탭바/Context/ChatWindow 는 빈 placeholder (S12FE2~FE4 에서 채움)
