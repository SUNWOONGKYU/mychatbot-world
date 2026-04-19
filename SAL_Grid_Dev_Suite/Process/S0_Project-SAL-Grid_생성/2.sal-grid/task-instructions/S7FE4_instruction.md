# S7FE4: Composite 컴포넌트

## Task 정보
- **Task ID**: S7FE4
- **Stage**: S7 / **Area**: FE
- **Dependencies**: S7FE2, S7FE3
- **Task Agent**: `frontend-developer-core`

## Task 목표

페이지 레벨에서 반복적으로 쓰이는 Composite 컴포넌트를 구현한다.

## 컴포넌트 목록

### 표현 요소 (6종)

| # | 컴포넌트 | 설명 |
|---|----------|------|
| 1 | Typography | `<Display>`, `<Heading level={1..6}>`, `<Text>`, `<Code>` |
| 2 | Badge | neutral/brand/success/warning/danger/info × solid/subtle |
| 3 | Avatar | 이미지+fallback 이니셜, size sm/md/lg/xl |
| 4 | Icon | lucide-react 래퍼, 크기 토큰 |
| 5 | Spinner | size sm/md/lg, inline/block |
| 6 | Skeleton | 텍스트/원형/직사각형 |

### 구조 요소 (3종)

| # | 컴포넌트 | 설명 |
|---|----------|------|
| 7 | DataTable | 정렬/필터/페이지네이션, TanStack Table 기반 |
| 8 | EmptyState | 아이콘+제목+설명+CTA |
| 9 | PageToolbar | 타이틀+브레드크럼+액션 버튼 정렬 |

## 성공 기준

- Typography는 한글/영문 혼용 최적화 (word-break, line-height)
- DataTable은 10k 행 기준 렌더링 이상 없음 (가상화는 옵션)
- 모든 컴포넌트 다크/라이트 스크린샷 캡처
