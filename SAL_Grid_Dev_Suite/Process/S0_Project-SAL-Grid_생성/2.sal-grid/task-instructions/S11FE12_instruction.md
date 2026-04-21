# S11FE12: Admin + 기타 모바일 최적화

## Task 정보
- **Task ID**: S11FE12
- **Stage**: S11, **Area**: FE
- **Dependencies**: S11FE1
- **Agent**: `frontend-developer-core`

## 대상 페이지

- `app/admin/page.tsx`, `app/admin/layout.tsx`

## Task 목표

관리자 대시보드는 주로 데스크탑 사용이지만, 모바일에서도 최소한 가독과 터치 조작 가능하도록 조정.

## 완료 기준

- 관리자 테이블이 수평 스크롤 영역 안에 들어감
- 주요 액션 버튼 ≥44px
- 사이드 필터가 드로어로 전환 (<768px)
- 가로 스크롤이 발생하면 테이블 컨테이너에만 한정
