# Verification Instruction - S4BA1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S4BA1

## Task Name
무통장 입금 결제 API

## Verification Checklist

### 1. 파일 존재 검증
- [ ] api/payment/confirm.js 존재
- [ ] api/payment/billing-key.js 존재
- [ ] api/payment/auto-charge.js 존재
- [ ] api/payment/cancel.js 존재

### 2. 결제 승인 API 검증
- [ ] POST /api/payment/confirm
- [ ] paymentKey, orderId, amount 필수
- [ ] 토스 API 호출
- [ ] 결제 정보 DB 저장
- [ ] 구독 활성화

### 3. 빌링키 API 검증
- [ ] POST /api/payment/billing-key
- [ ] authKey, customerKey 처리
- [ ] 토스 빌링 API 호출
- [ ] 빌링키 저장

### 4. 자동결제 API 검증
- [ ] Cron 인증 확인
- [ ] 만료 예정 구독 조회
- [ ] 자동 결제 실행
- [ ] 구독 기간 연장

### 5. 결제 취소 API 검증
- [ ] POST /api/payment/cancel
- [ ] paymentKey 필수
- [ ] 토스 취소 API 호출
- [ ] DB 상태 업데이트

## Test Commands
```bash
# 파일 존재 확인
ls -la api/payment/

# 결제 승인 테스트 (테스트 환경)
curl -X POST http://localhost:3000/api/payment/confirm \
  -H "Content-Type: application/json" \
  -d '{"paymentKey":"test","orderId":"test","amount":9900}'
```

## Expected Results
- 결제 API 파일 존재
- 토스 API 연동
- DB 연동 동작

## Verification Agent
backend-developer

## Pass Criteria
- 결제 승인 API 동작
- 빌링키 발급 동작
- 자동결제 로직 정확

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

