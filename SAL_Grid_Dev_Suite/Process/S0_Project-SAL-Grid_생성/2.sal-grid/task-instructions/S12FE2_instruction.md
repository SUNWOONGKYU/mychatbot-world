# S12FE2: PersonaTabBar

## Task 정보
- **Task ID**: S12FE2
- **Stage**: S12 / **Area**: FE
- **Dependencies**: S12FE1

## 목표
포털 상단의 탭 UI 컴포넌트. 최대 10탭 + 11번째 이후 `...▼` 오버플로우 + 마지막에 항상 `+` 탭.

## 생성 파일
- `components/hub/PersonaTabBar.tsx`

## Props
```ts
type Props = {
  bots: BotListItem[];
  activeId: string | null;
  onSelect: (botId: string) => void;
  onAdd: () => void; // + 탭 클릭
};
```

## 구현 포인트
- 탭 하나 = 아바타 + 이름 truncate(최대 12자) + 활성 밑줄
- 10개 초과 시 10개만 노출, 나머지는 `...▼` 버튼 → dropdown 에서 나머지 이름+아바타 리스트
- `+` 탭: 10개 도달 시 `disabled + title="최대 10개까지 추가 가능"` 처리
- 접근성: role=tablist, aria-selected, 탭 간 좌우 arrow key 이동
- 데스크탑 flex, 모바일 overflow-x-auto (S12FE7 에서 sticky + scroll-snap 추가)
- 터치 타겟 44px
