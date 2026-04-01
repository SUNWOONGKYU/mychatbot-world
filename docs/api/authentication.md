# API 인증 가이드

> MyChatbot World API는 Supabase 발급 JWT Bearer Token을 사용합니다.

---

## 인증 방식

모든 인증이 필요한 API 요청은 HTTP `Authorization` 헤더에 **JWT Bearer Token**을 포함해야 합니다.

```
Authorization: Bearer {your_access_token}
```

---

## 1. 토큰 발급 방법

### 1-1. 이메일/비밀번호 로그인

Supabase Auth를 통해 로그인하면 액세스 토큰이 발급됩니다.

**cURL 예제:**
```bash
curl -X POST 'https://<SUPABASE_PROJECT_URL>/auth/v1/token?grant_type=password' \
  -H 'apikey: <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

**응답 예시:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "abcdef123456...",
  "user": {
    "id": "uuid-of-user",
    "email": "user@example.com"
  }
}
```

**JavaScript 예제 (Supabase 클라이언트 사용):**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'yourpassword',
});

// 액세스 토큰
const accessToken = data.session?.access_token;
```

**Python 예제:**
```python
import requests

SUPABASE_URL = "https://<SUPABASE_PROJECT_URL>"
SUPABASE_ANON_KEY = "<SUPABASE_ANON_KEY>"

response = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    },
    json={
        "email": "user@example.com",
        "password": "yourpassword"
    }
)
data = response.json()
access_token = data["access_token"]
```

---

## 2. API 요청 시 헤더 설정

발급받은 액세스 토큰을 모든 인증 필요 API 요청에 포함합니다.

**cURL 예제:**
```bash
curl -X GET 'https://your-app.vercel.app/api/bots' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

**JavaScript 예제:**
```javascript
const response = await fetch('/api/bots', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
```

**Python 예제:**
```python
import requests

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

response = requests.get(
    "https://your-app.vercel.app/api/bots",
    headers=headers
)
data = response.json()
```

---

## 3. 토큰 만료 처리

JWT 액세스 토큰은 기본적으로 **1시간(3600초)** 후 만료됩니다.

### 만료 감지

만료된 토큰으로 요청 시 `401 Unauthorized` 응답이 반환됩니다:

```json
{
  "error": {
    "code": "AUTH_002",
    "message": "토큰이 만료되었습니다. 다시 로그인해 주세요.",
    "details": {}
  }
}
```

### 토큰 갱신 방법

**cURL 예제:**
```bash
curl -X POST 'https://<SUPABASE_PROJECT_URL>/auth/v1/token?grant_type=refresh_token' \
  -H 'apikey: <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "your_refresh_token"}'
```

**JavaScript 예제 (Supabase 자동 갱신):**
```javascript
// Supabase 클라이언트를 사용하면 토큰 갱신이 자동으로 처리됩니다.
const { data: { session } } = await supabase.auth.getSession();

// 세션이 있으면 자동으로 최신 access_token이 포함됩니다.
const accessToken = session?.access_token;
```

**Python 예제:**
```python
response = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
    headers={
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    },
    json={"refresh_token": refresh_token}
)
new_data = response.json()
new_access_token = new_data["access_token"]
```

---

## 4. Supabase 클라이언트 사용 시 자동 인증 처리

Next.js(App Router) 프로젝트에서 Supabase Route Handler 클라이언트를 사용하면 인증이 자동으로 처리됩니다.

### 서버 컴포넌트 / Route Handler

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 쿠키에서 세션 자동 로드 — 토큰 헤더 직접 관리 불필요
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // session.user.id 로 사용자 식별
  const userId = session.user.id;
  // ...
}
```

### 브라우저 클라이언트 (클라이언트 컴포넌트)

```typescript
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// 현재 세션 조회
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;

// 이후 fetch 요청에서 사용
const res = await fetch('/api/some-endpoint', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

---

## 5. 관리자 전용 엔드포인트

일부 엔드포인트(예: `PATCH /api/payments/confirm`)는 관리자 전용입니다.

관리자 인증은 `X-Admin-Key` 헤더를 사용합니다:

```bash
curl -X PATCH 'https://your-app.vercel.app/api/payments/confirm' \
  -H 'X-Admin-Key: your_admin_api_key' \
  -H 'Content-Type: application/json' \
  -d '{"paymentId": "uuid-here"}'
```

> **주의:** `X-Admin-Key` 값은 서버 환경 변수 `ADMIN_API_KEY`에 설정된 값과 일치해야 합니다. 클라이언트 측 코드에 절대 노출하지 마세요.

---

## 6. 인증 없이 접근 가능한 엔드포인트

다음 엔드포인트는 인증 없이(공개) 접근할 수 있습니다:

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/community` | 커뮤니티 게시글 목록 조회 |
| `GET /api/jobs` | 채용 공고 목록 조회 |
| `GET /api/skills` | 스킬 마켓 목록 조회 |
| `GET /api/templates` | 봇 템플릿 목록 조회 |

---

## 에러 코드 참조

| 에러 코드 | HTTP 상태 | 상황 |
|-----------|-----------|------|
| `AUTH_001` | 401 | Authorization 헤더 없음 |
| `AUTH_002` | 401 | 토큰 만료 |
| `AUTH_003` | 401 | 유효하지 않은 토큰 |
| `AUTH_004` | 403 | 권한 부족 (다른 사용자 리소스 접근) |

전체 에러 코드는 [에러 코드표](./error-codes.md)를 참조하세요.
