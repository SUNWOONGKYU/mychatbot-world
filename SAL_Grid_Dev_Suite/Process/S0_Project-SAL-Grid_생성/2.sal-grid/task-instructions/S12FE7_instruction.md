# S12FE7: 모바일 탭바 + GNB 진입점

## Task 정보
- **Task ID**: S12FE7
- **Stage**: S12 / **Area**: FE
- **Dependencies**: S12FE4

## 목표
(1) PersonaTabBar 모바일 최적화, (2) 글로벌 GNB 에 포털 진입점 추가.

## 수정 파일
- `components/hub/PersonaTabBar.tsx` (모바일 스타일 보강)
- `components/common/navbar.tsx` (진입점 추가)
- `components/common/mobile-nav.tsx` (모바일 드로어)

## 구현 포인트 — 모바일 탭바
- `overflow-x-auto scroll-smooth snap-x snap-mandatory` + 각 탭 `snap-start`
- `sticky top-0 z-20` + 반투명 배경 + backdrop-blur
- 390px 에서 2~3개 탭만 보이도록 min-w 설정 (사용자 스와이프로 탐색)
- 활성 탭 자동 scrollIntoView({ block: 'nearest', inline: 'center' })
- 44px 터치 타겟

## 구현 포인트 — GNB 진입점
- navbar.tsx 4대 메뉴(Birth/Skills/Jobs/Community) 는 그대로 유지 (feedback_no_invented_nav)
- 우측 프로필 드롭다운 또는 로그인 상태 시에만 노출되는 보조 링크로 "내 봇" 또는 "포털" 추가 (/hub)
- mobile-nav 에도 동일 링크 추가
