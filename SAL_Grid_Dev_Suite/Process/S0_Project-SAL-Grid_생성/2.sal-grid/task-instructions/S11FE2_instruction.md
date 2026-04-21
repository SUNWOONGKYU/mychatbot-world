# S11FE2: 인증 페이지 모바일 최적화

## Task 정보
- **Task ID**: S11FE2
- **Task Name**: 인증 페이지 모바일 최적화
- **Stage**: S11
- **Area**: FE
- **Dependencies**: S11QA1
- **Agent**: `frontend-developer-core`

## 대상 페이지

- `app/login/page.tsx`, `app/login/layout.tsx`
- `app/signup/page.tsx`, `app/signup/layout.tsx`
- `app/reset-password/page.tsx` (+ `page-client.tsx`)
- `app/auth/callback/page.tsx`
- `app/auth/confirm/page.tsx`

## Task 목표

폼 필드 가독성, 입력창 터치 타겟 크기, 키보드 오픈 시 뷰포트 대응, 에러 메시지 레이아웃을 390px에서 최적화.

## 완료 기준

- 입력 필드 높이 ≥44px, 폰트 ≥16px (iOS zoom 방지)
- 가로 스크롤 없음
- 키보드 오픈 시 버튼 가려지지 않음 (padding 확보)
- 에러/알림 영역이 화면 밖으로 나가지 않음
