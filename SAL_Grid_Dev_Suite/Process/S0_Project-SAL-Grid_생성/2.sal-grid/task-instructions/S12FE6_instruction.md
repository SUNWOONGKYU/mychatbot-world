# S12FE6: 딥링크 ?tab=botId + localStorage 복원

## Task 정보
- **Task ID**: S12FE6
- **Stage**: S12 / **Area**: FE
- **Dependencies**: S12FE4

## 목표
URL 쿼리 `?tab=botId` 로 특정 탭을 직행 활성화하고, 탭 전환 시 URL 을 동기화한다. 쿼리 없으면 localStorage 의 마지막 탭을 복원한다.

## 수정 파일
- `app/hub/page-client.tsx`

## 구현 포인트
- 초기 활성 탭 결정:
  1. URL ?tab=botId → bots[] 에 존재하면 해당 탭
  2. localStorage.getItem('mcw:hub:lastTab') → 존재 & bots[] 에 있으면 해당 탭
  3. bots[0] 폴백
  4. bots 비어있으면 null
- 탭 전환 시: `router.replace('/hub?tab=' + botId, { scroll: false })` + localStorage 저장
- 봇 삭제된 tab id 참조 시: 첫 번째 봇으로 폴백 + localStorage clear
- pushState 아닌 replaceState → 브라우저 history 오염 방지
