# S11FE6: Jobs 계열 모바일 최적화

## Task 정보
- **Task ID**: S11FE6
- **Stage**: S11, **Area**: FE
- **Dependencies**: S11FE1
- **Agent**: `frontend-developer-core`

## 대상 페이지

- `app/jobs/page.tsx`, `app/jobs/[id]/page.tsx`
- `app/jobs/create/page.tsx`
- `app/jobs/search/page.tsx`, `app/jobs/match/page.tsx`
- `app/jobs/hire/page.tsx`

## Task 목표

채용 카드 리스트, 상세 페이지(스크롤 많음), 생성 폼(post_type 분기 포함), 매칭 UI의 모바일 레이아웃 정비.

## 완료 기준

- 채용 카드 1열 + 고정 높이 제거 (컨텐츠 길이 맞춤)
- 상세 페이지 섹션 구분선 명확
- 생성 폼 입력 필드 ≥44px, post_type 토글 터치 편의
- 매칭 결과 카드 수직 스택
