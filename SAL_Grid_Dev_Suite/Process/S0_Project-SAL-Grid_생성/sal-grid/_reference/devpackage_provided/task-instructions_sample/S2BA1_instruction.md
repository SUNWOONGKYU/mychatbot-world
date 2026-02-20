# Task Instruction - S2BA1

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
S2BA1

## Task Name
Google OAuth Serverless API

## Task Goal
Google OAuth 인증을 위한 Serverless API 엔드포인트 구현 (/api/auth/google, /api/auth/google/callback)

## Prerequisites (Dependencies)
- S1S1 (Supabase Auth Provider 설정) 완료

## Specific Instructions

### 1. OAuth 시작 API
- 위치: `api/auth/google.js`

```javascript
// api/auth/google.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.APP_URL}/api/auth/google/callback`
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // OAuth URL로 리다이렉트
  res.redirect(data.url);
};
```

### 2. OAuth 콜백 API
- 위치: `api/auth/google/callback.js`

```javascript
// api/auth/google/callback.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/pages/auth/login.html?error=no_code');
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return res.redirect(`/pages/auth/login.html?error=${encodeURIComponent(error.message)}`);
  }

  // 세션 쿠키 설정 또는 토큰 전달
  // 대시보드로 리다이렉트
  res.redirect('/pages/dashboard/index.html');
};
```

### 3. 로그아웃 API
- 위치: `api/auth/logout.js`

```javascript
// api/auth/logout.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.redirect('/pages/auth/login.html');
};
```

### 4. Vercel 설정 확인
- `vercel.json`에 API 라우팅 설정 확인

### 5. 에러 처리
- OAuth 실패 시 에러 메시지 전달
- 사용자 친화적 에러 페이지 리다이렉트

## Expected Output Files
- `api/auth/google.js`
- `api/auth/google/callback.js`
- `api/auth/logout.js`

## Completion Criteria
- [ ] OAuth 시작 API 구현
- [ ] OAuth 콜백 API 구현
- [ ] 로그아웃 API 구현
- [ ] Google 로그인 플로우 테스트
- [ ] 에러 처리 구현
- [ ] Vercel 배포 후 테스트

## Tech Stack
- Vercel Serverless Functions
- Supabase Auth
- OAuth 2.0

## Task Agent
`backend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Write, Read
- Bash (vercel dev 로컬 테스트)

## Execution Type
AI-Only

## Remarks
- Supabase의 내장 OAuth 기능 활용
- 세션 관리는 Supabase가 처리
- 클라이언트 측에서 supabase.auth.getSession() 사용

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

