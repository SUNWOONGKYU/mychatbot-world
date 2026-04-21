# S12FE5 Verification

## 검증 범위
- + 탭 → Birth 위저드 모달 오픈
- 완료 시 신규 탭 추가 + 활성화
- 10개 상한 시 disabled

## 검증 방법
1. `tsc --noEmit` 통과
2. Playwright: + 탭 클릭 → Step1 표시
3. Step1~Step8 진행 → 완료 → 새 탭이 맨 오른쪽 추가 + 활성
4. 봇 10개 상태 → + 탭 disabled
5. 위저드 도중 esc → confirm 노출

## 합격 기준
- 4 시나리오 PASS
