# Task Instruction - S4BA1

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
S4BA1

## Task Name
무통장 입금 결제 API

## Task Goal
설치비(₩3,000,000) 무통장 입금 요청 접수 및 결제 정보 관리 API 구현

## SSALWorks 결제 시스템 개요

```
┌─────────────────────────────────────────────────────────────┐
│                     SSALWorks 결제 체계                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [설치비] ─────────────────→ 무통장 입금 (이 Task)          │
│    └─ ₩3,000,000 (1회성)                                    │
│    └─ 초기 크레딧 ₩50,000 자동 지급                         │
│                                                             │
│  [월 이용료] ──────────────→ 토스페이먼츠 (S4BA3)          │
│    └─ 1~3개월차: 면제 (₩0)                                  │
│    └─ 4개월차~: ₩50,000/월                                  │
│                                                             │
│  [크레딧 충전] ────────────→ 토스페이먼츠 (S4BA3)          │
│    └─ ₩10,000 / ₩20,000 / ₩30,000 / ₩50,000                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites (Dependencies)
- S2BA3 (구독 관리 API) 완료
- S1D1 (DB 스키마 확정) 완료

## Specific Instructions

### 1. 설치비 입금 요청 API
- 위치: `api/payment/installation/request.js`

```javascript
// api/payment/installation/request.js
/**
 * @task S4BA1
 * 설치비 무통장 입금 요청 API
 * POST /api/payment/installation/request
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 은행 정보 (환경변수)
const BANK_INFO = {
  bank_name: process.env.BANK_NAME,
  account_number: process.env.BANK_ACCOUNT,
  account_holder: process.env.BANK_HOLDER
};

// 설치비 금액 (고정)
const INSTALLATION_FEE = 3000000; // ₩3,000,000

// 초기 크레딧 (설치비 결제 시 자동 지급)
const INITIAL_CREDIT = 50000; // ₩50,000

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

    try {
        // 1. 기존 설치비 결제 확인 (중복 방지)
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('payment_type', 'installation_fee')
            .in('status', ['pending', 'confirmed'])
            .single();

        if (existingPayment) {
            if (existingPayment.status === 'confirmed') {
                return res.status(400).json({
                    error: '이미 설치비를 결제하셨습니다.',
                    existing_payment_id: existingPayment.id
                });
            }
            if (existingPayment.status === 'pending') {
                return res.status(400).json({
                    error: '대기 중인 설치비 입금 요청이 있습니다.',
                    existing_payment_id: existingPayment.id,
                    message: '기존 요청을 취소하고 다시 시도해주세요.'
                });
            }
        }

        // 2. 고유 입금 식별 코드 생성 (6자리)
        const deposit_code = generateDepositCode();

        // 3. payments 테이블에 저장
        const { data: payment, error: insertError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                payment_type: 'installation_fee',
                payment_method: 'bank_transfer',
                amount: INSTALLATION_FEE,
                deposit_code,
                status: 'pending',
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 후 만료
            })
            .select()
            .single();

        if (insertError) {
            console.error('Payment insert error:', insertError);
            return res.status(500).json({ error: 'Failed to create payment request' });
        }

        // 4. 응답 반환
        res.status(201).json({
            success: true,
            payment: {
                id: payment.id,
                payment_type: 'installation_fee',
                amount: INSTALLATION_FEE,
                deposit_code,
                status: 'pending',
                expires_at: payment.expires_at,
                created_at: payment.created_at
            },
            bank_info: BANK_INFO,
            benefits: {
                initial_credit: INITIAL_CREDIT,
                free_months: 3,
                monthly_fee_after: 50000,
                monthly_fee_starts_from: '4개월차'
            },
            instructions: [
                `1. 아래 계좌로 ${INSTALLATION_FEE.toLocaleString()}원을 입금해주세요.`,
                `2. 입금자명에 "${deposit_code}"를 포함해주세요.`,
                `   예: ${deposit_code}홍길동 또는 홍길동${deposit_code}`,
                `3. 입금 확인 후 서비스가 활성화됩니다.`,
                `4. 입금 확인은 영업일 기준 1-2일 소요됩니다.`,
                `5. 7일 내 미입금 시 요청이 자동 취소됩니다.`,
                ``,
                `[혜택 안내]`,
                `• 초기 크레딧 ${INITIAL_CREDIT.toLocaleString()}원 지급`,
                `• 플랫폼 이용료 3개월 면제`,
                `• 4개월차부터 월 50,000원`
            ]
        });

    } catch (error) {
        console.error('Payment request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// 6자리 고유 입금 코드 생성 (I, O, 0, 1 제외 - 혼동 방지)
function generateDepositCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
```

### 2. 설치비 입금 상태 조회 API
- 위치: `api/payment/installation/status.js`

```javascript
// api/payment/installation/status.js
/**
 * @task S4BA1
 * 설치비 입금 상태 조회 API
 * GET /api/payment/installation/status
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

    try {
        // 설치비 결제 내역 조회 (최신 순)
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('payment_type', 'installation_fee')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch payments' });
        }

        // 현재 상태 판단
        const confirmedPayment = payments.find(p => p.status === 'confirmed');
        const pendingPayment = payments.find(p => p.status === 'pending');

        // 서비스 활성화 여부 확인
        const isActive = !!confirmedPayment;

        // 잔여 무료 기간 계산
        let freeMonthsRemaining = 0;
        let monthlyFeeStartDate = null;
        if (confirmedPayment) {
            const confirmedDate = new Date(confirmedPayment.confirmed_at);
            const monthsPassed = Math.floor(
                (new Date() - confirmedDate) / (30 * 24 * 60 * 60 * 1000)
            );
            freeMonthsRemaining = Math.max(0, 3 - monthsPassed);

            monthlyFeeStartDate = new Date(confirmedDate);
            monthlyFeeStartDate.setMonth(monthlyFeeStartDate.getMonth() + 3);
        }

        return res.status(200).json({
            is_active: isActive,
            current_status: confirmedPayment ? 'confirmed' : pendingPayment ? 'pending' : 'none',
            confirmed_payment: confirmedPayment || null,
            pending_payment: pendingPayment || null,
            subscription_info: isActive ? {
                free_months_remaining: freeMonthsRemaining,
                monthly_fee_starts: monthlyFeeStartDate?.toISOString() || null,
                monthly_fee: 50000
            } : null,
            payment_history: payments
        });

    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 3. 설치비 입금 요청 취소 API
- 위치: `api/payment/installation/cancel.js`

```javascript
// api/payment/installation/cancel.js
/**
 * @task S4BA1
 * 설치비 입금 요청 취소 API
 * POST /api/payment/installation/cancel
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

    const { payment_id } = req.body;

    if (!payment_id) {
        return res.status(400).json({ error: 'payment_id is required' });
    }

    try {
        // 1. 결제 요청 조회
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', payment_id)
            .eq('user_id', user.id)
            .eq('payment_type', 'installation_fee')
            .single();

        if (fetchError || !payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // 2. pending 상태만 취소 가능
        if (payment.status !== 'pending') {
            return res.status(400).json({
                error: 'Cannot cancel payment',
                reason: `Payment status is ${payment.status}. Only pending payments can be cancelled.`
            });
        }

        // 3. 상태 변경
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', payment_id);

        if (updateError) {
            return res.status(500).json({ error: 'Failed to cancel payment' });
        }

        res.status(200).json({
            success: true,
            message: 'Payment request cancelled successfully',
            payment_id
        });

    } catch (error) {
        console.error('Payment cancel error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 4. 설치비 정보 조회 API
- 위치: `api/payment/installation/info.js`

```javascript
// api/payment/installation/info.js
/**
 * @task S4BA1
 * 설치비 정보 조회 API (인증 불필요)
 * GET /api/payment/installation/info
 */

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    res.status(200).json({
        payment_type: 'installation_fee',
        payment_method: 'bank_transfer',
        amount: 3000000,
        amount_formatted: '₩3,000,000',
        description: 'SSALWorks 서비스 초기 설치 비용',
        benefits: {
            initial_credit: {
                amount: 50000,
                description: '초기 AI 크레딧 ₩50,000 지급'
            },
            free_period: {
                months: 3,
                description: '플랫폼 이용료 3개월 면제'
            },
            monthly_fee: {
                amount: 50000,
                starts_from: '4개월차',
                description: '4개월차부터 월 ₩50,000'
            }
        },
        bank_info: {
            bank_name: process.env.BANK_NAME || '(문의 필요)',
            account_number: process.env.BANK_ACCOUNT || '(문의 필요)',
            account_holder: process.env.BANK_HOLDER || '(문의 필요)'
        },
        timeline: [
            { step: 1, title: '입금 요청', description: '설치비 입금 요청' },
            { step: 2, title: '입금', description: '₩3,000,000 무통장 입금' },
            { step: 3, title: '확인', description: '영업일 1-2일 내 입금 확인' },
            { step: 4, title: '활성화', description: '서비스 활성화 + 크레딧 지급' }
        ],
        notes: [
            '설치비는 1회성 비용입니다.',
            '입금 확인 후 초기 크레딧 ₩50,000이 자동 지급됩니다.',
            '크레딧 추가 충전은 카드 결제(토스페이먼트)를 이용해주세요.',
            '7일 내 미입금 시 요청이 자동 취소됩니다.'
        ]
    });
};
```

### 5. DB 스키마 (payments 테이블)

```sql
-- payments 테이블 (S1D1에서 기본 생성, S4D1에서 컬럼 추가)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30); -- 'bank_transfer' | 'toss'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deposit_code VARCHAR(20) UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_payments_deposit_code ON payments(deposit_code);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
```

## Expected Output Files
- `api/payment/installation/request.js`
- `api/payment/installation/status.js`
- `api/payment/installation/cancel.js`
- `api/payment/installation/info.js`

## Completion Criteria
- [ ] 설치비 입금 요청 API 구현 (POST /api/payment/installation/request)
- [ ] 설치비 상태 조회 API 구현 (GET /api/payment/installation/status)
- [ ] 설치비 취소 API 구현 (POST /api/payment/installation/cancel)
- [ ] 설치비 정보 조회 API 구현 (GET /api/payment/installation/info)
- [ ] 고유 입금 코드 생성 로직 구현
- [ ] 중복 결제 방지 로직 구현
- [ ] 7일 만료 로직 (expires_at)
- [ ] 환경변수 설정 (BANK_NAME, BANK_ACCOUNT, BANK_HOLDER)
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
- **설치비**: ₩3,000,000 고정, 무통장 입금
- **초기 크레딧**: 설치비 확인 시 ₩50,000 자동 지급 (S4BA2에서 처리)
- **월 이용료**: 4개월차부터 ₩50,000 (토스페이먼츠, S4BA3)
- **크레딧 충전**: ₩10,000~₩50,000 (토스페이먼츠, S4BA3)
- 관리자가 수동으로 입금 확인 후 서비스 활성화 (S4BA2에서 처리)
- 7일 이상 미입금 시 자동 취소 (S4O1 Cron에서 처리)

---

## 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S4BA1 → `S4_개발-3차/Backend_APIs/`

### 제2 규칙: Production 코드는 이중 저장
- Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
