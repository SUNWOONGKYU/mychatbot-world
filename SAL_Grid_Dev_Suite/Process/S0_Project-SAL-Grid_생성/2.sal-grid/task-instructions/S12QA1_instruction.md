# S12QA1: Playwright E2E (페르소나 포털)

## Task 정보
- **Task ID**: S12QA1
- **Stage**: S12 / **Area**: TS
- **Dependencies**: S12FE5, S12FE6, S12FE7

## 목표
페르소나 포털 전체 사용자 여정을 Playwright 로 자동 검증한다.

## 생성 파일
- `tests/e2e/hub-persona-portal.spec.ts`

## 필수 시나리오 (KPI 대응)

| # | 시나리오 | KPI |
|---|---------|-----|
| 1 | 봇 2개 생성 후 /hub 접속 → 두 탭 모두 렌더 | KPI1 |
| 2 | 탭1 활성 → 탭2 클릭 → performance.now() 차이 <150ms | KPI2 |
| 3 | 탭1 에서 스크롤 + 메시지 2개 입력 → 탭2 → 탭1 복귀 → 스크롤/입력/메시지 그대로 | KPI3 |
| 4 | `/hub?tab=<botId>` 접속 → 해당 탭 즉시 활성 | KPI4 |
| 5 | viewport 390x844 → body scrollWidth === clientWidth (가로 스크롤 0) + 탭 44px | KPI5 |
| 6 | 활성 탭 ChatWindow 만 DOM 에 존재 (`document.querySelectorAll('.chat-window').length === 1`) | KPI6 |
| 7 | `+` 탭 클릭 → 위저드 모달 오픈 → Step1 표시 | KPI7 |
| 8 | 10개 봇 상태에서 `+` 탭 disabled + 11번째 이후 ...▼ 드롭다운 | 상한 |

## 실행
- TEST_USER_EMAIL / TEST_USER_PASSWORD env 필요
- `npm run test:e2e -- hub-persona-portal.spec.ts`

## 산출
- 스크린샷 5종 (데스크탑/모바일 각 포털 상태)
- 측정값 JSON (`tests/e2e/output/hub-metrics.json`)
