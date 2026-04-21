# S12QA1 Verification

## 검증 범위
- tests/e2e/hub-persona-portal.spec.ts 존재
- 8개 시나리오 전부 green
- MBO KPI 8종 실측값 기록

## 검증 방법
1. 파일 존재 확인
2. `npm run test:e2e -- hub-persona-portal.spec.ts` (TEST_USER env 제공 시)
3. output JSON 에 각 KPI 실측값 기록
4. 스크린샷 5장 첨부

## 합격 기준
- 8/8 시나리오 PASS
- 탭 전환 중앙값 <150ms
- 모바일 390 가로 스크롤 0
- hub-metrics.json 생성
