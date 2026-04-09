# S5DS2: 컬러 시스템 + 디자인 토큰 정의

## Task 정보
- **Task ID**: S5DS2
- **Task Name**: 컬러 시스템 + 디자인 토큰 정의
- **Stage**: S5 (디자인 혁신)
- **Area**: DS (Design)
- **Dependencies**: S4FE3

## Task 목표

MCW 브랜드 정체성을 반영한 컬러 시스템과 디자인 토큰을 정의한다. 퍼플(Primary, AI/기술 신뢰감) + 앰버(Accent, 수익/크리에이터 에너지) 이중 정체성을 기반으로 다크 모드 퍼스트 원칙에 따라 CSS 변수 → Tailwind 매핑 구조를 설계한다.

## 산출물 (이미 완료)

이 Task는 소급(Retroactive) Task로, 기획 산출물이 이미 존재한다.

| 파일 | 내용 |
|------|------|
| `zz_KingFolder/_TalkTodoPlan/2026_04_07__P2_컬러시스템_디자인토큰.md` | 컬러 팔레트 전체 스케일 + globals.css 코드 완료 |

## 주요 설계 내용

1. **Primary 팔레트**: 바이올렛 퍼플 (#5E4BFF 기준, 50~950 스케일)
2. **Accent 팔레트**: 앰버 골드 (#F59E0B 기준, 50~900 스케일)
3. **Neutral 팔레트**: 슬레이트 계열 (다크 bg-base: #0F172A)
4. **Semantic 컬러**: success/warning/error/info (라이트/다크 모드 각각)
5. **globals.css 코드**: :root (라이트) + .dark 구조, RGB 포맷
6. **Tailwind 매핑**: tailwind.config.ts extend 코드

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `zz_KingFolder/_TalkTodoPlan/2026_04_07__P2_컬러시스템_디자인토큰.md` | 신규 생성 (기획 완료) |
