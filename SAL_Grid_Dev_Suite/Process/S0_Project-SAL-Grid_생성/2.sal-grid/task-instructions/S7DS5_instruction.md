# S7DS5: Semantic 토큰 — Light/Dark 대칭

## Task 정보
- **Task ID**: S7DS5
- **Stage**: S7 / **Area**: DS
- **Dependencies**: S7DS4
- **Task Agent**: `ux-ui-designer-core`

## Task 목표

Primitive 팔레트를 의미 기반 Semantic 토큰으로 매핑한다. Light/Dark 대칭 구조로 설계하여 테마 토글 시 동등한 품질을 보장한다.

## 토큰 카테고리

| 카테고리 | 예시 토큰 |
|----------|----------|
| Surface | `--surface-0` ~ `--surface-4` (elevation 5단) |
| Text | `--fg-primary`, `--fg-secondary`, `--fg-tertiary`, `--fg-disabled` |
| Border | `--border-subtle`, `--border-default`, `--border-strong` |
| Brand | `--brand-solid`, `--brand-solid-hover`, `--brand-subtle`, `--brand-fg` |
| Status | `--success`, `--warning`, `--danger`, `--info` (각 solid/subtle/fg) |
| Ring | `--ring-focus`, `--ring-offset` |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` |

## 산출물

| 파일 | 내용 |
|------|------|
| `Process/S0_*/2.sal-grid/task-results/S7DS5_semantic.md` | 토큰 매핑 표 (Light/Dark) |
| `Process/S0_*/2.sal-grid/task-results/S7DS5_tokens.css` | CSS 변수 스펙 (:root + .dark) |

## 성공 기준

- 모든 Semantic 토큰이 Light/Dark 양쪽에 정의됨
- 모든 텍스트/보더 토큰이 WCAG AA(4.5:1) 이상
- Focus ring은 3:1 이상 (non-text contrast)
