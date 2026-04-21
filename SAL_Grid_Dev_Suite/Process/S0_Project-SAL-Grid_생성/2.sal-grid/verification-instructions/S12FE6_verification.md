# S12FE6 Verification

## 검증 범위
- ?tab=botId 딥링크 활성화
- localStorage 마지막 탭 복원
- 유효하지 않은 botId 폴백

## 검증 방법
1. `tsc --noEmit` 통과
2. Playwright: `/hub?tab=<validId>` → 해당 탭 활성
3. 탭 전환 → URL replace 확인 (history 엔트리 증가 0)
4. localStorage 에 `mcw:hub:lastTab` 저장 확인
5. `/hub?tab=deleted-id` → 첫 번째 봇 폴백 + localStorage clear

## 합격 기준
- 4 시나리오 PASS
