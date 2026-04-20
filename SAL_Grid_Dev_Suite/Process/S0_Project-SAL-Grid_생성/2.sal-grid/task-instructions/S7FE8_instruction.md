# S7FE8: Motion 시스템 적용

## Task 정보
- **Task ID**: S7FE8
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7FE4
- **Task Agent**: `frontend-developer-core`

## Task 목표

Framer Motion + CSS 전역 Transition 으로 통일된 모션 시스템을 구축한다. 장식이 아닌 "안내로서의 모션"을 구현한다.

## 토큰

### Duration
| 이름 | 값 | 용도 |
|------|-----|------|
| `--motion-75` | 75ms | 즉각 피드백 (tap, toggle) |
| `--motion-150` | 150ms | 빠른 전환 (hover, focus) |
| `--motion-250` | 250ms | 기본 전환 (modal, toast) |
| `--motion-350` | 350ms | 페이지 전환 |
| `--motion-500` | 500ms | 축하/주목 |

### Easing
| 이름 | 곡선 | 용도 |
|------|------|------|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | 일반 전환 |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | 사라지는 요소 |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | 나타나는 요소 |

## 프리셋

- `fadeInUp`, `fadeInScale`, `slideInRight`, `listStagger`
- `lib/motion.ts` 로 변형 variants export

## Reduced Motion

`@media (prefers-reduced-motion: reduce)` 에서는 모든 transform/opacity 애니메이션 무효화, duration 0.01ms.

## 성공 기준

- 모든 페이지가 공통 프리셋 사용 (Framer 직접 사용 금지)
- 60fps 유지 (Chrome DevTools Performance)
- Reduced Motion 시 애니메이션 없음 확인
