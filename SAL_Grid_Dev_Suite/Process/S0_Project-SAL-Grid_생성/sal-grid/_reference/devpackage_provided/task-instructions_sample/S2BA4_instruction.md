# Task Instruction - S2BA4

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
S2BA4

## Task Name
회원가입 API

## Task Goal
이메일/비밀번호 기반 회원가입 Serverless API 구현 (Google OAuth 외 별도 가입 경로)

## Prerequisites (Dependencies)
- S1S1 (Supabase Auth Provider 설정) 완료

## Specific Instructions

### 1. 회원가입 API 엔드포인트
- 위치: `api/auth/signup.js`

```javascript
// api/auth/signup.js
/**
 * @task S2BA4
 * 이메일/비밀번호 회원가입 API
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, name } = req.body;

    // 입력 검증
    if (!email || !password) {
        return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: '유효한 이메일 형식이 아닙니다' });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({
            error: '비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다'
        });
    }

    try {
        // Supabase Auth로 회원가입
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // 이메일 확인 필요
            user_metadata: {
                full_name: name || ''
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                return res.status(409).json({ error: '이미 등록된 이메일입니다' });
            }
            throw authError;
        }

        // users 테이블에 추가 정보 저장
        const { error: profileError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email: email,
                full_name: name || '',
                created_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Auth 사용자는 생성됨, 프로필만 실패 (치명적이지 않음)
        }

        // 환영 이메일 발송 (비동기)
        sendWelcomeEmail(email, name).catch(console.error);

        return res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
            userId: authData.user.id
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다' });
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    // 최소 8자, 영문, 숫자, 특수문자 포함
    const minLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLength && hasLetter && hasNumber && hasSpecial;
}

async function sendWelcomeEmail(email, name) {
    // S2BA2 (이메일 발송 API) 호출
    const response = await fetch(`${process.env.VERCEL_URL || ''}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: email,
            template: 'welcome',
            data: { name: name || '회원' }
        })
    });

    if (!response.ok) {
        throw new Error('Welcome email send failed');
    }
}
```

### 2. 이메일 확인 API
- 위치: `api/auth/verify-email.js`

```javascript
// api/auth/verify-email.js
/**
 * @task S2BA4
 * 이메일 확인 처리 API
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, type } = req.body;

    if (!token) {
        return res.status(400).json({ error: '토큰이 필요합니다' });
    }

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type || 'signup'
        });

        if (error) {
            return res.status(400).json({ error: '유효하지 않거나 만료된 토큰입니다' });
        }

        return res.status(200).json({
            success: true,
            message: '이메일이 확인되었습니다.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({ error: '이메일 확인 처리 중 오류가 발생했습니다' });
    }
}
```

### 3. 비밀번호 검증 유틸리티
- 위치: `api/lib/password-utils.js`

```javascript
// api/lib/password-utils.js
/**
 * @task S2BA4
 * 비밀번호 유효성 검증 유틸리티
 */

export function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('최소 8자 이상이어야 합니다');
    }
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('영문자를 포함해야 합니다');
    }
    if (!/\d/.test(password)) {
        errors.push('숫자를 포함해야 합니다');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('특수문자를 포함해야 합니다');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function getPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
}
```

## Expected Output Files
- `api/auth/signup.js`
- `api/auth/verify-email.js`
- `api/lib/password-utils.js`

## Completion Criteria
- [ ] POST /api/auth/signup 엔드포인트 구현
- [ ] 이메일 형식 검증
- [ ] 비밀번호 강도 검증 (8자+, 영문/숫자/특수문자)
- [ ] 중복 이메일 체크
- [ ] Supabase Auth 연동
- [ ] users 테이블 프로필 생성
- [ ] 환영 이메일 발송 연동
- [ ] 이메일 확인 API 구현

## Tech Stack
- Vercel Serverless Functions
- Supabase Auth
- JavaScript (ES6+)

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- supabase-js SDK
- Vercel Environment Variables

## Execution Type
AI-Only

## Remarks
- Google OAuth와 별도의 가입 경로 제공
- 이메일 확인 필수 (email_confirm: false)
- 비밀번호는 Supabase에서 해시 처리

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
