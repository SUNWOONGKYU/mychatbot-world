# Verification Instruction - S4TS2

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S4TS2

## Task Name
API 단위 테스트 확장

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Testing/tests/unit/revenue.test.ts` 존재
- [ ] `Process/S4_개발_마무리/Testing/tests/unit/payment.test.ts` 존재
- [ ] `Process/S4_개발_마무리/Testing/tests/unit/inheritance.test.ts` 존재

### 2. 수익 테스트 검증 (`revenue.test.ts`)
- [ ] `calculateFee` 함수 20% 수수료 계산 테스트 존재
- [ ] 0원 입력 시 0 반환 테스트 존재
- [ ] 매출 조회 API 비인증 시 401 테스트 존재
- [ ] 정산 최소 금액(10,000원) 미만 시 400 테스트 존재
- [ ] Supabase 모킹(`vi.mock`) 적용 확인

### 3. 결제 테스트 검증 (`payment.test.ts`)
- [ ] `calculateApiCost` 마진 30% 계산 테스트 존재
- [ ] 잔액 부족 시 402 반환 테스트 존재
- [ ] 카드 번호 마스킹 처리 테스트 존재
- [ ] 마스킹 후 원본이 응답에 없음을 검증하는 테스트 존재

### 4. 피상속 테스트 검증 (`inheritance.test.ts`)
- [ ] 유효하지 않은 이메일 형식 검증 테스트 존재
- [ ] 동의 수락 상태 `accepted` 업데이트 테스트 존재
- [ ] 동의 거부 상태 `declined` 업데이트 테스트 존재
- [ ] 이미 처리된 요청 409 반환 테스트 존재

### 5. 모킹 전략 검증
- [ ] Supabase 클라이언트 `vi.mock` 전역 모킹 적용
- [ ] 인증 미들웨어 모킹 적용 (세션 주입)
- [ ] 실제 DB 연결 없이 테스트 실행 가능

### 6. 통합 검증
- [ ] S4BA1, S4BA2, S4BA3 의존 API 로직이 테스트됨
- [ ] `npx vitest run tests/unit` 명령으로 전체 통과

## Test Commands
```bash
# Vitest 설치 확인
npx vitest --version

# 테스트 케이스 수 확인 (최소 20개 목표)
grep -c "it\|test\(" \
  "Process/S4_개발_마무리/Testing/tests/unit/revenue.test.ts" \
  "Process/S4_개발_마무리/Testing/tests/unit/payment.test.ts" \
  "Process/S4_개발_마무리/Testing/tests/unit/inheritance.test.ts"

# 모킹 적용 확인
grep -n "vi.mock\|vitest" \
  "Process/S4_개발_마무리/Testing/tests/unit/revenue.test.ts"

# 수수료 20% 테스트 존재 확인
grep -n "calculateFee\|0\.8\|8000" \
  "Process/S4_개발_마무리/Testing/tests/unit/revenue.test.ts"
```

## Expected Results
- 3개 테스트 파일이 존재한다
- 총 20개 이상의 테스트 케이스가 구현된다
- Supabase 모킹이 적용되어 실제 DB 없이 실행 가능하다
- `calculateFee`와 `calculateApiCost` 함수가 수학적으로 검증된다

## Verification Agent
qa-specialist

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 총 20개 이상 테스트 케이스
- [ ] Supabase 모킹 적용으로 환경 독립적 실행 가능
- [ ] 핵심 비즈니스 로직(수수료, 마진, 마스킹) 검증됨
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Testing/`에 저장되었는가?
- [ ] Testing Area는 Production 자동 복사 대상이 아님을 확인
