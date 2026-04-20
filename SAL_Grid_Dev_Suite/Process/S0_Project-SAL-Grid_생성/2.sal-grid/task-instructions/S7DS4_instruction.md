# S7DS4: Primitive 토큰 — OKLCH 팔레트

## Task 정보
- **Task ID**: S7DS4
- **Stage**: S7 / **Area**: DS
- **Dependencies**: S7DS3
- **Task Agent**: `ux-ui-designer-core`

## Task 목표

OKLCH 색공간 기반 Primitive 팔레트를 설계한다. 이후 Semantic 토큰(S7DS5)의 원자재가 된다.

## 팔레트 구성

| 팔레트 | 단계 | 용도 |
|--------|------|------|
| Neutral (Gray) | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000 | 표면/텍스트/보더 |
| Brand (Violet) | 50~950 (12단) | 1차 브랜드 |
| Accent (Amber) | 50~950 (12단) | 강조/포인트 |
| Success (Green) | 50~950 | 성공 상태 |
| Warning (Yellow) | 50~950 | 주의 상태 |
| Danger (Red) | 50~950 | 오류/파괴 상태 |
| Info (Blue) | 50~950 | 정보 상태 |

## 설계 규칙

- OKLCH `L` 값 균등 간격 (50=0.97, 500=0.55, 950=0.15 근처 기준)
- Chroma: Neutral은 0.02 이하, Brand/Accent는 각 계열 중앙값에서 피크
- Hue: 단계별 ±2° 이내 유지 (일관성)

## 산출물

| 파일 | 내용 |
|------|------|
| `Process/S0_*/2.sal-grid/task-results/S7DS4_primitives.md` | 팔레트 표 + OKLCH 값 + hex 변환 |
| `Process/S0_*/2.sal-grid/task-results/S7DS4_palette.svg` | 시각 스웨치 |

## 성공 기준

- 모든 단계 OKLCH/HEX 값 명시
- Light/Dark 모두 사용 가능한 명도 범위 커버
- WCAG 대비 표(background 대비 text) 포함
