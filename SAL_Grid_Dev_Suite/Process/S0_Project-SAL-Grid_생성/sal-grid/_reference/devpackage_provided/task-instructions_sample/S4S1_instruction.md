# Task Instruction - S4S1

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
S4S1

## Task Name
관리자 권한 체크

## Task Goal
Admin 전용 라우트 보호 및 역할 검증 미들웨어 구현

## Prerequisites (Dependencies)
- S2S1 (인증 미들웨어) 완료

## Specific Instructions

### 1. 관리자 권한 미들웨어
- 위치: `api/lib/auth/withAdmin.js`

```javascript
// api/lib/auth/withAdmin.js
/**
 * @task S4S1
 * 관리자 권한 확인 미들웨어
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function withAdmin(handler) {
    return async (req, res) => {
        // 1. 토큰 확인
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization required' });
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            // 2. 사용자 정보 확인
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (authError || !user) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // 3. 관리자 역할 확인
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('role, is_admin')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                return res.status(401).json({ error: 'User profile not found' });
            }

            // 4. 관리자 권한 검증
            if (profile.role !== 'admin' && !profile.is_admin) {
                return res.status(403).json({
                    error: 'Admin access required',
                    message: '관리자 권한이 필요합니다'
                });
            }

            // 5. 사용자 정보 전달
            req.user = {
                id: user.id,
                email: user.email,
                role: profile.role,
                is_admin: profile.is_admin
            };

            return handler(req, res);

        } catch (error) {
            console.error('Admin auth error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    };
}

module.exports = { withAdmin };
```

### 2. 관리자 라우트 보호 예시
- 위치: `api/admin/users.js`

```javascript
// api/admin/users.js
const { withAdmin } = require('../lib/auth/withAdmin');

module.exports = withAdmin(async (req, res) => {
    // 이 핸들러는 관리자만 접근 가능

    if (req.method === 'GET') {
        // 사용자 목록 조회
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, name, role, created_at, subscription_status')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        return res.status(200).json({ users });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
```

### 3. 관리자 라우트 목록
```
보호해야 할 Admin 라우트:
- GET  /api/admin/users        - 사용자 목록
- PUT  /api/admin/users/:id    - 사용자 정보 수정
- GET  /api/admin/subscriptions - 구독 목록
- PUT  /api/admin/subscriptions/:id - 구독 승인/거부
- GET  /api/admin/payments     - 결제 내역
- POST /api/admin/confirm-installation - 설치비 입금 확인
- GET  /api/admin/stats        - 통계 조회
```

### 4. 역할 기반 접근 제어 (RBAC)
```javascript
// api/lib/auth/roles.js
/**
 * 역할 정의
 */
const ROLES = {
    USER: 'user',
    PREMIUM: 'premium',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

/**
 * 역할별 권한
 */
const PERMISSIONS = {
    [ROLES.USER]: ['read:own', 'update:own'],
    [ROLES.PREMIUM]: ['read:own', 'update:own', 'use:ai'],
    [ROLES.ADMIN]: ['read:all', 'update:all', 'manage:users', 'manage:subscriptions'],
    [ROLES.SUPER_ADMIN]: ['*'] // 모든 권한
};

function hasPermission(role, permission) {
    const rolePermissions = PERMISSIONS[role] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(permission);
}

module.exports = { ROLES, PERMISSIONS, hasPermission };
```

### 5. 관리자 상태 확인 헬퍼
```javascript
// api/lib/auth/checkAdmin.js
async function isAdmin(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('role, is_admin')
        .eq('id', userId)
        .single();

    if (error || !data) return false;
    return data.role === 'admin' || data.is_admin === true;
}

module.exports = { isAdmin };
```

### 6. 보안 로그
```javascript
// api/lib/auth/auditLog.js
async function logAdminAction(adminId, action, targetId, details) {
    await supabase.from('admin_audit_logs').insert({
        admin_id: adminId,
        action,
        target_id: targetId,
        details,
        created_at: new Date().toISOString()
    });
}

module.exports = { logAdminAction };
```

### 7. Admin Audit Log 테이블
```sql
-- admin_audit_logs 테이블
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
```

## Expected Output Files
- `api/lib/auth/withAdmin.js`
- `api/lib/auth/roles.js`
- `api/lib/auth/checkAdmin.js`
- `api/lib/auth/auditLog.js`
- Admin 라우트들에 미들웨어 적용

## Completion Criteria
- [ ] 관리자 권한 미들웨어 구현
- [ ] 역할 기반 접근 제어 (RBAC) 구현
- [ ] Admin 라우트 보호 적용
- [ ] 관리자 액션 로깅 구현
- [ ] 비관리자 접근 시 403 응답 확인
- [ ] 테스트 완료

## Tech Stack
- Vercel Serverless Functions
- Supabase Auth

## Task Agent
`security-specialist`

## Verification Agent
`security-auditor`

## Tools
- Write, Read
- Bash (API 테스트)

## Execution Type
AI-Only

## Remarks
- Admin 권한은 users 테이블의 role 또는 is_admin 컬럼으로 확인
- 모든 관리자 액션은 감사 로그 기록
- 중요 액션은 2단계 인증 고려 (추후)

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S4S1 → `S4_개발-3차/Security/`

### 제2 규칙: Production 코드는 이중 저장
- Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
