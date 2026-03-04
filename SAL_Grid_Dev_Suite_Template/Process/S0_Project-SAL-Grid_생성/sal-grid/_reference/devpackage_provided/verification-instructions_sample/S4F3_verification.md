# Verification Instruction - S4F3

## Task ID
S4F3

## Task Name
크레딧 충전 UI

## Verification Agent
code-reviewer

## Verification Criteria

### 1. UI 구성 확인
- [ ] 크레딧 충전 금액 선택 옵션
- [ ] 결제 수단 선택/표시
- [ ] 충전 금액별 크레딧 환산 표시
- [ ] 결제하기 버튼
- [ ] 현재 크레딧 잔액 표시

### 2. 충전 금액 옵션
- [ ] 10,000원 (예: 1,000 크레딧)
- [ ] 30,000원 (예: 3,500 크레딧 - 보너스)
- [ ] 50,000원 (예: 6,000 크레딧 - 보너스)
- [ ] 100,000원 (예: 13,000 크레딧 - 보너스)

### 3. 결제 연동
- [ ] 토스페이먼츠 SDK 로드
- [ ] S4BA4 크레딧 충전 API 호출
- [ ] 결제 성공/실패 처리

### 4. 결제 완료 처리
- [ ] 성공 시 크레딧 잔액 업데이트
- [ ] 성공 시 확인 메시지 표시
- [ ] 실패 시 에러 메시지 표시

### 5. 모바일 반응형
- [ ] 모바일에서 정상 표시
- [ ] 결제 위젯 모바일 최적화

## Test Commands
```bash
# E2E 테스트
npx playwright test credit-purchase.spec.js
```

## Build Verification
- [ ] HTML 문법 오류 없음
- [ ] 토스 SDK 로드 정상
- [ ] JavaScript 에러 없음

## Integration Verification
- [ ] S4BA4 크레딧 충전 API와 연동
- [ ] S4F4 결제 수단 등록 UI와 연동
- [ ] My Page 크레딧 표시와 연동

## Expected Files
- Production/Frontend/pages/credit/purchase.html
- Production/Frontend/assets/js/credit-purchase.js
- S4_개발-3차/Frontend/pages/credit/purchase.html

## Notes
- 테스트 모드와 라이브 모드 환경 구분
- 결제 금액 조작 방지 (서버 검증)
