# Verification Instruction - S4BA4

## Task ID
S4BA4

## Task Name
크레딧 충전 API

## Verification Agent
code-reviewer

## Verification Criteria

### 1. API 엔드포인트 확인
- [ ] POST /api/credit/purchase - 크레딧 구매
- [ ] GET /api/credit/balance - 잔액 조회
- [ ] GET /api/credit/history - 충전/사용 내역

### 2. 크레딧 구매 플로우
- [ ] 결제 금액 검증 (서버에서)
- [ ] 토스 결제 API 호출
- [ ] 결제 성공 시 크레딧 추가
- [ ] credit_history 기록

### 3. 크레딧 환산
- [ ] 금액별 크레딧 환산 정확
- [ ] 보너스 크레딧 적용 정확

### 4. 인증/권한 확인
- [ ] 모든 엔드포인트 인증 필요
- [ ] 본인 크레딧만 조회 가능

### 5. 트랜잭션 처리
- [ ] 결제 성공/크레딧 추가 원자적 처리
- [ ] 실패 시 롤백
- [ ] 중복 충전 방지

## Test Commands
```bash
# 크레딧 충전
curl -X POST http://localhost:3000/api/credit/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"payment_method_id":"uuid"}'

# 잔액 조회
curl http://localhost:3000/api/credit/balance \
  -H "Authorization: Bearer $TOKEN"

# 내역 조회
curl http://localhost:3000/api/credit/history \
  -H "Authorization: Bearer $TOKEN"
```

## Build Verification
- [ ] API 파일 문법 오류 없음
- [ ] 토스 결제 연동 정상
- [ ] DB 트랜잭션 정상

## Integration Verification
- [ ] S4D1 credit_history 테이블과 연동
- [ ] S4BA3 결제 수단 사용
- [ ] S4F3 크레딧 충전 UI와 연동
- [ ] S3BA1 AI 사용 시 크레딧 차감

## Expected Files
- Production/Backend_APIs/api/credit/purchase.js
- Production/Backend_APIs/api/credit/balance.js
- Production/Backend_APIs/api/credit/history.js
- S4_개발-3차/Backend_APIs/api/credit/*.js

## Notes
- 결제 실패 시 재시도 로직
- 크레딧 만료 정책 (선택적)
- 관리자 수동 크레딧 부여 기능
