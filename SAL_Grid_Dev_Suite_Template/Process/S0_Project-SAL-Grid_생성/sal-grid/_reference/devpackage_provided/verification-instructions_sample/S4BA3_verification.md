# Verification Instruction - S4BA3

## Task ID
S4BA3

## Task Name
토스페이먼츠 결제 API

## Verification Agent
code-reviewer

## Verification Criteria

### 1. API 엔드포인트 확인
- [ ] POST /api/subscription/payment-method - 등록
- [ ] GET /api/subscription/payment-method - 목록
- [ ] DELETE /api/subscription/payment-method/:id - 삭제
- [ ] PUT /api/subscription/payment-method/:id/default - 기본 설정

### 2. 빌링키 발급 검증
- [ ] 토스페이먼츠 빌링키 발급 API 호출
- [ ] billingKey 저장
- [ ] 카드 정보 마스킹 저장

### 3. 인증/권한 확인
- [ ] 모든 엔드포인트 인증 필요
- [ ] 본인 결제 수단만 접근 가능

### 4. 데이터 검증
- [ ] 빌링키 유효성 확인
- [ ] 중복 카드 방지 (선택적)

### 5. 에러 처리
- [ ] 토스 API 실패: 적절한 에러 메시지
- [ ] 인증 실패: 401
- [ ] 권한 없음: 403
- [ ] 결제 수단 없음: 404

## Test Commands
```bash
# 결제 수단 등록 (테스트 빌링키)
curl -X POST http://localhost:3000/api/subscription/payment-method \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"billingKey":"test_billing_key"}'

# 목록 조회
curl http://localhost:3000/api/subscription/payment-method \
  -H "Authorization: Bearer $TOKEN"
```

## Build Verification
- [ ] API 파일 문법 오류 없음
- [ ] 토스 API 연동 정상
- [ ] DB 저장 정상

## Integration Verification
- [ ] S4D1 결제/크레딧 테이블과 연동
- [ ] S4F4 결제 수단 등록 UI와 연동
- [ ] S4BA4 크레딧 충전 시 사용

## Expected Files
- Production/Backend_APIs/api/subscription/payment-method.js
- Production/Backend_APIs/api/subscription/payment-method/[id].js
- S4_개발-3차/Backend_APIs/api/subscription/payment-method/*.js

## Notes
- 빌링키는 암호화하여 저장
- 카드 정보는 마스킹된 값만 저장
- 토스 웹훅 연동 권장
