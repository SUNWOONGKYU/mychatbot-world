# S12FE3 Verification

## 검증 범위
- TabContext 가 탭별 state 독립 보존
- 탭 전환 시 abort + 스냅샷 저장

## 검증 방법
1. `tsc --noEmit` 통과
2. React Testing Library / Playwright: 탭A 에서 inputDraft "hello" 입력 → 탭B 전환 → 탭A 복귀 → input value === "hello"
3. 스크롤 위치 저장/복원 확인
4. 스트리밍 중 탭 전환 → 이전 탭 abortController 호출 여부 확인 (spy)

## 합격 기준
- 상태 복원 100%
- 탭 이탈 시 abort 호출 확인
