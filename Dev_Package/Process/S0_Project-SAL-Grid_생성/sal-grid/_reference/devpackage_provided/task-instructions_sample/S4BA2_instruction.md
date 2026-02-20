# Task Instruction - S4BA2

---

## 필수 참조 규칙 파일 (2025-12-19)

> **작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S4BA2

## Task Name
입금 확인 API (관리자용)

## Task Goal
관리자가 설치비 무통장 입금을 확인하고 서비스를 활성화하는 API 구현

## SSALWorks 입금 확인 시 처리 항목

```
설치비 입금 확인 (₩3,000,000)
    ↓
┌─────────────────────────────────────────┐
│  1. payments 상태 → 'confirmed'          │
│  2. 초기 크레딧 ₩50,000 지급             │
│  3. 구독 시작일 설정 (3개월 무료)         │
│  4. 사용자 상태 → 'active'               │
│  5. 확인 이메일 발송                      │
└─────────────────────────────────────────┘
```

## Prerequisites (Dependencies)
- S4BA1 (설치비 무통장 입금 API) 완료
- S1D1 (DB 스키마 확정) 완료
- S1S1 (인증 시스템) 완료

## Specific Instructions

### 1. 설치비 입금 대기 목록 조회 API
- 위치: `api/admin/installation/pending.js`

```javascript
// api/admin/installation/pending.js
/**
 * @task S4BA2
 * 설치비 입금 대기 목록 조회 API (관리자용)
 * GET /api/admin/installation/pending
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 관리자 인증 확인
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // 관리자 권한 확인
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (userError || !userData?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    // 쿼리 파라미터
    const { page = 1, limit = 20, search } = req.query;

    try {
        let query = supabase
            .from('payments')
            .select(`
                *,
                users:user_id (
                    id,
                    email,
                    display_name,
                    phone,
                    created_at
                )
            `, { count: 'exact' })
            .eq('payment_type', 'installation_fee')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        // 페이지네이션
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: payments, error, count } = await query;

        if (error) {
            console.error('Pending query error:', error);
            return res.status(500).json({ error: 'Failed to fetch pending payments' });
        }

        // 검색 필터 (이메일, 이름, 입금코드)
        let filteredPayments = payments;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredPayments = payments.filter(p =>
                p.users?.email?.toLowerCase().includes(searchLower) ||
                p.users?.display_name?.toLowerCase().includes(searchLower) ||
                p.deposit_code?.toLowerCase().includes(searchLower)
            );
        }

        // 만료 임박 표시 (3일 이내)
        const now = new Date();
        filteredPayments = filteredPayments.map(p => ({
            ...p,
            expires_soon: p.expires_at && (new Date(p.expires_at) - now) < 3 * 24 * 60 * 60 * 1000,
            days_until_expiry: p.expires_at ?
                Math.ceil((new Date(p.expires_at) - now) / (24 * 60 * 60 * 1000)) : null
        }));

        res.status(200).json({
            payments: filteredPayments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                total_pages: Math.ceil(count / parseInt(limit))
            },
            summary: {
                total_pending: count,
                total_amount: count * 3000000 // ₩3,000,000 고정
            }
        });

    } catch (error) {
        console.error('Pending payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 2. 설치비 입금 확인 처리 API
- 위치: `api/admin/installation/confirm.js`

```javascript
// api/admin/installation/confirm.js
/**
 * @task S4BA2
 * 설치비 입금 확인 처리 API (관리자용)
 * POST /api/admin/installation/confirm
 *
 * 처리 항목:
 * 1. payments 상태 → 'confirmed'
 * 2. 초기 크레딧 ₩50,000 지급
 * 3. 구독 시작 (3개월 무료, 4개월차부터 ₩50,000/월)
 * 4. 사용자 상태 → 'active'
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 초기 크레딧 금액
const INITIAL_CREDIT = 50000; // ₩50,000

// 무료 기간 (개월)
const FREE_PERIOD_MONTHS = 3;

// 월 이용료
const MONTHLY_FEE = 50000; // ₩50,000

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 관리자 인증 확인
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // 관리자 권한 확인
    const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (adminError || !adminData?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { payment_id, note } = req.body;

    if (!payment_id) {
        return res.status(400).json({ error: 'payment_id is required' });
    }

    try {
        // 1. 결제 요청 조회
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('*, users:user_id(*)')
            .eq('id', payment_id)
            .eq('payment_type', 'installation_fee')
            .single();

        if (fetchError || !payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status !== 'pending') {
            return res.status(400).json({
                error: 'Cannot confirm payment',
                reason: `Payment status is ${payment.status}. Only pending payments can be confirmed.`
            });
        }

        const now = new Date();
        const confirmedAt = now.toISOString();

        // 구독 기간 계산
        const subscriptionStart = now;
        const freeEndDate = new Date(now);
        freeEndDate.setMonth(freeEndDate.getMonth() + FREE_PERIOD_MONTHS);

        const firstBillingDate = new Date(freeEndDate);
        firstBillingDate.setDate(firstBillingDate.getDate() + 1);

        // 2. payments 상태 업데이트
        const { error: paymentUpdateError } = await supabase
            .from('payments')
            .update({
                status: 'confirmed',
                confirmed_by: user.id,
                confirmed_at: confirmedAt,
                admin_note: note || null
            })
            .eq('id', payment_id);

        if (paymentUpdateError) {
            throw new Error('Failed to update payment status');
        }

        // 3. 초기 크레딧 지급
        const { data: currentUser } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', payment.user_id)
            .single();

        const currentBalance = currentUser?.credit_balance || 0;
        const newBalance = currentBalance + INITIAL_CREDIT;

        await supabase
            .from('users')
            .update({
                credit_balance: newBalance,
                subscription_status: 'active'
            })
            .eq('id', payment.user_id);

        // 크레딧 내역 기록
        await supabase
            .from('credit_history')
            .insert({
                user_id: payment.user_id,
                type: 'initial_grant',
                amount: INITIAL_CREDIT,
                bonus_amount: 0,
                balance_after: newBalance,
                description: '설치비 결제 완료 - 초기 크레딧 지급',
                related_payment_id: payment_id
            });

        // 4. 구독 정보 생성
        const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: payment.user_id,
                status: 'active',
                plan: 'standard',
                installation_paid: true,
                installation_paid_at: confirmedAt,
                subscription_start: subscriptionStart.toISOString(),
                free_period_end: freeEndDate.toISOString(),
                first_billing_date: firstBillingDate.toISOString(),
                monthly_fee: MONTHLY_FEE,
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (subscriptionError) {
            console.error('Subscription error:', subscriptionError);
            // 롤백하지 않고 로그만 기록 (결제는 이미 확인됨)
        }

        // 5. 이메일 발송 (선택적 - S4BA6 완료 후)
        // await sendConfirmationEmail(payment.user_id, payment);

        res.status(200).json({
            success: true,
            message: '설치비 입금이 확인되었습니다.',
            result: {
                payment_id,
                user_id: payment.user_id,
                user_email: payment.users?.email,
                amount: payment.amount,
                confirmed_by: user.id,
                confirmed_at: confirmedAt
            },
            benefits_applied: {
                initial_credit: INITIAL_CREDIT,
                credit_balance: newBalance,
                free_period_months: FREE_PERIOD_MONTHS,
                free_period_end: freeEndDate.toISOString(),
                first_billing_date: firstBillingDate.toISOString(),
                monthly_fee: MONTHLY_FEE
            }
        });

    } catch (error) {
        console.error('Payment confirm error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 3. 설치비 입금 거부 API
- 위치: `api/admin/installation/reject.js`

```javascript
// api/admin/installation/reject.js
/**
 * @task S4BA2
 * 설치비 입금 거부 API (관리자용)
 * POST /api/admin/installation/reject
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 관리자 인증 확인
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // 관리자 권한 확인
    const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (adminError || !adminData?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { payment_id, rejection_reason } = req.body;

    if (!payment_id) {
        return res.status(400).json({ error: 'payment_id is required' });
    }

    if (!rejection_reason) {
        return res.status(400).json({ error: 'rejection_reason is required' });
    }

    try {
        // 결제 요청 조회
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('*, users:user_id(email, display_name)')
            .eq('id', payment_id)
            .eq('payment_type', 'installation_fee')
            .single();

        if (fetchError || !payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status !== 'pending') {
            return res.status(400).json({
                error: 'Cannot reject payment',
                reason: `Payment status is ${payment.status}. Only pending payments can be rejected.`
            });
        }

        // 상태 변경
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                status: 'rejected',
                rejection_reason,
                rejected_by: user.id,
                rejected_at: now
            })
            .eq('id', payment_id);

        if (updateError) {
            throw new Error('Failed to update payment status');
        }

        // 이메일 발송 (선택적 - S4BA6 완료 후)
        // await sendRejectionEmail(payment.user_id, payment, rejection_reason);

        res.status(200).json({
            success: true,
            message: 'Payment rejected',
            payment_id,
            rejection_reason,
            rejected_by: user.id,
            rejected_at: now
        });

    } catch (error) {
        console.error('Payment reject error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 4. 설치비 내역 조회 API
- 위치: `api/admin/installation/history.js`

```javascript
// api/admin/installation/history.js
/**
 * @task S4BA2
 * 설치비 내역 조회 API (관리자용)
 * GET /api/admin/installation/history
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 관리자 인증 (생략 - 위와 동일)
    // ...

    const {
        status,
        date_from,
        date_to,
        page = 1,
        limit = 50,
        export_format
    } = req.query;

    try {
        let query = supabase
            .from('payments')
            .select(`
                *,
                users:user_id (id, email, display_name),
                confirmed_by_user:confirmed_by (email, display_name),
                rejected_by_user:rejected_by (email, display_name)
            `, { count: 'exact' })
            .eq('payment_type', 'installation_fee')
            .order('created_at', { ascending: false });

        // 필터링
        if (status) {
            query = query.eq('status', status);
        }
        if (date_from) {
            query = query.gte('created_at', date_from);
        }
        if (date_to) {
            query = query.lte('created_at', date_to);
        }

        // 페이지네이션
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: payments, error, count } = await query;

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch payments' });
        }

        // 통계
        const stats = {
            total: count,
            confirmed: payments.filter(p => p.status === 'confirmed').length,
            pending: payments.filter(p => p.status === 'pending').length,
            rejected: payments.filter(p => p.status === 'rejected').length,
            cancelled: payments.filter(p => p.status === 'cancelled').length,
            total_confirmed_amount: payments
                .filter(p => p.status === 'confirmed')
                .reduce((sum, p) => sum + p.amount, 0)
        };

        // CSV 내보내기
        if (export_format === 'csv') {
            const csv = convertToCSV(payments);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=installation_payments.csv');
            return res.status(200).send('\uFEFF' + csv); // BOM for Excel
        }

        res.status(200).json({
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                total_pages: Math.ceil(count / parseInt(limit))
            },
            stats
        });

    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

function convertToCSV(payments) {
    const headers = ['ID', '사용자', '이메일', '금액', '상태', '입금코드', '요청일', '확인일'];
    const rows = payments.map(p => [
        p.id,
        p.users?.display_name || '',
        p.users?.email || '',
        p.amount,
        p.status,
        p.deposit_code,
        p.created_at,
        p.confirmed_at || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}
```

### 5. DB 스키마

```sql
-- payments 테이블 추가 컬럼
ALTER TABLE payments ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- subscriptions 테이블 추가 컬럼
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS installation_paid BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS installation_paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS free_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS first_billing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 50000;

-- credit_history 테이블
CREATE TABLE IF NOT EXISTS credit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'initial_grant', 'charge', 'usage', 'refund'
    amount INTEGER NOT NULL,
    bonus_amount INTEGER DEFAULT 0,
    balance_after INTEGER NOT NULL,
    description TEXT,
    related_payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_type ON credit_history(type);
```

## Expected Output Files
- `api/admin/installation/pending.js`
- `api/admin/installation/confirm.js`
- `api/admin/installation/reject.js`
- `api/admin/installation/history.js`

## Completion Criteria
- [ ] 입금 대기 목록 조회 API 구현
- [ ] 입금 확인 처리 API 구현
  - [ ] payments 상태 업데이트
  - [ ] 초기 크레딧 ₩50,000 지급
  - [ ] 구독 정보 생성 (3개월 무료)
  - [ ] 크레딧 내역 기록
- [ ] 입금 거부 API 구현
- [ ] 입금 내역 조회 API 구현
- [ ] 관리자 권한 검증 (is_admin)
- [ ] CSV 내보내기 기능
- [ ] API 테스트 완료

## Tech Stack
- Vercel Serverless Functions
- Supabase

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Write, Read
- Bash (API 테스트)
- /mcp__supabase__*

## Execution Type
AI-Only

## Remarks
- 설치비 확인 시 초기 크레딧 ₩50,000 자동 지급
- 구독 시작일 설정: 확인일 기준
- 무료 기간: 3개월 (1~3개월차)
- 첫 과금일: 4개월차 첫날
- 월 이용료: ₩50,000 (S4BA3 토스페이먼츠에서 처리)
- 이메일 알림: S4BA6 완료 후 연동

---

## 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S4BA2 → `S4_개발-3차/Backend_APIs/`

### 제2 규칙: Production 코드는 이중 저장
- Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
