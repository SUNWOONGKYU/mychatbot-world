# Task Instruction - S2BA5

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
S2BA5

## Task Name
프로젝트 관리 API

## Task Goal
사용자 프로젝트 생성, 목록 조회, 수정, 완료 처리를 위한 Serverless API 구현

## Prerequisites (Dependencies)
- S1D1 (DB 스키마 확정) 완료

## Specific Instructions

### 1. 프로젝트 생성 API
- 위치: `api/projects/create.js`

```javascript
// api/projects/create.js
/**
 * @task S2BA5
 * 프로젝트 생성 API
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 인증 확인
    const user = await verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const { name, description, template_id } = req.body;

    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: '프로젝트 이름은 필수입니다' });
    }

    try {
        // 프로젝트 생성
        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                name: name.trim(),
                description: description || '',
                template_id: template_id || null,
                status: 'active',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // 템플릿 기반 초기 데이터 생성 (있는 경우)
        if (template_id) {
            await initializeFromTemplate(project.id, template_id);
        }

        return res.status(201).json({
            success: true,
            project
        });

    } catch (error) {
        console.error('Project creation error:', error);
        return res.status(500).json({ error: '프로젝트 생성 중 오류가 발생했습니다' });
    }
}

async function initializeFromTemplate(projectId, templateId) {
    // 템플릿에서 초기 Task 복사 등의 로직
    // 향후 구현
}
```

### 2. 프로젝트 목록 조회 API
- 위치: `api/projects/list.js`

```javascript
// api/projects/list.js
/**
 * @task S2BA5
 * 프로젝트 목록 조회 API
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

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('projects')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: projects, count, error } = await query;

        if (error) throw error;

        return res.status(200).json({
            success: true,
            projects,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Project list error:', error);
        return res.status(500).json({ error: '프로젝트 목록 조회 중 오류가 발생했습니다' });
    }
}
```

### 3. 프로젝트 수정 API
- 위치: `api/projects/update.js`

```javascript
// api/projects/update.js
/**
 * @task S2BA5
 * 프로젝트 수정 API
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../lib/auth-middleware.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const { id, name, description, status } = req.body;

    if (!id) {
        return res.status(400).json({ error: '프로젝트 ID는 필수입니다' });
    }

    try {
        // 프로젝트 소유권 확인
        const { data: existing } = await supabase
            .from('projects')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existing || existing.user_id !== user.id) {
            return res.status(403).json({ error: '권한이 없습니다' });
        }

        // 업데이트할 필드만 포함
        const updateData = {
            updated_at: new Date().toISOString()
        };
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;

        const { data: project, error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            project
        });

    } catch (error) {
        console.error('Project update error:', error);
        return res.status(500).json({ error: '프로젝트 수정 중 오류가 발생했습니다' });
    }
}
```

### 4. 프로젝트 완료 API
- 위치: `api/projects/complete.js`

```javascript
// api/projects/complete.js
/**
 * @task S2BA5
 * 프로젝트 완료 처리 API
 */

import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '../lib/auth-middleware.js';

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

    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: '프로젝트 ID는 필수입니다' });
    }

    try {
        // 프로젝트 소유권 확인
        const { data: existing } = await supabase
            .from('projects')
            .select('user_id, status')
            .eq('id', id)
            .single();

        if (!existing || existing.user_id !== user.id) {
            return res.status(403).json({ error: '권한이 없습니다' });
        }

        if (existing.status === 'completed') {
            return res.status(400).json({ error: '이미 완료된 프로젝트입니다' });
        }

        // 완료 처리
        const { data: project, error } = await supabase
            .from('projects')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            project,
            message: '프로젝트가 완료되었습니다'
        });

    } catch (error) {
        console.error('Project complete error:', error);
        return res.status(500).json({ error: '프로젝트 완료 처리 중 오류가 발생했습니다' });
    }
}
```

## Expected Output Files
- `api/projects/create.js`
- `api/projects/list.js`
- `api/projects/update.js`
- `api/projects/complete.js`

## Completion Criteria
- [ ] POST /api/projects 프로젝트 생성
- [ ] GET /api/projects 목록 조회 (페이지네이션, 상태 필터)
- [ ] PUT /api/projects 프로젝트 수정
- [ ] POST /api/projects/complete 완료 처리
- [ ] 모든 API에 인증 필수
- [ ] 소유권 검증

## Tech Stack
- Vercel Serverless Functions
- Supabase
- JavaScript (ES6+)

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- supabase-js SDK

## Execution Type
AI-Only

## Remarks
- 프로젝트 삭제는 soft delete (status: 'deleted') 권장
- 템플릿 기반 초기화는 향후 확장

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
