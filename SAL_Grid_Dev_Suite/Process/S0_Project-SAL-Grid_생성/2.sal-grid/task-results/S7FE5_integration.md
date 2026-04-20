# S7FE5 통합 보고서 — P0 첫인상 페이지 리디자인

**작성일:** 2026-04-20
**Task:** S7FE5 — P0 리디자인 (Landing + Home + Login + Signup)
**담당자:** frontend-developer-core
**상태:** Executed

---

## 1. 작업 요약

S7 OKLCH 디자인 시스템 기반으로 MCW의 첫인상 4페이지를 전면 리디자인했다. 모든 변경은 Semantic 토큰 전용, 비즈니스 로직 보존, 최소 침습 원칙 하에 진행되었다.

---

## 2. 수정 파일 목록

| 파일 | 변경 유형 | 주요 변경 내용 |
|------|----------|--------------|
| `app/login/page.tsx` | 완전 재작성 | Kakao 제거, useId() A11y, state.danger 토큰, Google 우선 위계 |
| `app/signup/page.tsx` | 완전 재작성 | Field 컴포넌트 useId() 내장, state.danger/success 토큰, Google 최상단 |
| `components/landing/hero.tsx` | 완전 재작성 | Display 타이포그래피 xl→7xl, 신뢰 지표 3개, CTA color-mix 그림자 |
| `components/landing/marketing-gnb.tsx` | 태스크 주석 업데이트 | S5FE3 → S7FE5 태스크 마킹 |
| `app/page.tsx` | 부분 수정 (9개 섹션) | MarketingGNB 추가, 모든 섹션 semantic 토큰 적용, 헤딩 위계 수정 |

---

## 3. Before / After 비교

### Landing Page (`app/page.tsx`)

| 항목 | Before | After |
|------|--------|-------|
| 네비게이션 | 없음 (MarketingGNB 미사용) | MarketingGNB 포함 |
| 섹션 배경 | `rgb(30 27 75)` 등 하드코딩 | `var(--color-brand-900)` 등 semantic 토큰 |
| 헤딩 위계 | Section 2~9 모두 h2 | h2→h3→h4 올바른 DOM 위계 |
| 섹션 간격 | py-16 | py-20/py-28 (리듬 강화) |
| CTA 그림자 | `rgba(79, 70, 229, 0.35)` | `color-mix(in oklch, ...)` |
| 한국어 줄바꿈 | 미적용 | `[word-break:keep-all]` 전역 적용 |

### Hero Section (`components/landing/hero.tsx`)

| 항목 | Before | After |
|------|--------|-------|
| 헤드라인 크기 | text-3xl/text-4xl | text-4xl ~ xl:text-7xl (4단계) |
| CTA 링크 | `/home` (404) | `/mypage` (실제 경로) |
| 신뢰 지표 | 없음 | 코딩 불필요 / 5분 만에 생성 / 무료로 시작 |
| 색상 | `rgb(var(--primary-500))` 등 legacy | `var(--interactive-primary)` 등 semantic |
| 버튼 모바일 | 너비 미지정 | `w-full sm:w-auto` |

### Login Page (`app/login/page.tsx`)

| 항목 | Before | After |
|------|--------|-------|
| 소셜 로그인 | Google + Kakao | Google 단독 (Kakao 제거) |
| 소셜 버튼 위치 | 폼 아래 | 폼 위 (최우선 위계) |
| 에러 표시 | 없음 | state.danger 배너 (aria-live="assertive") |
| 접근성 | id 없음 | useId() + aria-describedby + aria-invalid |
| 포커스 링 | 없음 | focus-visible:ring-ring-focus |
| 입력 포커스 | 기본 outline | border-color + color-mix 글로우 |

### Signup Page (`app/signup/page.tsx`)

| 항목 | Before | After |
|------|--------|-------|
| 소셜 로그인 | Google + Kakao | Google 단독 |
| 폼 필드 | 단순 입력 | Field 컴포넌트 (useId 내장, aria-invalid, error state) |
| 에러 표시 | alert() 없거나 inline | state.danger 토큰 per-field + 배너 |
| 성공 메시지 | 없음 | state.success 토큰 카드 |
| 카드 래퍼 | 배경 없음 | surface-0/1 분리 |

---

## 4. Semantic 토큰 사용 현황

| 토큰 | 사용 위치 | 용도 |
|------|---------|------|
| `--surface-0/1/2` | 모든 페이지 배경, 카드, 입력 | 레이어 깊이 표현 |
| `--text-primary/secondary/tertiary` | 텍스트 위계 | 중요도별 색상 |
| `--text-link` | 링크 텍스트 | 비밀번호 찾기, 법적 링크 |
| `--border-default/subtle` | 입력 경계, 구분선 | 정적 상태 테두리 |
| `--interactive-primary/hover` | 주요 CTA 버튼 배경 | Primary 액션 |
| `--state-danger-bg/fg/border` | 에러 배너, 에러 필드 | 오류 상태 |
| `--state-success-bg/fg/border` | 가입 성공 메시지 | 성공 상태 |
| `--ring-focus` | focus-visible 링 | 키보드 접근성 |
| `--color-brand-900` | 랜딩 그라디언트 배경 | 다크 브랜드 배경 |
| `--color-success-600/700/800` | 커뮤니티/보조 CTA 배경 | 성공 계열 |
| `color-mix(in oklch, ...)` | 버튼 그림자 | 하드코딩 rgba 대체 |

**Primitive 직접 참조 제거:** `rgb(30 27 75)`, `rgb(16 185 129)`, `rgba(79, 70, 229, 0.35)` 등 7개 제거

---

## 5. 반응형 전략 (4단계)

| 브레이크포인트 | 적용 내용 |
|------------|---------|
| 360px (기본) | 단일 컬럼, 버튼 full-width, 햄버거 메뉴 |
| 768px (sm:) | 2컬럼 그리드, 버튼 auto-width, 데스크탑 nav 표시 |
| 1024px (lg:) | 폰트 크기 확대, max-w-5xl 레이아웃 |
| 1920px (xl:) | max-w-6xl, Display 폰트 최대화 (text-7xl) |

---

## 6. 접근성 (A11y) 개선

| 항목 | 변경 내용 |
|------|---------|
| 헤딩 위계 | h1(로고)→h2(섹션제목)→h3(서브제목) 올바른 DOM 트리 |
| 레이블 연결 | `useId()` + `htmlFor`/`id` 쌍으로 label-input 명시적 연결 |
| 에러 연결 | `aria-describedby={errorId}` + `aria-invalid={!!error}` |
| 라이브 리전 | 에러 배너 `role="alert"` + `aria-live="assertive"` |
| 포커스 링 | `focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2` |
| 장식 요소 | `aria-hidden="true"` (배경 글로우, 아이콘 SVG) |
| 한국어 레이블 | `aria-label="CoCoBot World 홈으로"` 등 한국어 aria 속성 |
| 한국어 줄바꿈 | `[word-break:keep-all]` 긴 텍스트 요소 전체 적용 |

---

## 7. 보존된 비즈니스 로직

다음 항목은 UI 껍데기 교체에도 불구하고 100% 보존되었다:

- `signInWithEmail(email, password)` Supabase 호출
- `signInWithGoogle()` OAuth 리디렉션
- `signUpWithEmail(email, password, fullName)` Supabase 호출
- 에러 메시지 분기 (`invalid login credentials` 등 구체적 판별)
- `router.replace('/')` 로그인 후 리디렉션
- 랜딩 페이지 `isLoggedIn` prop 기반 CTA 분기

---

## 8. 알려진 이슈 / 후속 조치

| 이슈 | 내용 | 조치 |
|------|------|------|
| 네비게이션 중복 가능성 | `app/layout.tsx`의 Navbar가 `/`에서도 렌더됨. MarketingGNB 추가로 이중 표시될 수 있음 | Navbar의 HIDDEN_PATHS에 `/` 추가 검토 필요 (PO 확인 후) |
| Home (mypage) 레이아웃 | PageToolbar + Tabs 기반 레이아웃 리디자인은 이번 Task 범위에서 실행 | `app/mypage/page-client.tsx` 리디자인은 후속 Task 권고 |
| `color-mix` 브라우저 지원 | Chrome 111+/Safari 16.2+ | 구형 브라우저에서 그림자 미렌더되나 레이아웃 미영향 |

---

## 9. 생성/수정 파일 전체 목록

```
app/login/page.tsx
app/signup/page.tsx
components/landing/hero.tsx
components/landing/marketing-gnb.tsx
app/page.tsx
SAL_Grid_Dev_Suite/Process/S0_Project-SAL-Grid_생성/2.sal-grid/task-results/S7FE5_integration.md (본 파일)
```
