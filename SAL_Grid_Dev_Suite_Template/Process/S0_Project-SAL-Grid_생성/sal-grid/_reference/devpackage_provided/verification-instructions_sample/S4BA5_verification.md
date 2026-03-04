# Verification Instruction - S4BA5

## Task ID
S4BA5

## Task Name
설치비 입금 확인 API

## Verification Agent
code-reviewer

## Verification Criteria

### 1. API 엔드포인트 확인
- [ ] POST /api/payment/installation-confirm - 사용자가 입금 완료 알림
- [ ] POST /api/admin/confirm-installation - 관리자가 입금 확인
- [ ] GET /api/payment/installation-status - 설치비 상태 조회

### 2. 사용자 입금 알림 플로우
- [ ] 입금 완료 버튼 클릭 시 호출
- [ ] 입금 대기 상태로 변경
- [ ] 관리자에게 알림 (이메일/대시보드)

### 3. 관리자 입금 확인
- [ ] 관리자 권한 필수
- [ ] 입금 확인 시 프로젝트 활성화
- [ ] 사용자에게 알림 발송

### 4. 상태 관리
- [ ] pending: 미입금
- [ ] awaiting_confirmation: 입금 알림 (확인 대기)
- [ ] confirmed: 입금 확인 완료
- [ ] rejected: 입금 거부 (금액 불일치 등)

### 5. 보안 검증
- [ ] 관리자 API는 관리자만 접근
- [ ] 상태 변경 로깅

## Test Commands
```bash
# 사용자: 입금 완료 알림
curl -X POST http://localhost:3000/api/payment/installation-confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"uuid"}'

# 관리자: 입금 확인
curl -X POST http://localhost:3000/api/admin/confirm-installation \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"uuid","confirmed":true}'
```

## Build Verification
- [ ] API 파일 문법 오류 없음
- [ ] 권한 검증 로직 정상
- [ ] 상태 변경 로직 정상

## Integration Verification
- [ ] S4D1 billing_history 테이블과 연동
- [ ] S4F1 관리자 대시보드에서 확인 가능
- [ ] S2BA2 이메일 알림 연동

## Expected Files
- Production/Backend_APIs/api/payment/installation-confirm.js
- Production/Backend_APIs/api/payment/installation-status.js
- Production/Backend_APIs/api/admin/confirm-installation.js
- S4_개발-3차/Backend_APIs/api/payment/*.js
- S4_개발-3차/Backend_APIs/api/admin/confirm-installation.js

## Notes
- 입금 금액 수동 확인 필요 (무통장입금)
- 입금 확인 기한 설정 권장
- 거부 사유 기록
