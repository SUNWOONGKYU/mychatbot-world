# Task Instruction - S4BA3

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
S4BA3

## Task Name
토스페이먼츠 결제 API

## Task Goal
크레딧 충전 및 월 이용료 자동결제를 위한 토스페이먼츠 API 구현

## SSALWorks 토스페이먼츠 결제 체계

```
┌─────────────────────────────────────────────────────────────┐
│               토스페이먼츠 결제 항목                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [크레딧 충전] ────────→ 일회성 결제                         │
│    └─ ₩10,000 / ₩20,000 / ₩30,000 / ₩50,000               │
│    └─ 카드 결제 (토스 페이)                                  │
│    └─ 즉시 충전                                              │
│                                                             │
│  [월 이용료] ──────────→ 정기결제 (빌링키)                   │
│    └─ ₩50,000/월                                            │
│    └─ 4개월차부터 자동 과금                                  │
│    └─ 매월 결제일에 자동 청구                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites (Dependencies)
- S4BA2 (설치비 입금 확인 API) 완료
- S4D1 (결제/크레딧 테이블) 완료
- 토스페이먼츠 가맹점 등록 완료

## Specific Instructions

### 1. 크레딧 충전 결제 요청 API
- 위치: `api/payment/credit/request.js`

```javascript
// api/payment/credit/request.js
/**
 * @task S4BA3
 * 크레딧 충전 결제 요청 API
 * POST /api/payment/credit/request
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY;

// 크레딧 충전 옵션
const CREDIT_OPTIONS = [
    { amount: 10000, credit: 10000, label: '₩10,000' },
    { amount: 20000, credit: 20000, label: '₩20,000' },
    { amount: 30000, credit: 30000, label: '₩30,000' },
    { amount: 50000, credit: 50000, label: '₩50,000' }
];

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 인증 확인
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { amount } = req.body;

    // 유효성 검증
    const selectedOption = CREDIT_OPTIONS.find(opt => opt.amount === amount);
    if (!selectedOption) {
        return res.status(400).json({
            error: 'Invalid amount',
            valid_amounts: CREDIT_OPTIONS.map(opt => opt.amount)
        });
    }

    try {
        // 주문 ID 생성
        const orderId = `CREDIT_${user.id.slice(0, 8)}_${Date.now()}`;

        // 결제 요청 정보 저장 (pending)
        const { data: payment, error: insertError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                payment_type: 'credit',
                payment_method: 'toss',
                amount: selectedOption.amount,
                credit_amount: selectedOption.credit,
                order_id: orderId,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            throw new Error('Failed to create payment request');
        }

        // 토스페이먼츠 결제 정보 반환
        res.status(200).json({
            success: true,
            payment_id: payment.id,
            toss_payment: {
                clientKey: TOSS_CLIENT_KEY,
                orderId,
                orderName: `AI 크레딧 ${selectedOption.label}`,
                amount: selectedOption.amount,
                customerEmail: user.email,
                customerName: user.user_metadata?.display_name || user.email,
                successUrl: `${process.env.SITE_URL}/api/payment/credit/success`,
                failUrl: `${process.env.SITE_URL}/api/payment/credit/fail`
            }
        });

    } catch (error) {
        console.error('Credit payment request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 2. 크레딧 충전 결제 성공 콜백 API
- 위치: `api/payment/credit/success.js`

```javascript
// api/payment/credit/success.js
/**
 * @task S4BA3
 * 크레딧 충전 결제 성공 콜백
 * GET /api/payment/credit/success
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { paymentKey, orderId, amount } = req.query;

    if (!paymentKey || !orderId || !amount) {
        return res.redirect('/pages/payment/fail.html?error=missing_params');
    }

    try {
        // 1. 결제 정보 조회
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .eq('status', 'pending')
            .single();

        if (fetchError || !payment) {
            return res.redirect('/pages/payment/fail.html?error=payment_not_found');
        }

        // 금액 검증
        if (payment.amount !== parseInt(amount)) {
            return res.redirect('/pages/payment/fail.html?error=amount_mismatch');
        }

        // 2. 토스페이먼츠 결제 승인
        const tossResponse = await fetch(`${TOSS_API_URL}/payments/confirm`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount: parseInt(amount)
            })
        });

        const tossData = await tossResponse.json();

        if (!tossResponse.ok) {
            console.error('Toss confirm error:', tossData);
            // 결제 실패 처리
            await supabase
                .from('payments')
                .update({
                    status: 'failed',
                    error_message: tossData.message,
                    updated_at: new Date().toISOString()
                })
                .eq('id', payment.id);

            return res.redirect(`/pages/payment/fail.html?error=${tossData.code}`);
        }

        // 3. 결제 성공 처리
        const now = new Date().toISOString();

        await supabase
            .from('payments')
            .update({
                status: 'confirmed',
                payment_key: paymentKey,
                toss_data: tossData,
                confirmed_at: now,
                updated_at: now
            })
            .eq('id', payment.id);

        // 4. 크레딧 충전
        const { data: userData } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', payment.user_id)
            .single();

        const currentBalance = userData?.credit_balance || 0;
        const newBalance = currentBalance + payment.credit_amount;

        await supabase
            .from('users')
            .update({ credit_balance: newBalance })
            .eq('id', payment.user_id);

        // 크레딧 내역 기록
        await supabase
            .from('credit_history')
            .insert({
                user_id: payment.user_id,
                type: 'charge',
                amount: payment.credit_amount,
                balance_after: newBalance,
                description: `크레딧 충전 (토스페이먼트)`,
                related_payment_id: payment.id
            });

        // 5. 성공 페이지로 리다이렉트
        res.redirect(`/pages/payment/success.html?payment_id=${payment.id}&credit=${payment.credit_amount}`);

    } catch (error) {
        console.error('Credit payment success error:', error);
        res.redirect('/pages/payment/fail.html?error=server_error');
    }
};
```

### 3. 크레딧 충전 옵션 조회 API
- 위치: `api/payment/credit/options.js`

```javascript
// api/payment/credit/options.js
/**
 * @task S4BA3
 * 크레딧 충전 옵션 조회 API
 * GET /api/payment/credit/options
 */

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    res.status(200).json({
        payment_type: 'credit',
        payment_method: 'toss',
        description: 'AI 크레딧 충전 (토스페이먼츠)',
        options: [
            { amount: 10000, credit: 10000, label: '₩10,000' },
            { amount: 20000, credit: 20000, label: '₩20,000' },
            { amount: 30000, credit: 30000, label: '₩30,000' },
            { amount: 50000, credit: 50000, label: '₩50,000' }
        ],
        credit_usage: {
            description: 'AI 질문 시 크레딧이 차감됩니다.',
            pricing_formula: 'API 비용 × 환율(₩1,300) × 1.2(마진 20%)',
            example: 'GPT-4 질문 1회 약 ₩20~₩50'
        },
        notes: [
            '결제 완료 시 즉시 크레딧이 충전됩니다.',
            '충전된 크레딧은 환불되지 않습니다.',
            '크레딧 소진 시 AI 기능 사용이 제한됩니다.'
        ]
    });
};
```

### 4. 결제 수단 등록 API (빌링키)
- 위치: `api/payment/billing/register.js`

```javascript
// api/payment/billing/register.js
/**
 * @task S4BA3
 * 결제 수단 등록 API (빌링키 발급)
 * POST /api/payment/billing/register
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 인증 확인
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { authKey, customerKey } = req.body;

    if (!authKey || !customerKey) {
        return res.status(400).json({ error: 'authKey and customerKey are required' });
    }

    try {
        // 토스페이먼츠 빌링키 발급 요청
        const tossResponse = await fetch(`${TOSS_API_URL}/billing/authorizations/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                authKey,
                customerKey
            })
        });

        const billingData = await tossResponse.json();

        if (!tossResponse.ok) {
            console.error('Toss billing error:', billingData);
            return res.status(400).json({
                error: billingData.message || '빌링키 발급에 실패했습니다'
            });
        }

        // DB에 결제 수단 저장
        const { data, error } = await supabase
            .from('payment_methods')
            .upsert({
                user_id: user.id,
                billing_key: billingData.billingKey,
                customer_key: customerKey,
                card_company: billingData.card?.company,
                card_number: billingData.card?.number, // 마스킹된 번호
                card_type: billingData.card?.cardType,
                is_default: true,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            payment_method: {
                id: data.id,
                card_company: data.card_company,
                card_number: data.card_number,
                card_type: data.card_type,
                is_default: data.is_default
            },
            message: '결제 수단이 등록되었습니다'
        });

    } catch (error) {
        console.error('Billing registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 5. 월 이용료 자동결제 API (Cron에서 호출)
- 위치: `api/payment/billing/charge.js`

```javascript
// api/payment/billing/charge.js
/**
 * @task S4BA3
 * 월 이용료 자동결제 API
 * POST /api/payment/billing/charge
 *
 * S4O1 Cron에서 호출 (매일 00:00)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

const MONTHLY_FEE = 50000; // ₩50,000

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Cron 인증
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { user_id } = req.body; // 개별 처리 또는 null (전체)

    try {
        // 오늘 결제 대상 사용자 조회
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let query = supabase
            .from('subscriptions')
            .select(`
                *,
                users:user_id (id, email, display_name),
                payment_methods:user_id (billing_key, card_number)
            `)
            .eq('status', 'active')
            .eq('installation_paid', true)
            .lte('first_billing_date', today.toISOString());

        if (user_id) {
            query = query.eq('user_id', user_id);
        }

        const { data: subscriptions, error: fetchError } = await query;

        if (fetchError) {
            throw new Error('Failed to fetch subscriptions');
        }

        const results = {
            total: subscriptions.length,
            success: 0,
            failed: 0,
            skipped: 0,
            details: []
        };

        for (const sub of subscriptions) {
            // 결제 수단 확인
            const paymentMethod = sub.payment_methods?.[0];
            if (!paymentMethod?.billing_key) {
                results.skipped++;
                results.details.push({
                    user_id: sub.user_id,
                    status: 'skipped',
                    reason: 'No billing key'
                });
                continue;
            }

            // 이번 달 이미 결제했는지 확인
            const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('id')
                .eq('user_id', sub.user_id)
                .eq('payment_type', 'monthly_fee')
                .eq('status', 'confirmed')
                .gte('created_at', thisMonthStart.toISOString())
                .single();

            if (existingPayment) {
                results.skipped++;
                results.details.push({
                    user_id: sub.user_id,
                    status: 'skipped',
                    reason: 'Already paid this month'
                });
                continue;
            }

            // 결제 실행
            const orderId = `MONTHLY_${sub.user_id.slice(0, 8)}_${Date.now()}`;

            try {
                const tossResponse = await fetch(`${TOSS_API_URL}/billing/${paymentMethod.billing_key}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        customerKey: sub.user_id,
                        amount: MONTHLY_FEE,
                        orderId,
                        orderName: 'SSALWorks 월 이용료'
                    })
                });

                const tossData = await tossResponse.json();

                if (tossResponse.ok) {
                    // 결제 성공
                    await supabase
                        .from('payments')
                        .insert({
                            user_id: sub.user_id,
                            payment_type: 'monthly_fee',
                            payment_method: 'toss',
                            amount: MONTHLY_FEE,
                            order_id: orderId,
                            payment_key: tossData.paymentKey,
                            status: 'confirmed',
                            toss_data: tossData,
                            confirmed_at: new Date().toISOString()
                        });

                    // 다음 결제일 업데이트
                    const nextBillingDate = new Date(today);
                    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

                    await supabase
                        .from('subscriptions')
                        .update({
                            last_billing_date: today.toISOString(),
                            next_billing_date: nextBillingDate.toISOString()
                        })
                        .eq('user_id', sub.user_id);

                    results.success++;
                    results.details.push({
                        user_id: sub.user_id,
                        status: 'success',
                        amount: MONTHLY_FEE
                    });

                } else {
                    // 결제 실패
                    await supabase
                        .from('payments')
                        .insert({
                            user_id: sub.user_id,
                            payment_type: 'monthly_fee',
                            payment_method: 'toss',
                            amount: MONTHLY_FEE,
                            order_id: orderId,
                            status: 'failed',
                            error_message: tossData.message,
                            toss_data: tossData
                        });

                    // 실패 횟수 증가
                    await supabase
                        .from('subscriptions')
                        .update({
                            billing_failure_count: (sub.billing_failure_count || 0) + 1
                        })
                        .eq('user_id', sub.user_id);

                    results.failed++;
                    results.details.push({
                        user_id: sub.user_id,
                        status: 'failed',
                        error: tossData.message
                    });
                }

            } catch (chargeError) {
                results.failed++;
                results.details.push({
                    user_id: sub.user_id,
                    status: 'error',
                    error: chargeError.message
                });
            }
        }

        res.status(200).json(results);

    } catch (error) {
        console.error('Monthly billing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 6. 토스페이먼츠 웹훅 API
- 위치: `api/webhook/toss.js`

```javascript
// api/webhook/toss.js
/**
 * @task S4BA3
 * 토스페이먼츠 웹훅 수신 API
 * POST /api/webhook/toss
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET;

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 서명 검증
    const signature = req.headers['toss-signature'];
    if (!verifySignature(req.body, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const { eventType, data } = req.body;

    console.log('Toss webhook received:', eventType);

    try {
        // 웹훅 로그 저장
        await supabase
            .from('webhook_logs')
            .insert({
                source: 'toss',
                event_type: eventType,
                payload: data,
                received_at: new Date().toISOString()
            });

        switch (eventType) {
            case 'PAYMENT_STATUS_CHANGED':
                await handlePaymentStatusChanged(data);
                break;
            case 'BILLING_STATUS_CHANGED':
                await handleBillingStatusChanged(data);
                break;
            default:
                console.log('Unhandled event type:', eventType);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

function verifySignature(payload, signature) {
    if (!signature || !WEBHOOK_SECRET) return false;

    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('base64');

    return signature === expectedSignature;
}

async function handlePaymentStatusChanged(data) {
    const { paymentKey, status } = data;

    await supabase
        .from('payments')
        .update({
            status: status === 'DONE' ? 'confirmed' : status.toLowerCase(),
            updated_at: new Date().toISOString()
        })
        .eq('payment_key', paymentKey);
}

async function handleBillingStatusChanged(data) {
    const { billingKey, status } = data;

    await supabase
        .from('payment_methods')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('billing_key', billingKey);
}
```

### 7. DB 스키마

```sql
-- payment_methods 테이블 (빌링키)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    billing_key VARCHAR(100) NOT NULL,
    customer_key VARCHAR(100),
    card_company VARCHAR(50),
    card_number VARCHAR(20), -- 마스킹된 번호
    card_type VARCHAR(20),
    is_default BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- payments 테이블 추가 컬럼
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_key VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credit_amount INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS toss_data JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS error_message TEXT;

-- subscriptions 테이블 추가 컬럼
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_failure_count INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_billing_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- webhook_logs 테이블
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT false,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_key ON payments(payment_key);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
```

## Expected Output Files
- `api/payment/credit/request.js`
- `api/payment/credit/success.js`
- `api/payment/credit/fail.js`
- `api/payment/credit/options.js`
- `api/payment/billing/register.js`
- `api/payment/billing/charge.js`
- `api/webhook/toss.js`

## Completion Criteria
- [ ] 크레딧 충전 결제 요청 API
- [ ] 크레딧 충전 결제 성공/실패 콜백
- [ ] 크레딧 충전 옵션 조회 API
- [ ] 빌링키 발급 API
- [ ] 월 이용료 자동결제 API
- [ ] 토스페이먼츠 웹훅 수신
- [ ] 결제 성공 시 크레딧 충전
- [ ] 결제 실패 시 에러 처리
- [ ] 환경변수 설정 (TOSS_CLIENT_KEY, TOSS_SECRET_KEY, TOSS_WEBHOOK_SECRET)
- [ ] API 테스트 완료

## Tech Stack
- Vercel Serverless Functions
- Supabase
- 토스페이먼츠 API

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Write, Read
- Bash (API 테스트)
- /mcp__supabase__*

## Execution Type
Human-AI (토스페이먼츠 가맹점 등록 필요)

## Remarks
- **크레딧 충전**: ₩10,000 / ₩20,000 / ₩30,000 / ₩50,000 (일회성)
- **월 이용료**: ₩50,000/월 (4개월차부터, 자동결제)
- 토스페이먼츠 가맹점 등록 필요 (PO 작업)
- 빌링키는 암호화 저장 권장
- 웹훅 서명 검증 필수
- 결제 3회 연속 실패 시 구독 정지 (S4O1에서 처리)

---

## 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S4BA3 → `S4_개발-3차/Backend_APIs/`

### 제2 규칙: Production 코드는 이중 저장
- Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
