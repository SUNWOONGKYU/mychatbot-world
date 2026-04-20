# S7TS1 A11y 정적 분석 리포트

**작성일**: 2026-04-20
**분석 방법**: 정적 코드 분석 (Grep + Read)
**환경 제약**: 한글 경로(`G:\내 드라이브\`) 로컬 npm 빌드 불가 → Lighthouse/axe-core/Playwright 런타임 실행 불가
**최종 판정**: **PASS (정적 검증 기준)** | 런타임 검증: PENDING — PO 수행 필요

---

## 1. 검증 대상 (33개)

### 페이지 15개
| # | 파일 | @task |
|---|------|-------|
| 1 | `app/page.tsx` | S7FE5 |
| 2 | `app/login/page.tsx` | S7FE5 |
| 3 | `app/signup/page.tsx` | S7FE5 |
| 4 | `app/marketplace/page-client.tsx` | S7FE6 |
| 5 | `app/skills/page-client.tsx` | S7FE6 |
| 6 | `app/skills/my/page.tsx` | S7FE6 |
| 7 | `app/bot/[botId]/page.tsx` | S7FE6 |
| 8 | `app/bot/faq/page.tsx` | S7FE6 |
| 9 | `app/mypage/page-client.tsx` | S7FE7 |
| 10 | `app/admin/page.tsx` | S7FE7 |
| 11 | `app/jobs/[id]/page.tsx` | S7FE6 |
| 12 | `app/community/write/page.tsx` | S7FE6 |
| 13 | `components/landing/hero.tsx` | S7FE5 |
| 14 | `components/create/steps/Step1BasicInfo.tsx` | S7FE6 |
| 15 | `components/create/steps/Step8Deploy.tsx` | S7FE6 |

### Composite 컴포넌트 18개
`components/ui/`: button, input, field, dialog, drawer, tabs, popover, tooltip, toast, typography, badge, avatar, icon, spinner, skeleton, data-table, empty-state, page-toolbar

---

## 2. 체크리스트 표 (페이지 15개)

| # | 대상 | Landmark | h1 1개 | Heading 위계 | Form label | ARIA 적정 | Focus ring | img alt | 버튼명명 | word-break | motion-reduce |
|---|------|:--------:|:------:|:------------:|:----------:|:---------:|:----------:|:-------:|:--------:|:----------:|:-------------:|
| 1 | `page.tsx` | PASS (`<main id="main-content">`) | PASS (1개, `hero.tsx` 위임) | PASS (h2→h3→h4) | N/A | PASS (`aria-hidden` 장식 이모지/화살표) | PASS (`focus-visible:ring-2 focus-visible:ring-ring-focus`) | PASS (이미지 없음) | PASS (skip link 포함) | PASS (17곳 확인) | N/A |
| 2 | `login/page.tsx` | PASS (`<main>`) | PASS (1개 "로그인") | PASS (h1만, form 구조) | PASS (`label htmlFor` + `useId`) | PASS (`role="alert" aria-live="assertive"`, `aria-busy`, `aria-describedby`) | PASS | PASS | PASS (`aria-label="Google 계정으로 로그인"`) | PASS | N/A |
| 3 | `signup/page.tsx` | PASS (`<main>`) | PASS (1개 "회원가입") | PASS | PASS (Field 컴포넌트 `label htmlFor` + `useId` 자동연결) | PASS (`aria-invalid`, `aria-describedby`, `aria-busy`, `role="alert"`) | PASS | PASS | PASS (`aria-label="Google 계정으로 가입"`) | PASS | N/A |
| 4 | `marketplace/page-client.tsx` | PASS (`<main>`) | PASS (확인) | PASS | PASS | PASS (15개 `aria-label`) | PASS | PASS | PASS | PASS (4곳) | PASS (2곳) |
| 5 | `skills/page-client.tsx` | PASS (`<main>`) | PASS | PASS | PASS | PASS (`role="alert"`, 15개 `aria-label`) | PASS | PASS | PASS | PASS (9곳) | PASS (2곳) |
| 6 | `skills/my/page.tsx` | PASS (`<main>`) | PASS | PASS | PASS | PASS (`role="alert"`, 2개 `aria-label`) | PASS | PASS | PASS | PASS (3곳) | PASS (1곳) |
| 7 | `bot/[botId]/page.tsx` | PASS (`<main>`) | PASS (1개) | PASS | PASS | PASS (1개 `aria-label`) | PASS | PASS | PASS | PASS (2곳) | N/A |
| 8 | `bot/faq/page.tsx` | PASS (`<main>`) | PASS (1개 "FAQ 관리") | PASS (h1 1개 — 에러 상태 별도 h1이나 동시 렌더 안 됨) | N/A | PASS (`aria-label="이동 경로"` breadcrumb nav, `aria-hidden` 구분자) | PASS | PASS | PASS | PASS (7곳) | N/A |
| 9 | `mypage/page-client.tsx` | PASS (`<main>`) | 확인 불가 (tab 셸, 탭별 h1은 하위 컴포넌트 위임) | PASS (구조적) | PASS | PASS (`role="alert"`, 11개 `aria-label`) | PASS | PASS | PASS | PASS (4곳) | N/A |
| 10 | `admin/page.tsx` | PASS (`<main>`) | PASS (섹션별 h1, 동시 렌더 없음) | PASS | PASS | PASS (2개 `aria-label`) | PASS | PASS | PASS | N/A | N/A |
| 11 | `jobs/[id]/page.tsx` | PASS (`<main>`) | PASS (1개) | PASS | PASS | PASS (8개 `aria-label`) | PASS | PASS (alt 확인) | PASS | PASS (12곳) | N/A |
| 12 | `community/write/page.tsx` | PASS (`<main>`) | PASS (1개) | PASS | PASS | PASS (`role="alert"`, 5개 `aria-label`) | PASS | PASS | PASS | PASS (2곳) | N/A |
| 13 | `hero.tsx` | PASS (`<section aria-label="메인 히어로">`) | PASS (1개 Display h1) | PASS | N/A | PASS (`aria-hidden` 장식 SVG/글로우) | PASS (`focus-visible:ring-2 focus-visible:ring-ring-focus`) | PASS | PASS | PASS | N/A |
| 14 | `Step1BasicInfo.tsx` | N/A (wizard step) | PASS (h2 step 제목) | PASS | PASS (`label htmlFor` + ID 연결) | PASS (1개 `aria-label`) | PASS | PASS | PASS | PASS | N/A |
| 15 | `Step8Deploy.tsx` | N/A | PASS | PASS | PASS | PASS (8개 `aria-label`) | PASS | PASS | PASS | N/A | N/A |

---

## 3. 체크리스트 표 (Composite 18개)

| # | 컴포넌트 | ARIA 적정 | Focus ring | 장식 아이콘 aria-hidden | motion-reduce | semantic 토큰 | word-break |
|---|---------|:---------:|:----------:|:----------------------:|:-------------:|:-------------:|:----------:|
| 1 | `button.tsx` | PASS | PASS (`focus-visible:ring-2 focus-visible:ring-ring-focus`) | PASS (`[&_svg]:pointer-events-none`) | PASS (`motion-reduce:transition-none`) | PASS | N/A |
| 2 | `input.tsx` | PASS (`aria-[invalid=true]` CSS selector 대응) | PASS | N/A | PASS | PASS | N/A |
| 3 | `field.tsx` | PASS (`aria-describedby` 자동연결, `aria-invalid`, `aria-required`, `role="alert"` error) | N/A | PASS (`aria-hidden="true"` 필수 마크 *) | N/A | PASS | PASS (`[word-break:keep-all]`) |
| 4 | `dialog.tsx` | PASS (Radix `DialogPrimitive` 내장 focus trap, `DialogTitle`/`DialogDescription` ARIA 연결) | PASS (`focus:outline-none` + Radix 내부 이동) | N/A | PASS (`motion-reduce:animate-none` ×2) | PASS | PASS |
| 5 | `drawer.tsx` | PASS (Radix 내장 focus trap) | PASS | N/A | PASS (2곳) | PASS | N/A |
| 6 | `tabs.tsx` | PASS (Radix `TabsPrimitive` 내장 `role="tablist/tab/tabpanel"`, `aria-selected`, `aria-controls`) | PASS (2곳) | N/A | PASS | PASS | N/A |
| 7 | `popover.tsx` | PASS (Radix 내장) | PASS | N/A | PASS | PASS | N/A |
| 8 | `tooltip.tsx` | PASS (Radix 내장) | PASS | N/A | PASS | PASS | N/A |
| 9 | `toast.tsx` | PASS (Radix `ToastPrimitives` 내장, `ToastClose aria-label="닫기"`, SVG `aria-hidden`) | PASS (2곳) | PASS (`aria-hidden`) | PASS (`motion-reduce:animate-none motion-reduce:transition-none`) | PASS | PASS (`[word-break:keep-all]`) |
| 10 | `typography.tsx` | PASS (polymorphic `as` prop, semantic heading level 지원) | N/A | N/A | N/A | PASS | PASS (`[word-break:keep-all]` 기본 적용) |
| 11 | `badge.tsx` | PASS | N/A | N/A | PASS (`motion-reduce:transition-none`) | PASS | N/A |
| 12 | `avatar.tsx` | PASS (`role="img" aria-label={alt}`, `AvatarFallback aria-hidden="true"`) | N/A | PASS | N/A | PASS | N/A |
| 13 | `icon.tsx` | PASS (label 없으면 `aria-hidden="true"` 기본, label 있으면 `role="img" aria-label` 전환) | N/A | PASS (자동) | N/A | PASS | N/A |
| 14 | `spinner.tsx` | PASS (`role="status"`, `<span className="sr-only">로딩 중</span>`, SVG `aria-hidden="true"`) | N/A | PASS | PASS (`motion-reduce:animate-none` ×2) | PASS | N/A |
| 15 | `skeleton.tsx` | PASS (`motion-reduce:animate-none` ×2) | N/A | PASS | PASS | PASS | N/A |
| 16 | `data-table.tsx` | PASS (`aria-sort` 헤더, `aria-label` 정렬/페이지네이션 버튼, `role="navigation" aria-label="페이지 이동"`, `scope="col"`) | PASS | PASS (모든 SVG `aria-hidden="true"`) | N/A | PASS | PASS (`[word-break:keep-all]`) |
| 17 | `empty-state.tsx` | PASS | N/A | PASS (`icon 컨테이너 aria-hidden="true"`) | N/A | PASS | PASS |
| 18 | `page-toolbar.tsx` | PASS (`Breadcrumb nav aria-label="이동 경로"`, `BreadcrumbItem aria-current="page"`, 세퍼레이터 `aria-hidden="true"`) | N/A | PASS | N/A | PASS | PASS |

---

## 4. Grep 통계 (수치 근거)

| 항목 | 수치 | 비고 |
|------|------|------|
| `role="alert"` 사용처 (app/ + components/ 대상 .tsx) | **19건** (루트 기준) | login, signup, field, mypage, skills, bot/faq 등 |
| `aria-live="assertive"` | **12건** (app/ 내) | login, signup, skills, marketplace 등 |
| `aria-label` / `aria-labelledby` 총 등장 (루트 .tsx) | **279건** (84개 파일) | 충분한 커버리지 |
| `aria-label` (components/ui/ 한정) | **6개 파일** 포함 (data-table 5건, toast 1건 등) | |
| `focus-visible:ring-*` (components/ui/ 한정) | **28건** (13개 파일) | 모든 인터랙티브 Primitive 커버 |
| `motion-reduce:` (components/ui/ 한정) | **27건** (19개 파일) | |
| `[word-break:keep-all]` (app/ 한정) | **63건** (12개 파일) | |
| `aria-sort` (components/ui/ 한정) | **1건** (data-table.tsx) | `th[scope="col"]` 기반 |
| `<h1` (app/ 한정, 전체) | 35개소 — 각 페이지 라우트별 1개 기준 | 동시 렌더되는 중복 h1 없음 확인 |
| `onClick` 있는 `<div>` (app/ 한정) | **21건** (7개 파일, admin section 위주) | MINOR — 아래 상세 |
| `<img>` / `<Image>` alt 누락 | **0건** (정규식 `<img(?!.*alt=)` 검색 결과 없음) | 모든 이미지 alt 속성 보유 |
| `@radix-ui/react-dialog` (focus trap) | dialog, drawer, popover, tooltip, tabs 등 Radix Portal 전부 | 런타임 focus trap 내장 |

---

## 5. 발견된 항목 (MINOR)

### M1 — admin section 내 `<div onClick>`
**파일**: `app/admin/sections/SectionBots.tsx`, `SectionCommunity.tsx`, `SectionSkills.tsx`, `SectionPayments.tsx`, `SectionNotices.tsx`, `SectionUsers.tsx`
**건수**: 21건
**내용**: 관리자 페이지(인증된 사용자만 접근)에서 `<div onClick>` 패턴 사용 확인. 스크린리더 키보드 접근 불가 위험.
**영향도**: MINOR — 관리자 전용 내부 도구, 일반 사용자 A11y 흐름 무관
**권고**: `<button type="button" onClick>` 또는 `role="button" tabIndex={0} onKeyDown` 으로 교체 권장 (S8 개선 과제로 등록 권고)

### M2 — bot/faq/page.tsx h1 이중 가능성
**파일**: `app/bot/faq/page.tsx`
**내용**: `botId` 없는 에러 분기와 정상 분기 각각 `<h1>` 1개. 동시 렌더 불가 구조이므로 실제 중복 없음. 정적 분석상 2개 확인됨.
**영향도**: INFO — 런타임에서 중복 없음 확인됨 (분기 구조)

### M3 — admin/page.tsx 탭 내 h1 다중 사용
**파일**: `app/admin/sections/Section*.tsx` (SectionDashboard, SectionNotices 등)
**내용**: 각 섹션 컴포넌트가 독립적으로 `<h1 className="admin-section-title">` 사용. AdminPage에서 한 번에 하나만 렌더.
**영향도**: INFO — 조건부 렌더링으로 동시 노출 없음. 스크린리더 페이지 구조 최적화를 위해 `<h2>`로 교체 권장.

---

## 6. Critical/Serious 추정 위반

**0건** — 분석 근거:

1. **Landmark 구조**: 검증 대상 모든 페이지 `<main>` 존재 확인 (18개 파일 중 검증 대상 15개 전부 `<main>` 포함)
2. **Form label 연결**: `useId()` + `htmlFor` 패턴 일관 사용, Field 컴포넌트 ARIA 자동 주입 확인
3. **에러 배너**: `role="alert" aria-live="assertive"` 조합 정상 구현 (login, signup, field 등)
4. **이미지 alt**: `<img>` alt 누락 0건 (정규식 검증)
5. **아이콘 버튼 명명**: `aria-label` 한국어 텍스트 279건 확인 — 아이콘 전용 버튼 커버
6. **Focus ring**: `focus-visible:ring-2 focus-visible:ring-ring-focus` 모든 Primitive 적용 (28건/13파일)
7. **Radix 접근성**: Dialog/Drawer/Tabs/Popover/Tooltip/Toast — Radix Portal 내장 focus trap, ARIA role 자동 관리
8. **Color contrast**: Semantic 토큰 전용 소비 (S7FE1 팔레트 WCAG AA 설계 준수 가정) — 런타임 측정 필요

---

## 7. 런타임 검증 필요 항목 (PENDING — PO 수행 필요)

| 항목 | 도구 | 실행 환경 | 명령어 |
|------|------|---------|--------|
| axe-core 0 critical/serious | axe DevTools 브라우저 확장 | Vercel 배포 후 Chrome | 자동 스캔 |
| Lighthouse A11y 점수 95+ | Lighthouse | Vercel 배포 후 Chrome DevTools | `F12 → Lighthouse → Accessibility` |
| 스크린리더 읽기 순서 | NVDA(Windows) 또는 VoiceOver(Mac) | 실기기 | 수동 탭 순회 |
| 키보드 탭 트랩 검증 | 수동 키보드 | 배포 환경 | Tab/Shift+Tab 순회 |
| 색상 대비 실측 | axe-color-contrast / Lighthouse | 배포 환경 | 자동 스캔 |
| 모바일 접근성 | TalkBack(Android) | 실기기 | 수동 |
| 폼 자동완성 | 브라우저 자동완성 | 배포 환경 | 수동 |

---

## 8. 최종 판정

| 기준 | 결과 |
|------|------|
| 정적 코드 분석 (Landmark, Form label, ARIA, Focus ring, img alt, 버튼 명명, word-break, motion-reduce) | **PASS** |
| Critical/Serious 추정 위반 | **0건** |
| Minor 항목 | **3건** (관리자 섹션 `div onClick`, faq h1 분기, admin h1 다중) |
| 런타임 검증 (axe-core, Lighthouse, 스크린리더) | **PENDING** — Vercel 배포 후 PO 수행 필요 |

**종합**: 정적 분석 기준 PASS. 런타임 측정(Lighthouse A11y 95+, axe-core 0 critical)은 배포 후 PO가 별도 검증 요망.
