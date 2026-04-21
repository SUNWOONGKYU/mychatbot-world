# S11FE1: 공통 셸/네비 모바일 최적화

## Task 정보
- **Task ID**: S11FE1
- **Task Name**: 공통 셸/네비 모바일 최적화
- **Stage**: S11
- **Area**: FE
- **Dependencies**: S11QA1
- **Agent**: `frontend-developer-core`

## Task 목표

모든 페이지가 공통으로 사용하는 셸(`app/layout.tsx`)과 네비 컴포넌트를 390px/768px에서 겹침/가림 없이 동작하도록 조정.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/layout.tsx` | main pb 재검토, safe-area 값 확인 |
| `components/common/navbar.tsx` | 모바일 네비 축약, 4대 메뉴 간격 |
| `components/common/header.tsx` | 햄버거 + 브랜드 로고 간격, 아바타 위치 |
| `components/common/mobile-nav.tsx` | 햄버거 드로어 터치 타겟 ≥44px |
| `components/common/mobile-tab-bar.tsx` | 하단 탭 유지 (기본 48px+safe-area 이미 OK) |
| `components/common/sidebar.tsx` | 데스크탑용이면 모바일에서 숨김 확인 |

## 완료 기준

- 모든 뷰포트(390/768/1024/1440)에서 네비 겹침 없음
- 하단 탭과 컨텐츠 간 24px+ 간격
- 메인 페이지 KPI 4종 모두 PASS
