# Verification Instruction - S4T2

---

## Task ID
S4T2

## Task Name
API 통합 테스트

## Verification Agent
qa-specialist

## Verification Criteria

### 1. 테스트 파일 존재 확인
- [ ] tests/api/*.test.js 테스트 파일들 존재
- [ ] Jest 설정 파일 존재
- [ ] 테스트 유틸리티 파일 존재

### 2. 인증 API 테스트 검증
- [ ] 회원가입 API 테스트
- [ ] 로그인 API 테스트
- [ ] 토큰 갱신 API 테스트
- [ ] 로그아웃 API 테스트

### 3. 구독 API 테스트 검증
- [ ] 구독 플랜 조회 테스트
- [ ] 구독 생성 테스트
- [ ] 구독 상태 변경 테스트
- [ ] 구독 해지 테스트

### 4. 결제 API 테스트 검증
- [ ] 결제 수단 등록 테스트
- [ ] 크레딧 충전 테스트
- [ ] 설치비 확인 테스트
- [ ] 결제 내역 조회 테스트

### 5. AI API 테스트 검증
- [ ] AI 서비스 목록 조회 테스트
- [ ] AI 가격 조회 테스트
- [ ] AI 요청 처리 테스트
- [ ] 크레딧 차감 테스트

### 6. 관리자 API 테스트 검증
- [ ] 사용자 목록 조회 테스트
- [ ] 구독 관리 테스트
- [ ] 결제 승인 테스트
- [ ] 통계 조회 테스트

## Test Commands
```bash
# 전체 API 테스트 실행
npm test

# 특정 API 테스트
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=subscription
npm test -- --testPathPattern=payment

# 커버리지 리포트
npm test -- --coverage
```

## Build Verification
- [ ] 테스트 실행 에러 없음
- [ ] 모든 테스트 통과
- [ ] 커버리지 목표 달성 (80% 이상)

## Integration Verification
- [ ] S2BA1 OAuth API 테스트 포함
- [ ] S2BA3 구독 API 테스트 포함
- [ ] S3BA1 AI API 테스트 포함
- [ ] S4BA1 결제 API 테스트 포함

## Expected Files
- S4_개발-3차/Testing/api/*.test.js
- S4_개발-3차/Testing/jest.config.js

## Pass Criteria
- 모든 API 엔드포인트 테스트 통과
- 에러 케이스 테스트 포함
- 테스트 커버리지 80% 이상

---

## 저장 위치 검증 항목
- [ ] S4_개발-3차/Testing/ 폴더에 저장되었는가?

