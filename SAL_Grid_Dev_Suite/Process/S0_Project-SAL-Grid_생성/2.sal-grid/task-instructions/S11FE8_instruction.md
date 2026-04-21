# S11FE8: Bot/Wiki 모바일 최적화

## Task 정보
- **Task ID**: S11FE8
- **Stage**: S11, **Area**: FE
- **Dependencies**: S11FE1
- **Agent**: `frontend-developer-core`

## 대상 페이지

- `app/bot/[botId]/page.tsx` (챗 인터페이스)
- `app/bot/[botId]/wiki/page.tsx`
- `app/bot/[botId]/wiki/lint/page.tsx`
- `app/bot/[botId]/wiki/graph/page.tsx` (시각화)
- `app/bot/faq/page.tsx`

## Task 목표

챗 UI 메시지 영역·입력창 키보드 대응, wiki 리스트·린트 결과 테이블·그래프 시각화를 모바일에서 사용 가능하게 조정.

## 완료 기준

- 챗 메시지 말풍선 max-width 85%
- 입력창 하단 고정, 키보드 오픈 시 자동 스크롤
- Wiki 리스트 1열, 메타데이터 축약
- Graph 페이지는 모바일에서 "전체보기" 버튼 or 가로 스크롤 허용 명시
- FAQ 아코디언 터치 타겟 ≥44px
