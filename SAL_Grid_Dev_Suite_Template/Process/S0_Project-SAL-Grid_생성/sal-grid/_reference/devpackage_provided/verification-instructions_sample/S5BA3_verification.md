# S5BA3: 크레딧 차감 기능 구현 - 검증 지침

## 검증 정보
- **Task ID**: S5BA3
- **Verification Agent**: code-reviewer

## 검증 항목

### 1. 코드 검증
- [ ] `getUserCreditBalance()` 함수가 올바르게 잔액 조회하는가
- [ ] `getModelCreditCost()` 함수가 api_costs 테이블에서 비용 조회하는가
- [ ] `deductCredits()` 함수가 원자적으로 차감 처리하는가
- [ ] 크레딧 이력이 `credit_history` 테이블에 기록되는가
- [ ] `api_usage_log.cost_credits` 필드에 비용이 기록되는가

### 2. 에러 처리 검증
- [ ] 잔액 부족 시 402 응답이 반환되는가
- [ ] 에러 응답에 `required`, `balance` 정보가 포함되는가
- [ ] DB 오류 시 적절한 폴백 처리가 되는가

### 3. 기능 테스트
- [ ] 충분한 크레딧으로 AI Q&A 호출 시 정상 차감
- [ ] 부족한 크레딧으로 호출 시 402 응답
- [ ] 차감 후 `users.credit_balance` 감소 확인
- [ ] `credit_history` 레코드 생성 확인

### 4. 통합 검증
- [ ] 기존 AI Q&A 기능이 정상 작동하는가
- [ ] 인증되지 않은 사용자 처리가 적절한가
- [ ] 모델별 다른 비용이 적용되는가

## 통과 기준

1. 모든 코드 검증 항목 통과
2. 에러 처리가 적절함
3. 실제 크레딧 차감 동작 확인
4. 기존 기능 회귀 없음

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |
