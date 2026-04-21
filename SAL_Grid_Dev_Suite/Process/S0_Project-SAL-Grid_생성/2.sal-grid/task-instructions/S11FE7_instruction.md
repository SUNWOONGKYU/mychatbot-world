# S11FE7: Community 계열 모바일 최적화

## Task 정보
- **Task ID**: S11FE7
- **Stage**: S11, **Area**: FE
- **Dependencies**: S11FE1
- **Agent**: `frontend-developer-core`

## 대상 페이지

- `app/community/page.tsx`, `app/community/[id]/page.tsx`
- `app/community/write/page.tsx`
- `app/community/gallery/page.tsx`

## Task 목표

게시글 피드, 상세 페이지(댓글 포함), 글쓰기 에디터, 갤러리 그리드의 모바일 최적화.

## 완료 기준

- 피드 게시글 세로 스택, 썸네일 16:9
- 글쓰기 에디터 툴바 스크롤 가능, 입력 영역 min-height 확보
- 갤러리 1열(<640) / 2열(<1024) / 3열(≥1024)
- 댓글 입력창 키보드 오픈 시 가려지지 않음
