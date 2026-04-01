# Verification Instruction - S4BA2

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
S4BA2

## Task Name
결제 시스템 (결제수단 관리, 크레딧)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/payment/route.ts` 존재
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/payment/credit/route.ts` 존재
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/payment/method/route.ts` 존재
- [ ] 각 파일 상단에 `@task S4BA2` 주석 존재

### 2. 기능 검증
- [ ] `GET /api/payment/credit` 잔액 조회 구현
- [ ] `POST /api/payment/credit` 크레딧 충전 및 이력 기록 구현
- [ ] 크레딧 부족 시 402 반환 구현
- [ ] `GET /api/payment/method` 결제수단 목록 반환
- [ ] `POST /api/payment/method` 결제수단 등록, 카드 번호 마스킹 구현
- [ ] `DELETE /api/payment/method/:id` 기본 결제수단 삭제 불가(400) 검증
- [ ] `GET /api/payment` 페이지네이션 적용 이력 반환
- [ ] `calculateApiCost` 함수 마진 30% 적용 확인

### 3. 보안 검증
- [ ] 카드 번호 원본이 DB 저장 또는 응답에 포함되지 않음 확인
- [ ] 마스킹 처리: 끝 4자리만 포함된 형태 (`****-****-****-1234`)
- [ ] 비인증 요청 시 401 반환

### 4. 통합 검증
- [ ] S1DB2 의존성: 크레딧/결제 관련 테이블 사용
- [ ] S3SC1 의존성: 인증 미들웨어 적용 확인
- [ ] Supabase 쿼리 사용 (하드코딩 mock 없음)

### 5. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/` 에 저장되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Backend_APIs/app/api/payment/"

# 카드 마스킹 처리 확인 (원본 저장 금지)
grep -n "cardNumber\|card_number\|fullNumber" \
  "Process/S4_개발_마무리/Backend_APIs/app/api/payment/method/route.ts"

# 30% 마진 계산 확인
grep -n "1\.3\|0\.3\|calculateApiCost" \
  "Process/S4_개발_마무리/Backend_APIs/app/api/payment/credit/route.ts"

# TypeScript 타입 검사
npx tsc --noEmit
```

## Expected Results
- 3개 파일이 모두 존재한다
- 카드 번호 원본이 어디에도 저장되지 않는다
- 크레딧 부족 시 HTTP 402를 반환한다
- `calculateApiCost`가 1.3배 계산을 수행한다
- 페이지네이션이 결제 이력에 적용된다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 카드 번호 마스킹 보안 검증 통과
- [ ] TypeScript 타입 오류 없음
- [ ] 인증 미들웨어 적용 확인
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Backend_APIs/`에 저장되었는가?
- [ ] git commit 시 `api/Backend_APIs/`로 자동 복사될 구조인가?
