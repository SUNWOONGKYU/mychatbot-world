# S12FE3: TabContext

## Task 정보
- **Task ID**: S12FE3
- **Stage**: S12 / **Area**: FE
- **Dependencies**: S12FE2

## 목표
탭별 대화 상태를 독립적으로 보존하기 위한 React Context + useRef Map.

## 생성 파일
- `components/hub/TabContext.tsx`

## 타입
```ts
type TabState = {
  conv_id: string | null;
  messages: Message[];
  scrollTop: number;
  inputDraft: string;
  streaming: boolean;
  abortController: AbortController | null;
};

type HubContextValue = {
  states: Map<string, TabState>;   // botId -> state (useRef)
  activeId: string | null;
  setActive: (botId: string) => void;
  updateTab: (botId: string, patch: Partial<TabState>) => void;
  clearTab: (botId: string) => void;
};
```

## 구현 포인트
- `useRef<Map<...>>` 로 리렌더 없이 state 보존
- `setActive`: 현재 활성 탭의 `abortController?.abort()` 호출 후 전환
- 탭 이탈 전 `scrollTop`, `inputDraft` 스냅샷 저장
- 재진입 시 스냅샷 복원 (ChatWindow 가 Context 에서 읽어감)
