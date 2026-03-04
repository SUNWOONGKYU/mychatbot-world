# S4 Stage PO 테스트 가이드

**Stage:** S4 - 개발 3차 (Payment & Admin)
**작성일:** 2025-12-20

---

## 1. 테스트 전 필수 설정

### 1.1 DB 테이블 생성 (필수)

Supabase SQL Editor에서 아래 파일들을 **순서대로** 실행:

```
1. S4_개발-3차/Database/S4D1_users_credit_column.sql
2. S4_개발-3차/Database/S4D1_payment_methods.sql
3. S4_개발-3차/Database/S4D1_billing_history.sql
4. S4_개발-3차/Database/S4D1_credit_history.sql
5. S4_개발-3차/Database/S4D1_ai_pricing.sql
6. S4_개발-3차/Database/S4D1_api_usage_log.sql
7. S4_개발-3차/Database/S4D1_installation_payments.sql
```

### 1.2 Admin 사용자 설정 (필수)

Supabase SQL Editor에서 실행:

```sql
-- PO 계정을 Admin으로 설정
UPDATE users
SET role = 'admin'
WHERE email = '[PO 이메일 주소]';
```

### 1.3 Toss Payments 설정 (선택)

무통장 입금만 사용할 경우 **스킵 가능**

카드 결제 사용 시:
1. [Toss Payments 가맹점 등록](https://developers.tosspayments.com/)
2. Vercel 환경변수 추가:
   - `TOSS_CLIENT_KEY`
   - `TOSS_SECRET_KEY`
   - `TOSS_WEBHOOK_SECRET`

---

## 2. 기능별 테스트

### 2.1 무통장 입금 (S4BA1, S4BA2)

**테스트 방법:**

1. 일반 사용자로 로그인
2. 프로젝트 생성 → 설치비 입금 요청
3. 입금자명, 은행 선택 후 제출
4. **Admin 계정**으로 로그인
5. Admin 대시보드 → 입금 대기 목록 확인
6. 승인 또는 거부 처리

**예상 결과:**
- 입금 요청이 DB에 저장됨
- Admin에서 상태 변경 가능
- 상태 변경 시 사용자에게 이메일 발송 (Resend 설정 완료 시)

**파일 위치:**
- API: `Production/api/Backend_APIs/payment/installation-request.js`
- API: `Production/api/Backend_APIs/admin/confirm-installation.js`

---

### 2.2 관리자 대시보드 (S4F1)

**테스트 방법:**

1. Admin 계정으로 로그인
2. URL: `/pages/admin/dashboard.html` 접속
3. 각 탭 클릭하여 기능 확인:
   - 입금 대기 목록
   - 결제 내역
   - 사용자 관리
   - 통계

**예상 결과:**
- Admin 권한이 없으면 접근 차단
- 데이터 조회 및 액션 버튼 정상 작동

**파일 위치:**
- `Production/Frontend/pages/admin/dashboard.html`
- `Production/Frontend/assets/js/admin/dashboard.js`

---

### 2.3 크레딧 충전 UI (S4F3)

**테스트 방법:**

1. 일반 사용자로 로그인
2. 크레딧 충전 페이지 접속
3. 패키지 선택 (10,000원 / 30,000원 / 50,000원)
4. 결제 진행 (Toss 설정 완료 시)

**예상 결과:**
- 패키지 목록 표시
- 보너스 크레딧 표시 (30,000원 10%, 50,000원 20%)
- 결제 버튼 클릭 시 Toss 결제 페이지 이동

**파일 위치:**
- `Production/Frontend/pages/credit/charge.html`

---

### 2.4 결제 수단 등록 (S4F4)

**테스트 방법:**

1. 일반 사용자로 로그인
2. 결제 수단 관리 페이지 접속
3. 카드 등록 버튼 클릭
4. 카드 정보 입력 (Toss 설정 완료 시)

**예상 결과:**
- 등록된 카드 목록 표시
- 카드 정보 마스킹 (**** **** **** 1234)
- 기본 카드 설정 가능

**파일 위치:**
- `Production/Frontend/pages/payment/methods.html`

---

### 2.5 이메일 발송 (S4BA6)

**테스트 방법:**

Resend API 키가 설정된 경우:
1. 입금 확인 → `billing-success` 이메일 발송 확인
2. 입금 거부 → `payment-rejected` 이메일 발송 확인

**예상 결과:**
- 이메일 수신됨
- HTML 렌더링 정상
- 링크 클릭 정상

**파일 위치:**
- `Production/api/Backend_APIs/lib/email-service.js`

---

### 2.6 Cron Jobs (S4O1)

**테스트 방법:**

Vercel 배포 후:
1. Vercel Dashboard → Cron Jobs 탭 확인
2. 각 Cron Job 수동 실행 가능

**Cron 목록:**
- `billing-retry.js` - 매일 10:00
- `subscription-renew.js` - 매일 00:00
- `credit-low-alert.js` - 매일 09:00
- `stats-aggregate.js` - 매일 01:00
- `challenge-expiry.js` - 매월 1일 00:00
- `churn-risk-alert.js` - 매주 월요일 09:00

**파일 위치:**
- `Production/api/cron/`

---

## 3. 테스트 결과 기록

| 기능 | 테스트 결과 | 비고 |
|------|------------|------|
| DB 테이블 생성 | ⬜ | |
| Admin 사용자 설정 | ⬜ | |
| 무통장 입금 요청 | ⬜ | |
| 입금 확인/거부 | ⬜ | |
| Admin 대시보드 접근 | ⬜ | |
| 크레딧 충전 UI | ⬜ | |
| 결제 수단 등록 | ⬜ | |
| 이메일 발송 | ⬜ | |
| Cron Jobs | ⬜ | |

---

## 4. Stage Gate 승인

모든 테스트 통과 시:

```sql
-- stage_verification 테이블 업데이트
UPDATE stage_verification
SET
    stage_gate_status = 'Approved',
    approved_at = NOW(),
    approved_by = '[PO 이름]'
WHERE stage = 'S4';
```

또는 문제 발견 시:

```sql
UPDATE stage_verification
SET
    stage_gate_status = 'Rejected',
    rejection_reason = '[거부 사유]'
WHERE stage = 'S4';
```
