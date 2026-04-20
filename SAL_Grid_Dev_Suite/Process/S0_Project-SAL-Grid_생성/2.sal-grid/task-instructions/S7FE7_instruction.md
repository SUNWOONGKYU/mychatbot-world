# S7FE7: P2 리디자인 — MyPage + Admin + Jobs + Community

## Task 정보
- **Task ID**: S7FE7
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7FE6
- **Task Agent**: `frontend-developer-core`

## Task 목표

보조 플로우 페이지를 리디자인하여 S7 전체 화면 일관성을 완성한다.

## 대상 페이지

| 페이지 | 경로 | 핵심 변경 |
|--------|------|----------|
| MyPage | `app/mypage/*`, `components/mypage/Tab*.tsx` | 8탭 통합 디자인, Tab Indicator, 설정 UI 표준화 |
| Admin | `app/admin/*`, `components/home/dashboard.tsx` | KPI 카드, 8섹션 네비, Data Table |
| Jobs | `app/jobs/*` | 리스팅 카드, 상세 페이지, 검색 필터 |
| Community | `app/community/*` | 포럼 리스트, 상세 뷰, 작성 폼 |

## 구현 원칙

- MyPage 8탭은 동일 레이아웃 셸 공유
- Admin은 PageToolbar + DataTable + EmptyState 패턴 적용
- Jobs/Community는 카드 재사용

## 성공 기준

- Before/After 스크린샷 8쌍
- MyPage 탭 전환 지연 없음
- Admin Data Table 정렬/필터 동작
