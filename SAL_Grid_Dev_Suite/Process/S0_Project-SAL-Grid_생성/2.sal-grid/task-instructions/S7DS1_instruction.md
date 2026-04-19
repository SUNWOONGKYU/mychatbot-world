# S7DS1: 현행 디자인 진단 리포트

## Task 정보
- **Task ID**: S7DS1
- **Task Name**: 현행 디자인 진단 리포트 (MCW AS-IS 분석)
- **Stage**: S7 (디자인 혁신 v3.0)
- **Area**: DS (Design)
- **Dependencies**: —
- **Task Agent**: `ux-ui-designer-core`

## Task 목표

MCW 프로젝트의 현행 디자인 시스템을 전수 진단하여 "무엇이 부족한가"를 구조화된 보고서로 도출한다. 이후 모든 S7 Task의 베이스라인이 된다.

## 진단 범위

1. **토큰/파운데이션**: `app/globals.css`, `tailwind.config.ts`, `DESIGN.md` v1
2. **컴포넌트 커버리지**: `components/ui/`, `components/common/`
3. **페이지 실사용**: Landing / Home / Login / Signup / Marketplace / Skills / Create / Bot / MyPage / Admin / Jobs / Community (25+ 페이지)
4. **접근성**: Lighthouse A11y 현재값, axe-core 위반 건수
5. **성능**: Lighthouse Performance LCP/CLS/INP

## 산출물

| 파일 | 내용 |
|------|------|
| `Process/S0_*/2.sal-grid/task-results/S7DS1_diagnosis.md` | AS-IS 종합 진단 리포트 |

## 진단 차원

- 컬러: 하드코드 hex / 토큰 일관성 / Light-Dark 대칭성
- 타이포: 스케일 일관성 / letter-spacing / 한글 최적화
- 간격: 8pt grid 준수 / Padding·Gap 표준
- 모션: Duration/Easing 표준화 여부
- 상태: focus/hover/active/disabled 커버리지
- 밀도: 모바일/태블릿/데스크톱 중 취약 지점
- 접근성: ARIA/키보드/contrast 위반 사례

## 평가 방법

Nielsen 10 Heuristics + 자체 5기준 (일관성/위계/피드백/접근성/미학) × 페이지별 0~5점.

## 성공 기준

- 25+ 페이지 전수 스크린샷 첨부
- 문제점 최소 30건 이상 식별, 각 문제점에 영향도(High/Med/Low) 표시
- 경쟁 벤치마크 대비 갭 스코어 표 1장
