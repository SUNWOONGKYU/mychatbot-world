# S7FE6: P1 리디자인 — Marketplace + Skills + Create + Bot

## Task 정보
- **Task ID**: S7FE6
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7FE5
- **Task Agent**: `frontend-developer-core`

## Task 목표

핵심 비즈니스 플로우 페이지를 리디자인한다.

## 대상 페이지

| 페이지 | 경로 | 핵심 변경 |
|--------|------|----------|
| Marketplace | `app/marketplace/*` | Card grid 밀도, 필터 Drawer, 정렬 Toolbar |
| Skills | `app/skills/*` | 스킬 카드 위계, 카테고리 탭, 내 스킬 섹션 |
| Create | `app/birth/*`, `components/create/*` | 8단계 위저드 재설계, Progress indicator, 단계별 Preview |
| Bot | `app/bot/[botId]/*`, `app/bot/faq/*` | 챗봇 대화 UI, 메시지 밀도, FAQ 관리자 |

## 구현 원칙

- Card/Grid는 Composite DataTable 또는 자체 Grid 패턴
- 위저드는 단계별 분리 렌더링, URL 상태 반영
- 대화 UI는 스크롤 성능 우선 (가상화 검토)

## 성공 기준

- Before/After 스크린샷 8쌍
- 위저드 각 단계 독립 접근 가능
- 대화 UI 100개 메시지 기준 60fps 유지
