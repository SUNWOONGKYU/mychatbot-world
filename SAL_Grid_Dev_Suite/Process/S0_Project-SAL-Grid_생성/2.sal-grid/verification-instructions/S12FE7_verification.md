# S12FE7 Verification

## 검증 범위
- 모바일 390 탭바 가로 스크롤 0 (페이지 자체)
- 탭바 내부 가로 스와이프 가능
- GNB 에 /hub 진입점 추가

## 검증 방법
1. `tsc --noEmit` 통과
2. Playwright viewport 390x844: `body.scrollWidth === document.documentElement.clientWidth`
3. 탭바 영역에서 touchmove X 스와이프 → scrollLeft 변화
4. 활성 탭 scrollIntoView inline:'center' 동작 확인
5. navbar.tsx / mobile-nav.tsx 에 '/hub' 링크 추가 확인
6. 4대 메뉴(Birth/Skills/Jobs/Community) 그대로 유지 (feedback_no_invented_nav)

## 합격 기준
- 페이지 가로 스크롤 0
- GNB 4대 메뉴 무손상 + /hub 보조 링크 존재
