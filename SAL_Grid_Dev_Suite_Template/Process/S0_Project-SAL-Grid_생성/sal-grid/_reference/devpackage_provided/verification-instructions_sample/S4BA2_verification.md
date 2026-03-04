# Verification Instruction - S4BA2

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S4BA2

## Task Name
입금 확인 API (관리자용)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] api/webhook/toss-payments.js 존재
- [ ] api/webhook/retry-failed.js 존재

### 2. 웹훅 핸들러 검증
- [ ] POST /api/webhook/toss-payments
- [ ] 서명 검증 (toss-signature)
- [ ] 이벤트 타입별 처리

### 3. 이벤트 처리 검증
- [ ] PAYMENT_STATUS_CHANGED 처리
- [ ] BILLING_STATUS_CHANGED 처리
- [ ] DEPOSIT_CALLBACK 처리

### 4. 웹훅 로깅 검증
- [ ] webhook_logs 테이블 존재
- [ ] 웹훅 데이터 저장
- [ ] 처리 상태 기록

### 5. 재시도 핸들러 검증
- [ ] 실패한 웹훅 조회
- [ ] 재처리 로직
- [ ] 처리 완료 표시

## Test Commands
```bash
# 파일 존재 확인
ls -la api/webhook/

# 웹훅 테스트 (서명 포함)
curl -X POST http://localhost:3000/api/webhook/toss-payments \
  -H "Content-Type: application/json" \
  -H "toss-signature: <signature>" \
  -d '{"eventType":"PAYMENT_STATUS_CHANGED","data":{}}'
```

## Expected Results
- 웹훅 핸들러 동작
- 서명 검증 동작
- 이벤트 처리 동작

## Verification Agent
backend-developer

## Pass Criteria
- 서명 검증 정확
- 이벤트별 처리 동작
- 웹훅 로깅 동작

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

