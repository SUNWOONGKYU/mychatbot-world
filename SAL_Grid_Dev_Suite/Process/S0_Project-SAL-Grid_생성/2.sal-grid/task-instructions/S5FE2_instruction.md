# S5FE2: 네비게이션 재구축 (상단바 4대 메뉴 + 모바일 탭바)

## Task 정보
- **Task ID**: S5FE2
- **Task Name**: 네비게이션 재구축 (상단바 4대 메뉴 + 모바일 탭바)
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5DS1, S5FE1

## Task 목표

S5DS1 설계에 따라 MCW의 3가지 네비게이션 컴포넌트를 React로 구현한다. 마케팅 상단 GNB, 앱 좌측 사이드바, 모바일 하단 탭바를 각각 독립 컴포넌트로 구현하며, 로그인 상태 분기 및 반응형 동작을 포함한다.

## 구현 항목

1. **MarketingTopNav 컴포넌트**
   - 비로그인/로그인 상태 분기 (무료로 시작하기 ↔ 대시보드 바로가기)
   - 스킬스토어 드롭다운 메뉴 (카테고리 5개)
   - 모바일: 햄버거 메뉴(≡) + 바텀시트/오버레이
   - sticky 포지셔닝, 스크롤 시 배경 변화

2. **AppSidebar 컴포넌트**
   - 4대 메뉴 (Birth/Skills/Jobs/Community) + Home (Learning 메뉴 제거 — 마이페이지 챗봇학습 탭으로 통합)
   - 아코디언 서브메뉴 (활성 메뉴 클릭 시 확장)
   - 너비: 240px ↔ 64px 접기 토글
   - 하단 고정: 수익 현황 / 설정 / 프로필
   - 활성 메뉴: 좌측 컬러 보더 + 배경 하이라이트

3. **MobileBottomNav 컴포넌트**
   - 4개 탭: Home/Birth/Skills/Jobs/Community (Learning 탭 제거)
   - 48px 터치 타겟, 활성 탭 강조
   - 767px 이하에서만 표시

4. **AppLayout 재구성**: 사이드바 + MobileBottomNav + MobileTopHeader 통합

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/nav/MarketingTopNav.tsx` | 신규 생성 |
| `components/nav/AppSidebar.tsx` | 재구축 |
| `components/nav/MobileBottomNav.tsx` | 신규 생성 |
| `components/nav/MobileTopHeader.tsx` | 신규 생성 |
| `components/layouts/AppLayout.tsx` | 네비게이션 통합 재구성 |
| `components/layouts/MarketingLayout.tsx` | MarketingTopNav 적용 |
