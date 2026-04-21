# S11FE9: MyPage & Business 모바일 최적화

## Task 정보
- **Task ID**: S11FE9
- **Stage**: S11, **Area**: FE
- **Dependencies**: S11FE1
- **Agent**: `frontend-developer-core`

## 대상 페이지

- `app/mypage/page.tsx`, `app/mypage/layout.tsx` (**사이드바 건드리지 않음** — 이미 최근 수정 완료)
- `app/mypage/inheritance/page.tsx`
- `app/mypage/inheritance-accept/page.tsx`
- `app/business/page.tsx`, `app/business/layout.tsx`
- `app/business/revenue/page.tsx`
- `app/business/settlement/page.tsx`

## Task 목표

마이페이지 9탭 컨텐츠 영역(사이드바 외), 상속 페이지, 비즈니스 수익/정산 대시보드의 모바일 최적화.

## ⚠️ 제약

- **`app/mypage/layout.tsx`와 사이드바 관련 CSS는 수정 금지** (2d3c7c5, 02ee265, d1f18d7 최근 커밋 유지)
- 변경은 탭별 컨텐츠 영역에 한정

## 완료 기준

- 9탭 컨텐츠 각각 390px 가로 스크롤 없음
- 상속 동의 페이지 버튼/동의 체크박스 터치 편의
- 비즈니스 수익/정산 테이블 수평 스크롤 명시 허용 (또는 카드형 전환)
