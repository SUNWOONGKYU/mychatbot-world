# Task Instruction - S4O1

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
S4O1

## Task Name
Cron Jobs 설정

## Task Goal
Vercel Cron Jobs를 이용한 자동화 작업 설정 - AI 가격 업데이트, 이탈 위험 사용자 알림, 구독 만료 처리, 입금 대기 만료, 챌린지 만료 알림

## Prerequisites (Dependencies)
- S1F2 (vercel.json 설정) 완료

## Specific Instructions

### 1. vercel.json Cron 설정
- 위치: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/ai-pricing-update",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/subscription-expiry",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/pending-payment-expiry",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/churn-risk-alert",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/challenge-expiry",
      "schedule": "0 9 1 * *"
    },
    {
      "path": "/api/cron/stats-aggregate",
      "schedule": "0 1 * * *"
    }
  ]
}
```

### 2. AI 가격 자동 업데이트 Cron
- 위치: `api/cron/ai-pricing-update.js`
- 스케줄: 매일 00:00 UTC

```javascript
// api/cron/ai-pricing-update.js
/**
 * @task S4O1
 * 매일 00:00 UTC 실행 - AI 모델 가격 업데이트
 * OpenAI, Anthropic, Google AI 가격 변동 확인 및 업데이트
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // AI 가격 정보 업데이트 (수동 설정 또는 API 조회)
        const pricingUpdates = [
            { provider: 'openai', model: 'gpt-4o', input_per_1k: 0.0025, output_per_1k: 0.01 },
            { provider: 'anthropic', model: 'claude-3-5-sonnet', input_per_1k: 0.003, output_per_1k: 0.015 },
            { provider: 'google', model: 'gemini-1.5-flash', input_per_1k: 0.000075, output_per_1k: 0.0003 }
        ];

        for (const pricing of pricingUpdates) {
            await supabase
                .from('ai_pricing')
                .upsert({
                    provider: pricing.provider,
                    model: pricing.model,
                    input_per_1k_tokens: pricing.input_per_1k,
                    output_per_1k_tokens: pricing.output_per_1k,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'provider,model' });
        }

        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            updated: pricingUpdates.length
        });

    } catch (error) {
        console.error('AI pricing update cron error:', error);
        res.status(500).json({ error: 'Cron job failed' });
    }
};
```

### 3. 구독 만료 처리 Cron
- 위치: `api/cron/subscription-expiry.js`
- 스케줄: 매일 00:00 UTC

```javascript
// api/cron/subscription-expiry.js
/**
 * @task S4O1
 * 매일 00:00 UTC 실행 - 구독 만료 처리
 * 만료된 구독 상태 변경, 3일 전 알림 발송
 */

module.exports = async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date().toISOString().split('T')[0];
    let processed = { expired: 0, warned_3day: 0 };

    try {
        // 1. 만료된 구독 처리
        const { data: expiredSubs } = await supabase
            .from('subscriptions')
            .select('id, user_id')
            .eq('status', 'active')
            .lt('end_date', today);

        if (expiredSubs?.length) {
            for (const sub of expiredSubs) {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'expired' })
                    .eq('id', sub.id);

                // 만료 알림 이메일 발송 (S4BA6 이메일 템플릿 사용)
                await sendEmail(sub.user_id, 'subscription-expired');
                processed.expired++;
            }
        }

        // 2. 만료 3일 전 알림
        const warn3Date = new Date();
        warn3Date.setDate(warn3Date.getDate() + 3);
        const warn3DateStr = warn3Date.toISOString().split('T')[0];

        const { data: warningSubs } = await supabase
            .from('subscriptions')
            .select('id, user_id')
            .eq('status', 'active')
            .eq('end_date', warn3DateStr);

        if (warningSubs?.length) {
            for (const sub of warningSubs) {
                await sendEmail(sub.user_id, 'subscription-expiry-warning', { days: 3 });
                processed.warned_3day++;
            }
        }

        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            processed
        });

    } catch (error) {
        console.error('Subscription expiry cron error:', error);
        res.status(500).json({ error: 'Cron job failed' });
    }
};
```

### 4. 입금 대기 만료 처리 Cron
- 위치: `api/cron/pending-payment-expiry.js`
- 스케줄: 매일 00:00 UTC

```javascript
// api/cron/pending-payment-expiry.js
/**
 * @task S4O1
 * 매일 00:00 UTC 실행 - 입금 대기 만료 처리
 * 7일 이상 미입금 요청 자동 취소
 */

module.exports = async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString();

        // 7일 이상 된 pending 상태 결제 요청 조회
        const { data: expiredPayments } = await supabase
            .from('payments')
            .select('id, user_id, amount, payment_type')
            .eq('status', 'pending')
            .lt('created_at', cutoffDate);

        let processed = 0;

        if (expiredPayments?.length) {
            for (const payment of expiredPayments) {
                // 상태를 expired로 변경
                await supabase
                    .from('payments')
                    .update({
                        status: 'expired',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', payment.id);

                // 만료 알림 이메일 발송
                await sendEmail(payment.user_id, 'payment-expired', {
                    amount: payment.amount,
                    payment_type: payment.payment_type
                });

                processed++;
            }
        }

        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            processed
        });

    } catch (error) {
        console.error('Pending payment expiry cron error:', error);
        res.status(500).json({ error: 'Cron job failed' });
    }
};
```

### 5. 이탈 위험 사용자 알림 Cron
- 위치: `api/cron/churn-risk-alert.js`
- 스케줄: 매일 09:00 UTC

```javascript
// api/cron/churn-risk-alert.js
/**
 * @task S4O1
 * 매일 09:00 UTC 실행 - 이탈 위험 사용자 알림
 * 7일 이상 미로그인 구독 사용자에게 재참여 이메일 발송
 */

module.exports = async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString();

        // 7일 이상 미로그인 + 활성 구독 사용자 조회
        const { data: churnRiskUsers } = await supabase
            .from('users')
            .select(`
                id,
                email,
                credit_balance,
                subscriptions!inner(status)
            `)
            .eq('subscriptions.status', 'active')
            .lt('last_login_at', cutoffDate);

        let processed = { feature_intro: 0, recharge: 0 };

        if (churnRiskUsers?.length) {
            for (const user of churnRiskUsers) {
                // 잔액에 따라 다른 이메일 발송
                if (user.credit_balance >= 1000) {
                    // 잔액 충분 → 새로운 기능 안내
                    await sendEmail(user.id, 'feature-intro');
                    processed.feature_intro++;
                } else {
                    // 잔액 부족 → 충전 안내
                    await sendEmail(user.id, 'recharge');
                    processed.recharge++;
                }
            }
        }

        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            processed
        });

    } catch (error) {
        console.error('Churn risk alert cron error:', error);
        res.status(500).json({ error: 'Cron job failed' });
    }
};
```

### 6. 챌린지 만료 알림 Cron
- 위치: `api/cron/challenge-expiry.js`
- 스케줄: 매월 1일 09:00 UTC

```javascript
// api/cron/challenge-expiry.js
/**
 * @task S4O1
 * 매월 1일 09:00 UTC 실행 - 챌린지 만료 알림
 * 만료 예정 챌린지 알림 발송
 */

module.exports = async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 이번 달 말일 계산
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];

        // 이번 달 말에 만료되는 챌린지 조회
        const { data: expiringChallenges } = await supabase
            .from('user_challenges')
            .select('id, user_id, challenge_name, end_date')
            .eq('status', 'active')
            .lte('end_date', lastDayStr);

        let processed = 0;

        if (expiringChallenges?.length) {
            for (const challenge of expiringChallenges) {
                await sendEmail(challenge.user_id, 'challenge-expiry', {
                    challenge_name: challenge.challenge_name,
                    end_date: challenge.end_date
                });
                processed++;
            }
        }

        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            processed
        });

    } catch (error) {
        console.error('Challenge expiry cron error:', error);
        res.status(500).json({ error: 'Cron job failed' });
    }
};
```

### 7. 통계 집계 Cron
- 위치: `api/cron/stats-aggregate.js`
- 스케줄: 매일 01:00 UTC

```javascript
// api/cron/stats-aggregate.js
/**
 * @task S4O1
 * 매일 01:00 UTC 실행 - 일일 통계 집계
 */

module.exports = async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    try {
        // 1. 사용자 통계
        const { count: newUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${dateStr}T00:00:00`)
            .lt('created_at', `${dateStr}T23:59:59`);

        // 2. 구독 통계
        const { count: newSubscriptions } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${dateStr}T00:00:00`)
            .lt('created_at', `${dateStr}T23:59:59`);

        // 3. 결제 통계 (confirmed 상태만)
        const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'confirmed')
            .gte('confirmed_at', `${dateStr}T00:00:00`)
            .lt('confirmed_at', `${dateStr}T23:59:59`);

        const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // 4. AI 사용량 통계
        const { count: aiUsage } = await supabase
            .from('api_usage_log')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${dateStr}T00:00:00`)
            .lt('created_at', `${dateStr}T23:59:59`);

        // 5. 통계 저장
        await supabase.from('daily_stats').upsert({
            date: dateStr,
            new_users: newUsers || 0,
            new_subscriptions: newSubscriptions || 0,
            total_revenue: totalRevenue,
            ai_usage_count: aiUsage || 0
        }, { onConflict: 'date' });

        res.status(200).json({
            success: true,
            date: dateStr,
            stats: { newUsers, newSubscriptions, totalRevenue, aiUsage }
        });

    } catch (error) {
        console.error('Stats aggregate cron error:', error);
        res.status(500).json({ error: 'Cron job failed' });
    }
};
```

### 8. 이메일 발송 유틸리티
- 위치: `api/utils/email.js`

```javascript
// api/utils/email.js
// S4BA6 이메일 템플릿과 연동
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(userId, templateId, data = {}) {
    // 사용자 이메일 조회
    const { data: user } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

    if (!user) return;

    // 템플릿 로드 및 발송 (S4BA6에서 구현)
    // ...
}

module.exports = { sendEmail };
```

## Expected Output Files
- `vercel.json` (crons 설정 추가)
- `api/cron/ai-pricing-update.js`
- `api/cron/subscription-expiry.js`
- `api/cron/pending-payment-expiry.js`
- `api/cron/churn-risk-alert.js`
- `api/cron/challenge-expiry.js`
- `api/cron/stats-aggregate.js`
- `api/utils/email.js`

## Completion Criteria
- [ ] vercel.json Cron 설정 완료
- [ ] AI 가격 업데이트 cron 구현
- [ ] 구독 만료 처리 cron 구현
- [ ] 입금 대기 만료 처리 cron 구현
- [ ] 이탈 위험 사용자 알림 cron 구현
- [ ] 챌린지 만료 알림 cron 구현
- [ ] 통계 집계 cron 구현
- [ ] CRON_SECRET 환경변수 설정
- [ ] Vercel 배포 후 cron 실행 테스트

## Tech Stack
- Vercel Cron Jobs
- Supabase
- Resend (이메일 발송)

## Task Agent
`devops-troubleshooter`

## Verification Agent
`qa-specialist`

## Tools
- Write, Read
- Bash (Cron 테스트)
- vercel-cli

## Execution Type
AI-Only

## Remarks
- Vercel Pro 플랜 필요 (Cron 지원)
- CRON_SECRET으로 인증 필수
- 타임존: UTC 기준
- S4BA6 (이메일 템플릿)과 연동 필요
- 무통장 입금 시스템과 연동 (pending-payment-expiry)

---

## 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S4O1 → `S4_개발-3차/DevOps/`

### 제2 규칙: Production 코드는 이중 저장
- Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
