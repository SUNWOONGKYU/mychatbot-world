# S1SC1 — Supabase Auth 강화: OAuth 설정 가이드 (PO 전용)

> **작업 코드**: S1SC1
> **담당**: Product Owner (수동 설정 필요)
> **연관 코드 파일**: `lib/auth.ts`, `app/auth/callback/route.ts`, `middleware.ts`, `app/login/page.tsx`

---

## 개요

이 문서는 Google 및 Kakao 소셜 로그인을 활성화하기 위해 PO가 직접 수행해야 하는
외부 서비스 설정 절차를 안내합니다.
코드 파일은 이미 생성되어 있으며, 아래 환경변수와 대시보드 설정만 완료하면 동작합니다.

---

## 1단계 — Supabase Dashboard: Auth Providers 활성화

1. [Supabase Dashboard](https://app.supabase.com) 로그인
2. 프로젝트 선택 → **Authentication** → **Providers**
3. **Google** 행 클릭 → Enable 토글 ON
   - Google Client ID / Secret은 2단계에서 받아옵니다
4. **Kakao** 행 클릭 → Enable 토글 ON
   - Kakao REST API Key는 3단계에서 받아옵니다

---

## 2단계 — Google Cloud Console: OAuth 2.0 클라이언트 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보** → **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
4. 애플리케이션 유형: **웹 애플리케이션**
5. **승인된 리디렉션 URI** 추가:
   ```
   https://[project-ref].supabase.co/auth/v1/callback
   ```
   > `[project-ref]`는 Supabase 프로젝트 설정에서 확인 (`Settings > General > Reference ID`)
6. 생성 후 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사
7. Supabase Dashboard > Providers > Google에 붙여넣기

---

## 3단계 — Kakao Developers: REST API 키 발급

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 내 애플리케이션 → **애플리케이션 추가하기**
3. 생성된 앱 클릭 → **앱 키** 탭 → **REST API 키** 복사
4. **카카오 로그인** 메뉴 → 활성화 ON
5. **Redirect URI 등록** → 아래 URI 추가:
   ```
   https://[project-ref].supabase.co/auth/v1/callback
   ```
6. Supabase Dashboard > Providers > Kakao에 REST API 키 붙여넣기

---

## 4단계 — 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 다음을 추가합니다
(절대 Git에 커밋하지 마세요 — `.gitignore`에 이미 포함되어 있어야 합니다):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Anon Key는 Supabase Dashboard → **Settings** → **API** → **Project API keys** 에서 확인

---

## 5단계 — npm 패키지 설치

```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
```

---

## 6단계 — 동작 확인 체크리스트

- [ ] `npm run dev` 실행 후 `http://localhost:3000/login` 접속
- [ ] Google 버튼 클릭 → Google 동의 화면 표시
- [ ] 동의 후 `/dashboard` 리디렉션 확인
- [ ] 카카오 버튼 클릭 → 카카오 로그인 화면 표시
- [ ] 동의 후 `/dashboard` 리디렉션 확인
- [ ] 로그인된 상태에서 `/login` 접속 시 `/dashboard`로 자동 리디렉션 확인
- [ ] 미로그인 상태에서 `/dashboard` 접속 시 `/login`으로 리디렉션 확인

---

## Redirect URI 형식 요약

| 서비스 | Redirect URI |
|--------|-------------|
| Google | `https://[project-ref].supabase.co/auth/v1/callback` |
| Kakao  | `https://[project-ref].supabase.co/auth/v1/callback` |
| 앱 내부 | `[your-domain]/auth/callback` (코드에서 자동 처리) |

---

## 생성된 코드 파일 요약

| 파일 | 역할 |
|------|------|
| `lib/auth.ts` | signInWithGoogle, signInWithKakao, signOut, getSession, getCurrentUser |
| `app/auth/callback/route.ts` | OAuth code → session 교환, /dashboard 리디렉션 |
| `middleware.ts` | 세션 갱신, 미인증 → /login, 인증됨 + /login → /dashboard |
| `app/login/page.tsx` | 로그인 UI (Google 흰색 버튼, Kakao 노란색 버튼) |
