# S7FE3: Primitive 컴포넌트 8종 (Overlay/Navigation)

## Task 정보
- **Task ID**: S7FE3
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7FE1
- **Task Agent**: `frontend-developer-core`

## Task 목표

Overlay/Navigation 계열 Primitive 컴포넌트 8종을 구현한다. 모두 Radix Primitives 기반.

## 컴포넌트 목록

| # | 컴포넌트 | 파일 | 비고 |
|---|----------|------|------|
| 1 | Card | `components/ui/card.tsx` | Header/Body/Footer composition |
| 2 | Dialog | `components/ui/dialog.tsx` | Radix Dialog, focus trap |
| 3 | Drawer | `components/ui/drawer.tsx` | 모바일 Bottom Sheet |
| 4 | Toast | `components/ui/toast.tsx` | sonner 또는 Radix Toast |
| 5 | Tooltip | `components/ui/tooltip.tsx` | Radix Tooltip, 150ms delay |
| 6 | Popover | `components/ui/popover.tsx` | Radix Popover |
| 7 | Tabs | `components/ui/tabs.tsx` | Radix Tabs, keyboard nav |
| 8 | Accordion | `components/ui/accordion.tsx` | Radix Accordion, single/multiple |

## 공통 요구사항

- 모든 Overlay는 `ESC`로 닫기 가능
- 포커스 복원 (Dialog 닫을 때 trigger로)
- 스크롤 잠금 (Dialog/Drawer)
- Portal 경로 통일 (`#overlay-root`)

## 성공 기준

- 모든 컴포넌트 다크/라이트 양쪽에서 동작 확인
- 모바일 viewport에서 Drawer/Dialog 겹침 없음
