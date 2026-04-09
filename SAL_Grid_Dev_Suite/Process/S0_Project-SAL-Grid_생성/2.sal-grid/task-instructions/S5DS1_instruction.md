# S5DS1: 네비게이션 구조 설계

## Task 정보
- **Task ID**: S5DS1
- **Task Name**: 네비게이션 구조 설계
- **Stage**: S5 (디자인 혁신)
- **Area**: DS (Design)
- **Dependencies**: S4FE3

## Task 목표

MCW 전면 리디자인을 위한 네비게이션 구조를 설계한다. 마케팅 페이지용 상단 GNB, 앱 내부용 좌측 사이드바, 모바일 하단 탭바의 3가지 네비게이션 패턴을 정의하고 로그인 전/후 분기 처리, 반응형 브레이크포인트(모바일/태블릿/데스크탑)를 포함한 완전한 네비게이션 설계 문서를 작성한다.

## 산출물 (이미 완료)

이 Task는 소급(Retroactive) Task로, 기획 산출물이 이미 존재한다.

| 파일 | 내용 |
|------|------|
| `zz_KingFolder/_TalkTodoPlan/2026_04_07__P1_네비게이션_구조_설계.md` | 전체 네비게이션 구조 설계 완료 |

## 주요 설계 내용

1. **마케팅 상단 GNB**: 비로그인/로그인 상태 분기, 스킬스토어 드롭다운
2. **앱 좌측 사이드바**: 5대 메뉴(Birth/Learning/Skills/Jobs/Community) + Home + 수익현황 + 설정
3. **모바일 하단 탭바**: 5개 탭(Home/Birth/Skills/Jobs/Community), 48px 터치 타겟
4. **React 컴포넌트 구조**: MarketingTopNav / AppSidebar / MobileBottomNav / MobileTopHeader
5. **라우트 분기**: MarketingLayout / AppLayout / AuthLayout

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `zz_KingFolder/_TalkTodoPlan/2026_04_07__P1_네비게이션_구조_설계.md` | 신규 생성 (기획 완료) |
