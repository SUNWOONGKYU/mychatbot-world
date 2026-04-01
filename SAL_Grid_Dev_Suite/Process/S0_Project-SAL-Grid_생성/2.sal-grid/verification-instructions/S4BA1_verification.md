# Verification Instruction - S4BA1

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
S4BA1

## Task Name
수익 API (매출·정산 조회)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/revenue/route.ts` 존재
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/revenue/settlement/route.ts` 존재
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/revenue/dashboard/route.ts` 존재
- [ ] 각 파일 상단에 `@task S4BA1` 주석 존재

### 2. 기능 검증
- [ ] `GET /api/revenue` 엔드포인트 구현 — `from`, `to`, `period` 쿼리 파라미터 지원
- [ ] 매출 응답 형식: `{ total, breakdown: [{date, amount, source}] }` 구조 확인
- [ ] 수익 소스 분류 (`subscription`, `tip`, `marketplace`) 구현
- [ ] `GET /api/revenue/settlement` 정산 내역 반환 구현
- [ ] `POST /api/revenue/settlement` 정산 요청 생성, 최소 금액(10,000원) 검증 구현
- [ ] 정산 상태 enum (`pending`, `processing`, `completed`, `failed`) 사용
- [ ] `calculateFee(gross)` 함수 20% 수수료 계산 정확성 확인
- [ ] `GET /api/revenue/dashboard` 통합 집계 데이터 반환 구현

### 3. 인증/보안 검증
- [ ] 비인증 요청 시 401 반환 구현
- [ ] 타인 데이터 접근 방지 (userId 필터) 구현

### 4. 통합 검증
- [ ] S3BA3 의존성: 구독/결제 데이터와 연동 가능한 구조
- [ ] S3SC1 의존성: 인증 미들웨어 호출 확인
- [ ] Supabase 쿼리 사용 (하드코딩 mock 데이터 없음)

### 5. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/` 에 저장되었는가?
- [ ] Production 자동 복사 대상 (BA Area): git commit 시 `api/Backend_APIs/`로 복사

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Backend_APIs/app/api/revenue/"

# Task ID 주석 확인
grep "@task S4BA1" "Process/S4_개발_마무리/Backend_APIs/app/api/revenue/route.ts"

# TypeScript 타입 검사
npx tsc --noEmit

# 수수료 계산 단위 확인 (calculateFee(10000) = 8000)
grep -n "calculateFee\|0\.8\|0\.2\|fee" "Process/S4_개발_마무리/Backend_APIs/app/api/revenue/route.ts"
```

## Expected Results
- 3개 파일이 모두 존재한다
- 매출 조회 API가 날짜 범위 필터를 지원한다
- 수수료 계산 함수가 gross * 0.8 = net 로 동작한다
- 비인증 요청 시 HTTP 401을 반환한다
- 대시보드 API가 집계 데이터를 반환한다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] TypeScript 타입 오류 없음 (`npx tsc --noEmit`)
- [ ] 하드코딩 mock 데이터 없음
- [ ] 인증 미들웨어 적용 확인
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Backend_APIs/`에 저장되었는가?
- [ ] git commit 시 `api/Backend_APIs/`로 자동 복사될 구조인가?
