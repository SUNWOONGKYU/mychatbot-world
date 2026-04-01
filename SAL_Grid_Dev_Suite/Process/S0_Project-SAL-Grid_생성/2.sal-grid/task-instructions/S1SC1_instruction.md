# Task Instruction - S1SC1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S1SC1

## Task Name
Supabase Auth 강화 (소셜 로그인, 세션 관리)

## Task Goal
Supabase Auth를 이용하여 Google/Kakao 소셜 로그인을 설정하고, 세션 관리 로직과 RLS 정책을 강화한다. CSRF 보호와 안전한 세션 처리를 포함한다.

## Prerequisites (Dependencies)
- S1BI2 (Supabase 클라이언트 + 환경변수 설정)
- S1DB1 (기본 DB 스키마)

## Specific Instructions

### ⚠️ PO 선행 작업 (작업 시작 전 PO에게 요청)

아래 설정은 AI가 자동화할 수 없으며 PO가 직접 수행해야 한다:

1. **Supabase Dashboard > Authentication > Providers**
   - Google Provider 활성화
   - Kakao Provider 활성화 (또는 Custom OIDC)

2. **Google OAuth 설정 (Google Cloud Console)**
   - OAuth 2.0 클라이언트 ID 생성
   - 승인된 리디렉션 URI: `https://[project-ref].supabase.co/auth/v1/callback`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 환경변수 설정

3. **Kakao OAuth 설정 (Kakao Developers)**
   - 카카오 앱 생성 및 REST API 키 확인
   - Redirect URI 등록: `https://[project-ref].supabase.co/auth/v1/callback`

---

### 1. lib/auth.ts — Auth 유틸리티 함수

```ts
/**
 * @task S1SC1
 * @description Auth 유틸리티 — 소셜 로그인, 세션 관리
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Google 소셜 로그인 리디렉트
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
}

/**
 * Kakao 소셜 로그인 리디렉트
 */
export async function signInWithKakao() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * 현재 세션 조회
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

/**
 * 현재 유저 조회
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
```

### 2. app/auth/callback/route.ts — OAuth 콜백 핸들러

```ts
/**
 * @task S1SC1
 * @description OAuth 콜백 라우트 핸들러
 */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 로그인 성공 후 대시보드로 리디렉트
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### 3. middleware.ts — 세션 갱신 및 라우트 보호

```ts
/**
 * @task S1SC1
 * @description Next.js 미들웨어 — 세션 갱신 + 인증 라우트 보호
 */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

// 인증 없이 접근 가능한 공개 경로
const PUBLIC_PATHS = ['/', '/login', '/auth/callback', '/templates'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 세션 갱신 (쿠키 기반)
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) =>
    pathname === p || pathname.startsWith('/auth/'),
  );

  // 비인증 사용자가 보호 경로 접근 시 로그인 페이지로 리디렉트
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 인증된 사용자가 로그인 페이지 접근 시 대시보드로 리디렉트
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 4. app/login/page.tsx — 로그인 페이지

```tsx
/**
 * @task S1SC1
 * @description 로그인 페이지 — Google/Kakao 소셜 로그인
 */
'use client';

import { signInWithGoogle, signInWithKakao } from '@/lib/auth';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading('google');
    await signInWithGoogle();
  };

  const handleKakaoLogin = async () => {
    setLoading('kakao');
    await signInWithKakao();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-text-primary">로그인</h1>
        <p className="mb-8 text-text-secondary">My Chatbot World에 오신 것을 환영합니다</p>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {loading === 'google' ? '로그인 중...' : 'Google로 계속하기'}
          </button>

          <button
            onClick={handleKakaoLogin}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-yellow-400 px-4 py-3 text-sm font-medium text-yellow-900 transition-colors hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading === 'kakao' ? '로그인 중...' : 'Kakao로 계속하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. 추가 패키지 설치
```bash
npm install @supabase/auth-helpers-nextjs
```

### 6. 저장 위치
- `lib/auth.ts` → 프로젝트 루트 lib/
- `app/auth/callback/route.ts` → Next.js App Router
- `middleware.ts` → 프로젝트 루트
- `app/login/page.tsx` → Next.js App Router
- 원본 문서: `Process/S1_개발_준비/Security/`

## Expected Output Files
- `lib/auth.ts`
- `app/auth/callback/route.ts`
- `middleware.ts`
- `app/login/page.tsx`

## Completion Criteria
- [ ] Google 소셜 로그인 버튼 클릭 시 Google OAuth 페이지로 이동
- [ ] Kakao 소셜 로그인 버튼 클릭 시 Kakao OAuth 페이지로 이동
- [ ] OAuth 콜백 처리 후 `/dashboard`로 리디렉트
- [ ] 미인증 사용자가 `/dashboard` 접근 시 `/login`으로 리디렉트
- [ ] 인증된 사용자가 `/login` 접근 시 `/dashboard`로 리디렉트
- [ ] TypeScript 타입 에러 없음

## Tech Stack
- Supabase Auth (OAuth 2.0)
- Next.js App Router (Route Handlers, Middleware)
- @supabase/auth-helpers-nextjs
- TypeScript

## Tools
- npm
- Supabase Dashboard (PO 수행)
- Google Cloud Console (PO 수행)
- Kakao Developers (PO 수행)

## Execution Type
Human-AI (OAuth Provider 설정은 PO가 수행)

## Remarks
- Google/Kakao OAuth Provider 설정은 PO 선행 작업 필수
- `createMiddlewareClient`는 세션 자동 갱신을 처리 — 중요한 보안 레이어
- CSRF 보호는 Supabase Auth의 PKCE 플로우를 통해 자동 처리됨
- Kakao Provider가 Supabase에서 지원되지 않을 경우 Custom OIDC 방식 사용

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1SC1 → `Process/S1_개발_준비/Security/`

### 제2 규칙: Production 코드는 이중 저장
- SC Area: Stage 폴더 + `api/Security/` (Pre-commit Hook 자동 복사)
