# S12FE4: 활성 탭 전용 ChatWindow 마운트

## Task 정보
- **Task ID**: S12FE4
- **Stage**: S12 / **Area**: FE
- **Dependencies**: S12FE3

## 목표
활성 탭의 ChatWindow 만 DOM 에 마운트한다. 비활성 탭은 unmount 되지만 state 는 Context Map 에 유지.

## 생성/수정 파일
- `components/hub/HubShell.tsx` (TabBar + 활성 ChatWindow)
- `components/hub/TabChatWindow.tsx` (botId prop, Context 에서 state 읽기/쓰기)

## 구현 포인트
- `const Window = React.lazy(() => import('./TabChatWindow'))`
- `<Suspense fallback={<Skeleton/>}><Window key={activeId} botId={activeId} /></Suspense>`
- `key={activeId}` 로 탭 전환 시 교체 (내부 상태 초기화 — 복원은 Context 에서)
- 마운트 시: Context 에서 TabState 복원 → scrollTop 복원 → inputDraft 복원
- unmount 직전: 현재 scrollTop/inputDraft/abortController Context 에 저장
- 목표 전환 시간 <150ms: ChatWindow 번들은 initial hub 번들과 분리

## 주의
- 스트림 진행 중 탭 이탈 시 abort() → 복귀 시 재개 불가 → 사용자에게 토스트 "대화가 일시 중단되었습니다. 마지막 메시지를 다시 보내세요."
