# Verification Instruction - S4BA6

---

## 필수 참조 규칙 파일 (2025-12-19)

> **검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S4BA6

## Task Name
결제/알림 이메일 템플릿

## Verification Agent
code-reviewer

## Verification Checklist

### 1. 파일 존재 검증
- [ ] lib/email-service.js 존재 (또는 api/email/service.js)
- [ ] 이메일 템플릿 13종 함수 구현 확인

### 2. 결제 관련 템플릿 (5종)
- [ ] receipt - 결제 영수증
  - 금액, 결제일, 결제수단 표시
  - 설치비/크레딧 구분
- [ ] billing-success - 월 구독료 결제 완료
  - 결제 금액, 다음 결제일 표시
- [ ] payment-failure - 결제 실패 안내
  - 실패 사유, 재시도 안내, 결제수단 변경 링크
- [ ] payment-rejected - 입금 확인 불가 안내
  - 거부 사유, 재입금 안내
- [ ] refund-complete - 환불 완료
  - 환불 금액, 처리일 표시

### 3. 크레딧 관련 템플릿 (1종)
- [ ] low-credit - 크레딧 부족 알림
  - 현재 잔액, 충전 링크 포함

### 4. 리텐션 관련 템플릿 (2종)
- [ ] feature-intro - 새 기능 소개
  - 7일+ 미로그인 사용자 대상
- [ ] recharge - 크레딧 충전 유도
  - 잔액 부족 + 미로그인 사용자 대상

### 5. 구독 관련 템플릿 (1종)
- [ ] subscription-suspended - 구독 정지
  - 결제 3회 실패 시 발송
  - 재활성화 안내

### 6. 온보딩 관련 템플릿 (3종)
- [ ] verify-email-reminder - 이메일 인증 리마인더
  - 24시간 미인증 시 발송
- [ ] project-registration-reminder - 첫 프로젝트 등록 유도
  - 가입 후 3일, 프로젝트 0개
- [ ] day7-reminder - 무료 체험 7일차 안내
  - 무료 기간 활용 유도

### 7. 챌린지 관련 템플릿 (1종)
- [ ] challenge-expiry - 챌린지 만료 안내
  - 매월 1일 발송

### 8. 이메일 발송 테스트
- [ ] Resend API 연동 확인
- [ ] 테스트 이메일 발송 성공
- [ ] HTML 렌더링 정상 (이미지, 링크)
- [ ] 모바일 반응형 확인

### 9. 통합 검증
- [ ] S4BA1 (무통장 입금) 연동
  - 입금 요청 시 receipt 템플릿 대기
  - 입금 확인 시 receipt 템플릿 발송
- [ ] S4BA2 (입금 확인) 연동
  - 확인 시 billing-success
  - 거부 시 payment-rejected
- [ ] S4O1 (Cron Jobs) 연동
  - 스케줄 이메일 발송 테스트

## Verification Criteria

### Pass 조건
- 13종 이메일 템플릿 모두 구현
- 각 템플릿에 필수 정보 포함
- Resend API 연동 정상
- 테스트 발송 성공

### Fail 조건
- 템플릿 누락 (1개라도)
- 필수 정보 누락 (금액, 날짜 등)
- API 연동 실패
- HTML 렌더링 오류

## Expected Output
- `lib/email-service.js` (또는 `api/email/service.js`)
- 13종 템플릿 발송 함수

## Remarks
- S2BA2의 welcome, password-reset 템플릿은 별도 유지
- 스팸 필터 방지를 위한 SPF/DKIM 설정 확인 (S2BI3에서 완료)

---

## 작업 결과물 저장 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- S4BA6 → `S4_개발-3차/Backend_APIs/`

### 제2 규칙: Production 코드는 이중 저장
- Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- `Production/api/email/` 에도 저장
