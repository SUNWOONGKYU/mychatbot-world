# Task Instruction - S4BA5

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
S4BA5

## Task Name
설치비 입금 확인 API

## Task Goal
SSAL Grid 설치비 무통장 입금 확인 및 관리자 확인 API 구현

## Prerequisites (Dependencies)
- S4D1 (결제/크레딧 테이블) 완료

## Specific Instructions

### 1. 설치비 입금 신청 API
- 위치: `api/payment/installation-request.js`

```javascript
// api/payment/installation-request.js
/**
 * @task S4BA5
 * 설치비 입금 신청 API
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 설치비 가격 (프로젝트당)
const INSTALLATION_FEE = 990000; // 99만원

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const { projectId, depositorName, bankName } = req.body;

    if (!projectId) {
        return res.status(400).json({ error: '프로젝트 ID가 필요합니다' });
    }

    if (!depositorName) {
        return res.status(400).json({ error: '입금자명이 필요합니다' });
    }

    try {
        // 프로젝트 소유권 확인
        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id, name')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (!project) {
            return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
        }

        // 기존 입금 신청 확인
        const { data: existingRequest } = await supabase
            .from('installation_payments')
            .select('*')
            .eq('project_id', projectId)
            .in('status', ['pending', 'confirmed'])
            .single();

        if (existingRequest) {
            return res.status(400).json({
                error: existingRequest.status === 'confirmed'
                    ? '이미 설치비가 확인된 프로젝트입니다'
                    : '이미 입금 확인 대기 중인 신청이 있습니다'
            });
        }

        // 입금 신청 생성
        const { data, error } = await supabase
            .from('installation_payments')
            .insert({
                user_id: user.id,
                project_id: projectId,
                amount: INSTALLATION_FEE,
                depositor_name: depositorName,
                bank_name: bankName || null,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // 이메일 알림 (관리자에게)
        await notifyAdmin(user, project, data);

        return res.status(201).json({
            success: true,
            payment: {
                id: data.id,
                amount: INSTALLATION_FEE,
                depositorName,
                status: 'pending'
            },
            bankInfo: {
                bankName: 'KB국민은행',
                accountNumber: '123-456-789012',
                accountHolder: 'SSALWorks'
            },
            message: '입금 신청이 완료되었습니다. 입금 후 영업일 기준 1-2일 내 확인됩니다.'
        });

    } catch (error) {
        console.error('Installation request error:', error);
        return res.status(500).json({ error: '입금 신청 중 오류가 발생했습니다' });
    }
}

async function notifyAdmin(user, project, payment) {
    // 관리자 이메일 발송 로직
    try {
        await fetch(`${process.env.VERCEL_URL || ''}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: process.env.ADMIN_EMAIL,
                template: 'installation-request',
                data: {
                    userName: user.email,
                    projectName: project.name,
                    amount: payment.amount,
                    depositorName: payment.depositor_name
                }
            })
        });
    } catch (e) {
        console.error('Admin notification error:', e);
    }
}
```

### 2. 설치비 입금 확인 API (관리자용)
- 위치: `api/admin/confirm-installation.js`

```javascript
// api/admin/confirm-installation.js
/**
 * @task S4BA5
 * 설치비 입금 확인 API (관리자 전용)
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken, isAdmin } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }

    // 관리자 권한 확인
    if (!(await isAdmin(user.id))) {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }

    const { paymentId, action, memo } = req.body;

    if (!paymentId || !action) {
        return res.status(400).json({ error: 'paymentId와 action이 필요합니다' });
    }

    if (!['confirm', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action은 confirm 또는 reject여야 합니다' });
    }

    try {
        // 입금 신청 조회
        const { data: payment, error: fetchError } = await supabase
            .from('installation_payments')
            .select('*, users!inner(email), projects!inner(name)')
            .eq('id', paymentId)
            .single();

        if (fetchError || !payment) {
            return res.status(404).json({ error: '입금 신청을 찾을 수 없습니다' });
        }

        if (payment.status !== 'pending') {
            return res.status(400).json({ error: '이미 처리된 신청입니다' });
        }

        const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';

        // 상태 업데이트
        const { error: updateError } = await supabase
            .from('installation_payments')
            .update({
                status: newStatus,
                confirmed_at: action === 'confirm' ? new Date().toISOString() : null,
                confirmed_by: user.id,
                admin_memo: memo || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', paymentId);

        if (updateError) throw updateError;

        // 프로젝트 상태 업데이트 (확인된 경우)
        if (action === 'confirm') {
            await supabase
                .from('projects')
                .update({
                    installation_paid: true,
                    installation_paid_at: new Date().toISOString()
                })
                .eq('id', payment.project_id);
        }

        // 사용자에게 이메일 알림
        await notifyUser(payment.users.email, payment.projects.name, action);

        return res.status(200).json({
            success: true,
            payment: {
                id: paymentId,
                status: newStatus,
                action
            },
            message: action === 'confirm'
                ? '입금이 확인되었습니다'
                : '입금 신청이 거부되었습니다'
        });

    } catch (error) {
        console.error('Installation confirm error:', error);
        return res.status(500).json({ error: '입금 확인 처리 중 오류가 발생했습니다' });
    }
}

async function notifyUser(email, projectName, action) {
    try {
        await fetch(`${process.env.VERCEL_URL || ''}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                template: action === 'confirm' ? 'installation-confirmed' : 'installation-rejected',
                data: { projectName }
            })
        });
    } catch (e) {
        console.error('User notification error:', e);
    }
}
```

### 3. 입금 신청 목록 조회 API (관리자용)
- 위치: `api/admin/installation-list.js`

```javascript
// api/admin/installation-list.js
/**
 * @task S4BA5
 * 입금 신청 목록 조회 API (관리자 전용)
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken, isAdmin } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await verifyToken(req);
    if (!user || !(await isAdmin(user.id))) {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }

    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('installation_payments')
            .select(`
                *,
                users!inner(email, full_name),
                projects!inner(name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return res.status(200).json({
            success: true,
            payments: data.map(p => ({
                id: p.id,
                user: {
                    email: p.users.email,
                    name: p.users.full_name
                },
                project: p.projects.name,
                amount: p.amount,
                depositorName: p.depositor_name,
                status: p.status,
                createdAt: p.created_at,
                confirmedAt: p.confirmed_at
            })),
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Installation list error:', error);
        return res.status(500).json({ error: '목록 조회 중 오류가 발생했습니다' });
    }
}
```

## Expected Output Files
- `api/payment/installation-request.js`
- `api/admin/confirm-installation.js`
- `api/admin/installation-list.js`

## Completion Criteria
- [ ] POST /api/payment/installation-request 입금 신청
- [ ] POST /api/admin/confirm-installation 입금 확인 (관리자)
- [ ] GET /api/admin/installation-list 신청 목록 (관리자)
- [ ] 프로젝트별 1회 입금 제한
- [ ] 관리자 이메일 알림
- [ ] 사용자 결과 알림

## Tech Stack
- Vercel Serverless Functions
- Supabase

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- supabase-js SDK
- Email API (S2BA2)

## Execution Type
AI-Only

## Remarks
- 설치비: 프로젝트당 99만원 (고정)
- 무통장 입금 방식
- 영업일 기준 1-2일 내 확인

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
