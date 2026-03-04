# Task Instruction - S4BA4

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S4BA4

## Task Name
크레딧 충전 API

## Task Goal
AI 서비스 이용을 위한 크레딧 구매 및 충전 Serverless API 구현

## Prerequisites (Dependencies)
- S4D1 (결제/크레딧 테이블) 완료

## Specific Instructions

### 1. 크레딧 충전 API
- 위치: `api/credit/purchase.js`

```javascript
// api/credit/purchase.js
/**
 * @task S4BA4
 * 크레딧 충전(구매) API
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

// 크레딧 패키지 정의
const CREDIT_PACKAGES = {
    basic: { credits: 1000, price: 10000, bonus: 0 },
    standard: { credits: 5000, price: 45000, bonus: 500 },
    premium: { credits: 10000, price: 80000, bonus: 2000 }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const { packageId, paymentKey, orderId, amount } = req.body;

    // 패키지 검증
    const selectedPackage = CREDIT_PACKAGES[packageId];
    if (!selectedPackage) {
        return res.status(400).json({ error: '유효하지 않은 패키지입니다' });
    }

    // 금액 검증
    if (amount !== selectedPackage.price) {
        return res.status(400).json({ error: '결제 금액이 일치하지 않습니다' });
    }

    try {
        // 토스페이먼츠 결제 승인
        const tossResponse = await fetch(`${TOSS_API_URL}/payments/confirm`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount
            })
        });

        const paymentData = await tossResponse.json();

        if (!tossResponse.ok) {
            console.error('Payment confirm error:', paymentData);
            return res.status(400).json({
                error: paymentData.message || '결제 승인에 실패했습니다'
            });
        }

        // 크레딧 충전 (트랜잭션)
        const totalCredits = selectedPackage.credits + selectedPackage.bonus;

        // 현재 크레딧 조회
        const { data: userData } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', user.id)
            .single();

        const currentBalance = userData?.credit_balance || 0;
        const newBalance = currentBalance + totalCredits;

        // 크레딧 업데이트
        const { error: updateError } = await supabase
            .from('users')
            .update({ credit_balance: newBalance })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 충전 이력 기록
        const { error: historyError } = await supabase
            .from('credit_history')
            .insert({
                user_id: user.id,
                type: 'purchase',
                amount: totalCredits,
                base_credits: selectedPackage.credits,
                bonus_credits: selectedPackage.bonus,
                payment_amount: amount,
                payment_key: paymentKey,
                order_id: orderId,
                package_id: packageId,
                balance_after: newBalance,
                created_at: new Date().toISOString()
            });

        if (historyError) {
            console.error('Credit history error:', historyError);
            // 이력 기록 실패는 치명적이지 않음
        }

        return res.status(200).json({
            success: true,
            credits: {
                purchased: selectedPackage.credits,
                bonus: selectedPackage.bonus,
                total: totalCredits,
                newBalance
            },
            payment: {
                orderId,
                amount,
                method: paymentData.method
            },
            message: `${totalCredits.toLocaleString()} 크레딧이 충전되었습니다`
        });

    } catch (error) {
        console.error('Credit purchase error:', error);
        return res.status(500).json({ error: '크레딧 충전 중 오류가 발생했습니다' });
    }
}
```

### 2. 크레딧 잔액 조회 API
- 위치: `api/credit/balance.js`

```javascript
// api/credit/balance.js
/**
 * @task S4BA4
 * 크레딧 잔액 조회 API
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('credit_balance')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            credit: data?.credit_balance || 0
        });

    } catch (error) {
        console.error('Credit balance error:', error);
        return res.status(500).json({ error: '크레딧 조회 중 오류가 발생했습니다' });
    }
}
```

### 3. 크레딧 이용 내역 조회 API
- 위치: `api/credit/history.js`

```javascript
// api/credit/history.js
/**
 * @task S4BA4
 * 크레딧 이용 내역 조회 API
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('credit_history')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return res.status(200).json({
            success: true,
            history: data.map(h => ({
                id: h.id,
                type: h.type,
                amount: h.amount,
                balanceAfter: h.balance_after,
                description: getDescription(h),
                createdAt: h.created_at
            })),
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Credit history error:', error);
        return res.status(500).json({ error: '이용 내역 조회 중 오류가 발생했습니다' });
    }
}

function getDescription(history) {
    switch (history.type) {
        case 'purchase':
            return `크레딧 충전 (${history.package_id || ''})`;
        case 'usage':
            return `AI 질문 (${history.ai_model || ''})`;
        case 'refund':
            return '크레딧 환불';
        case 'bonus':
            return '보너스 크레딧';
        default:
            return history.type;
    }
}
```

### 4. 크레딧 패키지 목록 API
- 위치: `api/credit/packages.js`

```javascript
// api/credit/packages.js
/**
 * @task S4BA4
 * 크레딧 패키지 목록 조회 API
 */

const CREDIT_PACKAGES = [
    {
        id: 'basic',
        name: '베이직',
        credits: 1000,
        price: 10000,
        bonus: 0,
        description: '가벼운 사용자를 위한 패키지'
    },
    {
        id: 'standard',
        name: '스탠다드',
        credits: 5000,
        price: 45000,
        bonus: 500,
        recommended: true,
        description: '일반 사용자를 위한 인기 패키지'
    },
    {
        id: 'premium',
        name: '프리미엄',
        credits: 10000,
        price: 80000,
        bonus: 2000,
        description: '헤비 사용자를 위한 대용량 패키지'
    }
];

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(200).json({
        success: true,
        packages: CREDIT_PACKAGES.map(pkg => ({
            ...pkg,
            totalCredits: pkg.credits + pkg.bonus,
            pricePerCredit: Math.round(pkg.price / (pkg.credits + pkg.bonus))
        })),
        currency: 'KRW'
    });
}
```

## Expected Output Files
- `api/credit/purchase.js`
- `api/credit/balance.js`
- `api/credit/history.js`
- `api/credit/packages.js`

## Completion Criteria
- [ ] POST /api/credit/purchase 크레딧 충전
- [ ] GET /api/credit/balance 잔액 조회
- [ ] GET /api/credit/history 이용 내역 조회
- [ ] GET /api/credit/packages 패키지 목록 조회
- [ ] 토스페이먼츠 결제 승인 연동
- [ ] 크레딧 이력 기록

## Tech Stack
- Vercel Serverless Functions
- Supabase
- 토스페이먼츠 API

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- supabase-js SDK
- Toss Payments API

## Execution Type
AI-Only

## Remarks
- 결제 실패 시 크레딧 미충전 보장
- 보너스 크레딧은 패키지별 차등 적용
- 이용 내역 페이지네이션 지원

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
