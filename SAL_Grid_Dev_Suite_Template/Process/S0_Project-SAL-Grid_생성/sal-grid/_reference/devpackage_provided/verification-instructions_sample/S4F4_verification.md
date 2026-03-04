# Verification Instruction - S4F4

## Task ID
S4F4

## Task Name
결제 수단 등록 UI

## Verification Agent
code-reviewer

## Verification Criteria

### 1. UI 구성 확인
- [ ] 카드 정보 입력 섹션
- [ ] 토스페이먼츠 빌링 위젯
- [ ] 등록된 결제 수단 목록
- [ ] 결제 수단 삭제 버튼
- [ ] 기본 결제 수단 선택

### 2. 카드 등록 플로우
- [ ] 토스 빌링 위젯 로드
- [ ] 카드 정보 입력 (토스에서 처리)
- [ ] 등록 완료 후 목록에 추가
- [ ] 빌링키 발급 완료

### 3. 등록된 결제 수단 표시
- [ ] 카드 종류 아이콘
- [ ] 카드 번호 마스킹 (****-****-****-1234)
- [ ] 유효기간 표시
- [ ] 기본 결제 수단 표시

### 4. 결제 수단 관리
- [ ] 삭제 기능 (확인 모달)
- [ ] 기본 결제 수단 변경
- [ ] 최소 1개 유지 (정기결제 시)

### 5. 보안 검증
- [ ] 카드 정보 클라이언트 저장 금지
- [ ] HTTPS 필수
- [ ] XSS 방지

## Test Commands
```bash
# E2E 테스트
npx playwright test payment-method.spec.js

# 접근성 테스트
npx axe pages/subscription/payment-method.html
```

## Build Verification
- [ ] HTML 문법 오류 없음
- [ ] 토스 빌링 SDK 로드 정상
- [ ] JavaScript 에러 없음

## Integration Verification
- [ ] S4BA3 결제 수단 등록 API와 연동
- [ ] S4F3 크레딧 충전 UI와 연동
- [ ] My Page 결제 수단 섹션과 연동

## Expected Files
- Production/Frontend/pages/subscription/payment-method.html
- Production/Frontend/assets/js/payment-method.js
- S4_개발-3차/Frontend/pages/subscription/payment-method.html

## Notes
- 토스 테스트/라이브 환경 구분
- PCI-DSS 컴플라이언스 준수 (토스가 처리)
- 결제 약관 동의 필요
