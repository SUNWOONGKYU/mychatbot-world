# S7FE2: Primitive 컴포넌트 10종 (Form)

## Task 정보
- **Task ID**: S7FE2
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7FE1
- **Task Agent**: `frontend-developer-core`

## Task 목표

폼 입력에 쓰이는 Primitive 컴포넌트 10종을 구현한다. shadcn/ui + Radix 기반, CVA variant 시스템 사용.

## 컴포넌트 목록

| # | 컴포넌트 | 파일 | variant |
|---|----------|------|---------|
| 1 | Button | `components/ui/button.tsx` | primary, secondary, ghost, outline, destructive, link / sm, md, lg, icon |
| 2 | Input | `components/ui/input.tsx` | default, error, success / sm, md, lg |
| 3 | Select | `components/ui/select.tsx` | Radix 기반 |
| 4 | Checkbox | `components/ui/checkbox.tsx` | Radix 기반, indeterminate 지원 |
| 5 | Radio | `components/ui/radio-group.tsx` | Radix 기반 |
| 6 | Switch | `components/ui/switch.tsx` | Radix 기반, sm/md |
| 7 | Slider | `components/ui/slider.tsx` | Radix 기반, range 지원 |
| 8 | Textarea | `components/ui/textarea.tsx` | auto-resize 옵션 |
| 9 | Label | `components/ui/label.tsx` | Radix 기반 |
| 10 | Field | `components/ui/field.tsx` | Label + Input + Error + Hint 래퍼 |

## 공통 요구사항

- 모든 컴포넌트에 focus-visible ring 토큰 적용
- ARIA 속성 자동 전파 (label 연결, aria-invalid, aria-describedby)
- disabled/readonly 상태 시각적 구분
- 다크 모드 동등 품질

## 성공 기준

- Storybook 또는 `app/_design-system/` 페이지에서 모든 variant 확인 가능
- 키보드만으로 모든 기능 조작 가능
- axe-core 위반 0건
