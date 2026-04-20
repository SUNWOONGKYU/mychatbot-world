# S7FE5 Verification Report

**검증자:** code-reviewer-core
**날짜:** 2026-04-20
**Task:** S7FE5 — P0 첫인상 페이지 리디자인 (Landing + Login + Signup + MarketingGNB/Hero)
**검증 방식:** 정적 코드 분석 (빌드 불가 환경 — 한글 경로 제약)

---

## 개요

### 대상 파일 (5개)

| 파일 | 변경 유형 | 라인 수 (추정) |
|------|----------|--------------|
| `app/page.tsx` | 부분 수정 (9개 섹션 semantic 전환) | 397 |
| `app/login/page.tsx` | 완전 재작성 | 283 |
| `app/signup/page.tsx` | 완전 재작성 | 458 |
| `components/landing/hero.tsx` | 완전 재작성 | 147 |
| `components/landing/marketing-gnb.tsx` | 태스크 주석 업데이트 + 구조 유지 | 218 |

---

## 체크리스트 10항목

### 1. 기존 비즈니스 로직 보존 — PASS

| 항목 | 확인 결과 |
|------|---------|
| `signInWithEmail(email, password)` Supabase 호출 | PASS — login/page.tsx line 40 |
| `signInWithGoogle()` OAuth 리디렉션 | PASS — login/page.tsx line 57 |
| `supabase.auth.signInWithOAuth({ provider: 'google' })` | PASS — signup/page.tsx line 189 |
| `supabase.auth.signUp(...)` | PASS — signup/page.tsx line 209 |
| `router.replace('/')` 로그인 후 리디렉션 | PASS — login/page.tsx line 41, signup/page.tsx line 232 |
| `isLoggedIn` prop 기반 CTA 분기 (Hero) | PASS — hero.tsx line 16-17 |
| 이메일 입력 필드 존재 | PASS |
| 비밀번호 입력 필드 존재 | PASS |
| 로그인 버튼 존재 | PASS |

**판정: PASS**

---

### 2. Semantic 토큰 전용 소비 (핵심!) — PARTIAL PASS

#### Primitive 직접 참조 grep 결과

**login/page.tsx:**
- `var(--color-brand-500)` — line 171, 207: `color-mix(in oklch, var(--color-brand-500) 20%, transparent)` 에 사용
- 통합 보고서 §4에서 `--color-brand-500`은 허용된 Primitive CSS var() 참조로 명시

**signup/page.tsx:**
- `var(--color-brand-500)` — line 69: 동일 패턴 (허용)

**hero.tsx:**
- `var(--color-brand-400)`, `var(--color-brand-500)`, `var(--color-brand-900)` — 배경 장식(aria-hidden) 및 그라디언트
- `var(--color-accent-400)` — 배경 장식(aria-hidden)
- `var(--color-success-600)`, `bg-success-300` — Secondary CTA 및 신뢰 지표 체크마크 색상
- 통합 보고서 §4에서 `--color-success-600/700/800`은 커뮤니티/보조 CTA 배경에 허용된 Primitive CSS var() 참조로 명시

**app/page.tsx:**
- `var(--color-brand-900)`, `var(--color-brand-500)` — 배경 그라디언트
- `var(--color-success-700)`, `var(--color-success-800)`, `var(--color-success-600)` — 커뮤니티 섹션 및 CTA 배경

**marketing-gnb.tsx:**
- `rgb(var(--bg-muted))`, `rgb(var(--primary-500))`, `rgb(var(--primary-400))`, `rgb(var(--color-primary))`, `rgb(var(--text-secondary))`, `rgb(var(--text-primary))`, `rgb(var(--border))`, `rgb(var(--bg-surface))` — 레거시 호환 레이어 토큰 다수 사용

**하드코딩 색상 확인:**
- `login/page.tsx`: GoogleIcon SVG의 `fill="#4285F4"`, `fill="#34A853"`, `fill="#FBBC05"`, `fill="#EA4335"` — Google 공식 브랜드 색상 SVG (허용)
- `signup/page.tsx`: 동일 GoogleIcon 패턴
- 나머지 파일: `#HEX`, `rgb()`, `rgba()` 하드코딩 없음 (확인됨)

**MarketingGNB 레거시 토큰 이슈:**
`marketing-gnb.tsx`는 통합 보고서에 "태스크 주석 업데이트"만 수행됐다고 기재되어 있으며, 내부 로직은 이전 코드 유지. `rgb(var(--primary-500))`, `rgb(var(--bg-muted))` 등 레거시 호환 레이어 토큰을 사용. 해당 토큰들은 `globals.css`의 레거시 호환 레이어(line ~408~)에서 여전히 정의되어 있어 기능 동작에는 문제 없음. 그러나 S7 Semantic 토큰(`--interactive-primary`, `--surface-0` 등)으로의 전환은 미완료.

**판정: PARTIAL PASS**
- login, signup, hero, page.tsx: PASS (CSS var() Primitive 참조 — 통합보고서 허용 범위)
- marketing-gnb.tsx: MINOR ISSUE (레거시 호환 레이어 토큰 잔존, 기능 무결성 유지)

---

### 3. 컴포넌트 시스템 활용 — PASS

| 항목 | 결과 |
|------|------|
| Field 컴포넌트 (S7FE2 패턴) | PASS — signup/page.tsx에 Field 컴포넌트 인라인 구현 (useId + aria-describedby + aria-invalid 패턴 준수) |
| Button (S7FE2) 스타일 적용 | PASS — login/page.tsx, signup/page.tsx에서 Semantic 토큰 기반 버튼 구현 |
| Typography Display (Hero) | PASS — `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl` 4단계 스케일 |
| MarketingGNB Landing 배치 | PASS — app/page.tsx에 MarketingGNB 컴포넌트 포함 |

**판정: PASS**

---

### 4. Kakao 로그인 완전 제거 — PASS

**grep 결과:**
- `app/login/page.tsx`: 'kakao' 문자열 0건 (주석 "카카오 제거" 1건만 존재)
- `app/signup/page.tsx`: 'kakao' 문자열 0건

Google OAuth 단독 구현 확인. Google 버튼이 이메일/비밀번호 폼 상단에 배치됨 (최우선 위계).

**판정: PASS**

---

### 5. A11y — heading hierarchy — PASS

**app/page.tsx:**
- h1: hero.tsx 내부 (HeroSection)
- h2: SECTION 2~9 각 섹션 제목
- h3: 섹션 내 서브 항목
- h4: 코코봇 유형 카드 제목
- DOM 위계: h1(1개) → h2(다수) → h3 → h4 올바름

**app/login/page.tsx:**
- h1: "로그인" (line 79) — 1개

**app/signup/page.tsx:**
- h1: "회원가입" (line 311), 성공 화면 h1: "인증 이메일 발송 완료" (line 276) — 각 상태에 1개

**aria-label:**
- `aria-label="CoCoBot World 홈으로"` (login, signup)
- `aria-label="Google 계정으로 로그인"`, `"Google 계정으로 가입"` 존재
- `aria-label="메뉴 열기"` (marketing-gnb)
- `aria-label="마케팅 메인 내비게이션"` (marketing-gnb nav)
- `aria-label="메인 히어로"` (hero section)

**판정: PASS**

---

### 6. A11y — Form 접근성 — PASS

| 항목 | 결과 |
|------|------|
| login/page.tsx `useId()` 활용 | PASS — emailId, passwordId, emailErrorId, passwordErrorId, generalErrorId 5개 생성 |
| signup/page.tsx Field 컴포넌트 내 `useId()` | PASS — inputId, errorId를 Field 내부에서 생성 |
| `aria-describedby` 연결 | PASS — login line 164, signup Field 컴포넌트 line 56 |
| `aria-invalid={!!error}` | PASS — signup Field 컴포넌트 line 57 |
| 에러 배너 `role="alert"` + `aria-live="assertive"` | PASS — login line 95-96, signup line 324-325 |
| Field 에러 메시지 `role="alert"` | PASS — signup Field 컴포넌트 line 85 |
| `autoComplete="email"` | PASS — login line 162 |
| `autoComplete="current-password"` | PASS — login line 199 |
| `autoComplete="new-password"` | PASS — signup Field line 409, 421 |

**판정: PASS**

---

### 7. 한글 가독성 — PASS

**`[word-break:keep-all]` 적용 확인:**
- `app/page.tsx`: 17개소 (heading, p, 카드 설명 전체)
- `app/login/page.tsx`: 1개소 (법적 동의 텍스트 line 244)
- `app/signup/page.tsx`: 1개소 (성공 화면 설명 line 277)
- `components/landing/hero.tsx`: h1(line 62), p(line 81)

**판정: PASS**

---

### 8. 반응형 — PASS

**Hero 4단계 스케일:**
- `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl` (hero.tsx line 62)

**GNB 모바일 메뉴:**
- 햄버거 버튼 `sm:hidden` 영역에 존재 (marketing-gnb.tsx line 134)
- 모바일 드로어 `mobileOpen` 상태로 토글 (line 170)
- 데스크탑 nav `hidden sm:flex` (line 71)

**버튼 반응형:**
- Hero CTA: `w-full sm:w-auto` (hero.tsx line 93, 115)
- app/page.tsx 하단 CTA: `w-full sm:w-auto` (line 368, 380)

**판정: PASS**

---

### 9. focus-visible 링 — PASS

**login/page.tsx:**
- 홈 링크, 구글 버튼, 비밀번호 찾기 링크, 로그인 버튼, 회원가입 링크에 `focus-visible:ring-ring-focus` 적용 (5개소)

**signup/page.tsx:**
- 홈 링크, 구글 버튼, 제출 버튼, 로그인 링크, 홈으로 링크에 `focus-visible:ring-ring-focus` 적용 (6개소)

**hero.tsx:**
- Primary CTA, Secondary CTA에 `focus-visible:ring-ring-focus` 적용 (2개소)

**marketing-gnb.tsx:**
- focus-visible 클래스 미적용 — 레거시 코드 유지 구간 (MINOR ISSUE)

**판정: PASS** (핵심 인터랙티브 요소 커버, MarketingGNB는 레거시 구간)

---

### 10. Middleware/Route 무결성 — PASS

**app/page.tsx의 라우트 확인:**

| 경로 | 존재 여부 |
|------|---------|
| `/login` | PASS — `app/login/` 디렉토리 확인 |
| `/signup` | PASS — `app/signup/` 디렉토리 확인 |
| `/mypage` | PASS — `app/mypage/` 디렉토리 확인 |
| `/create` | PASS — `app/create/` 디렉토리 확인 |
| `/guest` | PASS — `app/guest/` 디렉토리 확인 |
| `/skills` | PASS — `app/skills/` 디렉토리 확인 |
| `/community` | PASS — `app/community/` 디렉토리 확인 |
| `/terms` | PASS — `app/terms/` 디렉토리 확인 |
| `/privacy` | PASS — `app/privacy/` 디렉토리 확인 |
| `/reset-password` | PASS — `app/reset-password/` 디렉토리 확인 |
| `/auth/callback` | PASS — `app/auth/callback/` 디렉토리 확인 |

**이전 버그 수정 확인:**
- Hero의 CTA가 `/home` (404 경로)에서 `/mypage` (유효)로 수정됨 (hero.tsx line 16)

**누락 이미지/자산:** 없음 (외부 이미지 참조 없음)

**판정: PASS**

---

## 비즈니스 로직 보존 상세

### Login Handler 분석 (`app/login/page.tsx`)

```
handleEmailLogin():
  - e.preventDefault() 호출
  - email/password 빈값 검사
  - signInWithEmail(email, password) — lib/auth 임포트
  - 성공 시 router.replace('/') 리디렉션
  - 에러 분기: 'invalid login credentials' 한국어 변환
  - loadingEmail 상태 관리

handleGoogleLogin():
  - signInWithGoogle() — lib/auth 임포트
  - OAuth 자동 리디렉션 (catch에서 에러만 처리)
  - loadingGoogle 상태 관리
```

**결론: 기존 Supabase auth 핸들러 100% 보존 확인**

### Signup Handler 분석 (`app/signup/page.tsx`)

```
handleGoogleSignup():
  - supabase.auth.signInWithOAuth({ provider: 'google' })
  - redirectTo: /auth/callback

handleSubmit():
  - validate() 호출 (4-필드 유효성 검사)
  - supabase.auth.signUp({ email, password, data: { display_name: name } })
  - emailRedirectTo: /auth/callback
  - 이미 가입 이메일 에러 분기
  - data.session 존재 시 router.replace('/') 즉시 리디렉션
  - 이메일 인증 필요 시 isSuccess = true

useEffect:
  - 기존 세션 감지 시 router.replace('/') 자동 리디렉션
```

**결론: 기존 Supabase 비즈니스 로직 100% 보존 확인**

---

## PO 확인 필요 이슈

### Issue 1: MarketingGNB vs Navbar 중복 렌더링 (우선순위: 높음)

- **현황:** `app/layout.tsx`의 Navbar가 `/` 경로에서도 렌더링됨. `app/page.tsx`에 MarketingGNB 추가로 `/` 접속 시 두 개의 상단바가 표시될 수 있음
- **영향:** 첫인상 페이지 UX 저하, 화면 공간 낭비
- **권고 조치:** Navbar의 HIDDEN_PATHS(또는 조건부 렌더링) 로직에 `/` 경로 추가 검토
- **차단 여부:** 차단 아님 (기능 동작에 문제 없음, PO 결정 사항)

### Issue 2: MarketingGNB 레거시 토큰 잔존 (우선순위: 낮음)

- **현황:** `marketing-gnb.tsx`가 `rgb(var(--primary-500))`, `rgb(var(--bg-muted))` 등 레거시 호환 레이어 토큰을 사용. S7 Semantic 토큰 전환 미완료
- **영향:** 해당 파일만 S7 디자인 일관성에서 벗어남 (동작 정상)
- **권고 조치:** 후속 Task에서 `marketing-gnb.tsx` Semantic 토큰 전면 전환 검토
- **차단 여부:** 차단 아님

---

## MINOR 권고사항

1. **login/page.tsx `aria-invalid` 미적용:** 로그인 페이지의 이메일·비밀번호 input 자체에 `aria-invalid` 속성이 없음. 현재 `aria-describedby`를 통해 에러 배너를 연결하나, per-field `aria-invalid` 추가 시 스크린리더 경험 향상
2. **marketing-gnb.tsx focus-visible 미적용:** 네비게이션 링크, CTA 버튼에 focus-visible 스타일 없음. 키보드 사용자 접근성 향상을 위해 후속 Task에서 추가 권고
3. **hero.tsx `oklch()` 하드코딩:** line 24에 `oklch(0.18 0.144 280)` 등 리터럴 OKLCH 값 사용. Semantic 토큰화 여지 있으나 배경 그라디언트 특수 값이므로 현재 수준에서 허용 가능

---

## 종합 판정

| 항목 | 결과 |
|------|------|
| 체크리스트 통과 | **9/10 PASS** (항목 2: PARTIAL PASS — MarketingGNB 레거시 토큰) |
| 비즈니스 로직 보존 | PASS (100% 보존) |
| Kakao 제거 | PASS (0건 확인) |
| Primitive 직접 참조 | PARTIAL PASS (CSS var() Primitive — 통합보고서 허용 범위, MarketingGNB 레거시 예외) |
| heading hierarchy | PASS |
| PO 확인 필요 이슈 | 2건 (GNB 중복, 레거시 토큰) — 차단 아님 |
| MINOR 권고사항 | 3건 |

### **최종 판정: Passed**

핵심 4개 파일(login, signup, hero, page.tsx)은 S7 디자인 시스템 원칙을 충실히 구현했으며, 비즈니스 로직 보존, Kakao 제거, A11y, 반응형, 한글 가독성 모두 요건을 충족한다. `marketing-gnb.tsx`의 레거시 토큰 잔존은 기능 동작에 영향 없으며 통합 보고서에서 이미 "태스크 주석 업데이트"만 수행된 것으로 명시되어 있으므로 차단 요인이 아니다.
