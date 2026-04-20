# S7DS1: MCW 현행 디자인 AS-IS 진단 리포트

> 작성일: 2026-04-20
> 작성자: 디자인 진단 전문가 (AI Agent)
> 베이스라인: S7 전 Task의 기준점. 이 리포트가 미정의한 영역을 S7에서 해결한다.

---

## 1. Executive Summary

### 종합 점수: **58 / 100**

| 축 | 점수 | 비고 |
|----|-----:|------|
| 토큰/파운데이션 | 75 | globals.css 설계는 우수, CSS 파일 이중 구조가 걸림돌 |
| 컴포넌트 커버리지 | 35 | shadcn/ui 거의 미도입, UI 원시 컴포넌트 1개(theme-toggle) |
| 하드코딩 색상 일관성 | 40 | CSS 파일군 922건 + TSX 250건 이상 하드코딩 존재 |
| 접근성 | 55 | aria 163건 있으나 focus-visible 62건으로 범위 부족 |
| 타이포/간격 일관성 | 55 | Tailwind 스케일 정의 우수, Create 위저드가 이탈 |
| 페이지 일관성 | 50 | 랜딩 계열 vs. 앱 계열 vs. 레거시 CSS 3중 혼재 |

### 최우선 개선 영역 Top 5

1. **Create 위저드 전면 토큰 전환** — `create/ui.tsx`·`css/create.css` 모두 CSS 변수 미사용, rgba 하드코딩 160건. 라이트 모드에서 완전 파손.
2. **레거시 CSS 파일군(css/*.css) 정리** — 13개 vanilla CSS 파일에 하드코딩 색상 922건. pages.css의 `body.page-dark`, styles.css 등 구버전 시스템과 신규 토큰 시스템이 동시 로드.
3. **컴포넌트 라이브러리 구축** — `components/ui/`에 `theme-toggle.tsx` 1개뿐. Button/Input/Card/Badge/Modal/Toast 등 기본 프리미티브 전무.
4. **jobs/hire·admin 섹션 토큰 전환** — `app/jobs/hire/page.tsx` 49건 하드코딩 (`#f8fafc`, `#e2e8f0` 등 라이트 고정값), 어드민 페이지 자체 CSS 클래스 시스템(`abadge`, `abadge--green`).
5. **인라인 스타일 남발 근절** — `components/landing/` 전체가 Tailwind 클래스 대신 `style={}` prop 사용, 유지보수성 및 다크 모드 안전성 저하.

---

## 2. 토큰/파운데이션 진단

### 2.1 globals.css 분석

**정의된 CSS 변수 목록 (전수)**

| 카테고리 | 변수 수 | 대표 변수 |
|---------|:------:|---------|
| Primary 팔레트 | 11 | `--primary-50` ~ `--primary-950` |
| Amber 팔레트 | 10 | `--amber-50` ~ `--amber-900` |
| Neutral 팔레트 | 14 | `--neutral-0` ~ `--neutral-950` |
| 폰트 | 7 | `--font-sans`, `--font-bold` 외 |
| Spacing | 18 | `--space-0` ~ `--space-32` |
| Border Radius | 9 | `--radius-none` ~ `--radius-full` |
| Transition | 3 | `--transition-fast/base/slow` |
| 레이아웃 | 3 | `--sidebar-width`, `--header-height`, `--mobile-tabbar` |
| 시맨틱 배경(다크) | 6 | `--bg-base` ~ `--bg-surface-raised` |
| 시맨틱 텍스트(다크) | 5 | `--text-primary` ~ `--text-on-accent` |
| 시맨틱 보더(다크) | 4 | `--border` ~ `--border-primary` |
| 상태 컬러(다크) | 4 | `--color-success/warning/error/info` |
| 채팅 버블 | 4 | `--chat-user-bg/text`, `--chat-bot-bg/text` |
| 그림자 | 4 | `--shadow-sm` ~ `--shadow-xl` |
| 글로우 그림자 | 2 | `--shadow-primary-glow`, `--shadow-accent-glow` |
| 그라데이션 | 6 | `--gradient-ai` ~ `--gradient-hero-light` |
| 하위 호환 alias | 14 | `--color-bg-base`, `--color-text-primary` 등 |
| **합계** | **~124** | |

**Light/Dark 모드 지원**: 완벽히 지원. `:root, .dark` (기본 다크) + `.light` 클래스 override 방식. `next-themes` `attribute="class"` 연동.

**일관성 이슈**:
- `:focus-visible` 아웃라인에 `rgb(var(--color-primary))`를 참조하는데, `--color-primary`는 `.dark`/`.light`에 없고 하위 alias(`--color-bg-base` 등)에도 해당 변수가 없어 **포커스 링이 undefined 참조** 가능성 있음. (정확히는 `--color-primary` 대신 `var(--primary-400)`/`var(--primary-500)` 직접 써야 함)
- 섹션 2(다크 기본)에 `--color-success/warning/error/info`는 정의되어 있으나 `.light` 섹션에는 별도 정의가 있음. 그러나 `--color-primary`, `--color-accent`는 `.light`에 없고 시맨틱 축 이름(`--color-primary`)은 실제로 토큰에 존재하지 않음 — `--color-primary` alias는 5번 섹션 하위 호환 블록에서 `rgb(var(--bg-base))` 형태로만 있고 정작 `--color-primary` 자체는 미정의.

### 2.2 Tailwind 설정 분석

**확장 토큰 현황** (tailwind.config.ts):

| 범주 | 확장 여부 | 품질 |
|------|:--------:|------|
| Primary 색상 (50~950) | 완전 확장 | 우수 — CSS 변수 연동 |
| Accent/Amber 색상 | 완전 확장 | 우수 |
| Neutral 색상 | 완전 확장 | 우수 |
| 시맨틱 배경(`bg.*`) | 완전 확장 | 우수 |
| 시맨틱 텍스트(`text.*`) | 완전 확장 | 우수 |
| 시맨틱 보더(`border.*`) | 완전 확장 | 우수 |
| 상태 컬러 | 완전 확장 | 우수 |
| 채팅 버블(`chat.*`) | 완전 확장 | 우수 |
| 폰트 패밀리 | 완전 확장 | 우수 |
| 타이포 스케일 | 완전 확장 (xs~7xl, lineHeight+letterSpacing) | 우수 |
| Border Radius | 완전 확장 | 우수 |
| Box Shadow (CSS 변수 연동) | 완전 확장 | 우수 |
| 배경 이미지(그라데이션) | 6종 완전 확장 | 우수 |
| 레이아웃 치수 | width/height/spacing 확장 | 우수 |
| Keyframes/Animation | 5종 정의 | 우수 |

**미정의 영역**:
- `brand.*` 색상 — 하위 호환으로 Sky Blue 팔레트가 정의됨 (`brand.500: #0ea5e9`). 현재 코드에서 사용 흔적 없어 dead code.
- `surface.*` — `bg.surface`의 중복 alias로 혼란 가능.
- shadcn/ui와의 통합이 없어 `--radius` 변수가 shadcn 기본 스펙과 다름 (shadcn은 단일 `--radius` 사용).

**평가**: Tailwind 설정 자체는 MCW 프로젝트에서 가장 잘 설계된 파일. 문제는 이 설정이 실제 코드에서 충분히 활용되지 않는다는 점.

### 2.3 DESIGN.md v1 vs 실제 사용 갭

| DESIGN.md 규정 | 실제 사용 현황 | 갭 |
|---------------|--------------|------|
| CSS 변수 의무 사용, 하드코딩 금지 | Create 위저드 전체 하드코딩 (~120건), CSS 파일군 922건 | **심각** |
| 퍼플 CTA 버튼 `--color-primary` | Create `ui.tsx`에서 `#6366f1, #8b5cf6` 하드코딩 (Indigo계열, 브랜드 색상 불일치) | **심각** |
| `--radius-lg`(12px) 버튼 | `ui.tsx`에서 `borderRadius: '10px'` 하드코딩 | Medium |
| 카드 hover `translateY(-2px)` + 퍼플 보더 | 다수 페이지에서 미구현 | Medium |
| 버튼 최소 높이 44px, 터치 48×48 | `ui.tsx`의 MicButton이 42×42px | Low |
| Pretendard 폰트 전역 | `app/jobs/hire/page.tsx`에서 `'Noto Sans KR', 'Inter'` 별도 지정 | Low |
| 다크/라이트 양쪽 테스트 | Create 위저드, jobs/hire는 라이트 모드 고려 없음 | **심각** |
| 순수 `white`/`rgba(255,255,255,0.x)` 금지 | Create 위저드 전체가 `white` 직접 사용 | 심각 |

---

## 3. 하드코딩 색상 전수조사

### 3.1 TSX/컴포넌트 파일 (실측 주요 건)

| # | 파일 | 하드코딩 위치 | 색상값 | 권장 토큰 |
|---|------|-------------|-------|---------|
| 1 | `components/create/ui.tsx:14` | `stepTitle` color | `white` | `rgb(var(--text-primary))` |
| 2 | `components/create/ui.tsx:19` | `stepDesc` color | `rgba(255,255,255,0.5)` | `rgb(var(--text-muted))` |
| 3 | `components/create/ui.tsx:27` | `formCard` background | `rgba(255,255,255,0.04)` | `rgb(var(--bg-surface))` |
| 4 | `components/create/ui.tsx:28` | `formCard` border | `rgba(255,255,255,0.08)` | `rgb(var(--border))` |
| 5 | `components/create/ui.tsx:38` | `formLabel` color | `white` | `rgb(var(--text-primary))` |
| 6 | `components/create/ui.tsx:46` | `formInput` background | `rgba(255,255,255,0.06)` | `rgb(var(--bg-surface))` |
| 7 | `components/create/ui.tsx:47` | `formInput` border | `rgba(255,255,255,0.12)` | `rgb(var(--border))` |
| 8 | `components/create/ui.tsx:50` | `formInput` color | `white` | `rgb(var(--text-primary))` |
| 9 | `components/create/ui.tsx:59` | `btnPrimary` background | `linear-gradient(135deg, #6366f1, #8b5cf6)` | `var(--gradient-primary)` |
| 10 | `components/create/ui.tsx:62` | `btnPrimary` color | `white` | `rgb(var(--text-on-primary))` |
| 11 | `components/create/ui.tsx:70` | `btnSecondary` background | `rgba(255,255,255,0.08)` | `rgb(var(--bg-surface-hover))` |
| 12 | `components/create/ui.tsx:141` | MicButton border/background | `#ef4444`, `rgba(239,68,68,0.3)` | `rgb(var(--color-error))` |
| 13 | `components/create/steps/Step2Persona.tsx:98` | span color | `white` | `rgb(var(--text-primary))` |
| 14 | `components/create/steps/Step2Persona.tsx:107` | input background | `rgba(0,0,0,0.2)` | `rgb(var(--bg-surface))` |
| 15 | `components/create/steps/Step2Persona.tsx:150` | span color | `rgba(255,255,255,0.7)` | `rgb(var(--text-secondary))` |
| 16 | `components/create/steps/Step3Interview.tsx:165` | h4 color | `white` | `rgb(var(--text-primary))` |
| 17 | `components/create/steps/Step3Interview.tsx:169` | p color | `rgba(255,255,255,0.5)` | `rgb(var(--text-muted))` |
| 18 | `components/guest/signup-prompt.tsx:208` | text color | `text-[#191919]` | `text-text-primary` (토큰) |
| 19 | `components/guest/signup-prompt.tsx:212` | backgroundColor | `#FEE500` | 카카오 색상 — 외부 브랜드, 유지 가능 |
| 20 | `components/birth/share-buttons.tsx:161` | background | `bg-[#FEE500]` | 카카오 — 외부 브랜드 |
| 21 | `components/birth/share-buttons.tsx:162` | hover | `hover:bg-[#F5DC00]` | 카카오 — 외부 브랜드 |
| 22 | `components/landing/footer.tsx:45` | color | `rgb(255 255 255 / 0.6)` | `rgb(var(--text-secondary))` |
| 23 | `components/landing/hero.tsx:118` | background | `rgb(16 185 129)` | `rgb(var(--color-success))` |
| 24 | `app/jobs/search/page-client.tsx:330` | background | `bg-[#0f0c29]` | `bg-bg-base` |
| 25 | `app/marketplace/page-client.tsx:536` | text-[#fca5a5] | `#fca5a5` | `text-error` |
| 26 | `app/guest/page.tsx:28` | color | `#64748b` | `rgb(var(--text-secondary))` |
| 27 | `app/page.tsx:170` | background | `linear-gradient(135deg, rgb(var(--primary-900)), rgb(30 27 75))` | `var(--gradient-ai)` |
| 28 | `app/page.tsx:185` | background/border | `rgb(255 255 255 / 0.08)` | `rgb(var(--bg-surface))` |
| 29 | `app/page.tsx:216` | background | `linear-gradient(135deg, rgb(16 185 129), rgb(5 150 105))` | 토큰 없음 — 신규 토큰 필요 |
| 30 | `app/page.tsx:286` | background | `rgb(16 185 129)` | `rgb(var(--color-success))` |
| 31 | `app/jobs/hire/page.tsx:208` | background | `#f8fafc` | `rgb(var(--bg-base))` |
| 32 | `app/jobs/hire/page.tsx:211` | background | `#fff` | `rgb(var(--bg-surface))` |
| 33 | `app/jobs/hire/page.tsx:213` | color | `#1e293b` | `rgb(var(--text-primary))` |
| 34 | `app/jobs/hire/page.tsx:316` | button background | `#6366f1` / `#a5b4fc` | `rgb(var(--color-primary))` |
| 35 | `app/jobs/hire/page.tsx:307` | link color | `#6366f1` | `rgb(var(--color-primary))` |

### 3.2 CSS 파일군 하드코딩 (총계)

| CSS 파일 | 하드코딩 색상 건수 |
|---------|:---------------:|
| `css/create.css` | 160 |
| `css/chat.css` | 137 |
| `css/community.css` | 122 |
| `css/home.css` | 100 |
| `css/job-detail.css` | 64 |
| `css/jobs.css` | 56 |
| `css/landing.css` | 50 |
| `css/learning.css` | 51 |
| `css/skills.css` | 93 |
| `css/styles.css` | 59 |
| `css/pages.css` | 16 |
| `css/birth.css` | 12 |
| `css/chat-mobile.css` | 2 |
| **합계** | **922** |

**총 하드코딩 건수**: TSX/앱 파일 ~250건 + CSS 파일군 922건 = **약 1,172건**

**Light/Dark 대칭 깨짐 건수**: CSS 파일군 대부분이 다크 전용 값(`rgba(255,255,255,0.x)`, `#0f0c29` 등)만 정의하고 라이트 대응 없음. **대칭 깨짐 추정 700건 이상**.

**주목할 색상 충돌**: `components/create/ui.tsx`의 Primary 버튼이 `#6366f1`(Indigo)를 사용하여 브랜드 퍼플(`#5E4BFF`)과 시각적으로 유사하나 엄연히 다른 색상. 브랜드 일관성 훼손.

---

## 4. 컴포넌트 커버리지 매트릭스

| 컴포넌트 | 존재 | 변형(variants) | 상태(hover/focus/disabled) | 평가 |
|---------|:----:|:-------------:|:------------------------:|------|
| **Button (Primary)** | 부분 — 각 파일에 산재 | 없음 (공통 컴포넌트 없음) | 일부 있음 | 미흡 |
| **Button (Secondary/Ghost)** | 부분 — `create/ui.tsx` | 없음 | 부분 | 미흡 |
| **Input** | 부분 — `create/ui.tsx` 인라인 | 없음 | focus 없음 | 미흡 |
| **Card** | 없음 (공통 컴포넌트) | N/A | N/A | 부재 |
| **Badge/Chip** | CSS 클래스로 존재 (`abadge`) | green/red/muted | 없음 | 부재(React 컴포넌트) |
| **Modal/Dialog** | 없음 | N/A | N/A | 부재 |
| **Toast/Notification** | 없음 | N/A | N/A | 부재 |
| **Dropdown/Select** | CSS 일부 | 없음 | 없음 | 미흡 |
| **Skeleton/Loading** | CSS `.shimmer` 유틸 존재 | 없음 | N/A | 기초 수준 |
| **Avatar** | 없음 (공통) | N/A | N/A | 부재 |
| **Tabs** | 각 페이지별 자체 구현 | 없음 | 부분 | 미흡 |
| **Progress Bar** | `CreateWizard` 내 인라인 | 없음 | N/A | 미흡 |
| **Pagination** | 없음 | N/A | N/A | 부재 |
| **Search Input** | 각 페이지별 자체 구현 | 없음 | 부분 | 미흡 |
| **Theme Toggle** | `components/ui/theme-toggle.tsx` | 있음 | focus-visible 있음 | 양호 |
| **Navbar** | `components/common/navbar.tsx` | — | hover 있음 | 양호 |
| **Sidebar** | `components/common/sidebar.tsx` | — | hover 있음 | 양호 |
| **Mobile Tab Bar** | `components/common/mobile-tab-bar.tsx` | — | focus-visible | 양호 |
| **FAQManager** | `components/bot/faq-manager.tsx` | — | 있음 | 양호 |
| **KB Manager** | `components/home/kb-manager.tsx` | — | 있음 | 양호 |
| **Chat Window** | `components/bot/chat-window.tsx` | — | 있음 | 양호 |
| **Create Wizard** | `components/create/CreateWizard.tsx` | — | 있음 | 부분(토큰 미사용) |

**공통 UI 프리미티브 (`components/ui/`) 현황**: `theme-toggle.tsx` 1개만 존재. shadcn/ui, Radix UI 등 미도입.

---

## 5. 접근성 현황

### 5.1 ARIA 사용 빈도

- **총 aria-* 사용 건수**: 163건 (32개 파일)
- **주요 사용 위치**: `create/wizard-steps.tsx` (27건), `create/voice-recorder.tsx` (16건), `learning/grade-result.tsx` (9건), `signup-prompt.tsx` (11건)
- **미흡 위치**: `components/common/sidebar.tsx` (2건), `components/home/settings-panel.tsx` (1건), `components/home/kb-manager.tsx` (1건)

### 5.2 focus-visible 커버리지

- **총 focus-visible 건수**: 62건 (23개 파일)
- **글로벌 기본값**: `globals.css`에 `:focus-visible` 전역 정의 존재 (2px solid, outline-offset 2px)
- **문제점**: 글로벌 설정이 있으나 `outline: none` 재정의 컴포넌트가 다수 (`create/ui.tsx`의 `formInput`에 `outline: 'none'` 하드코딩으로 글로벌 포커스 링 제거)

### 5.3 키보드 내비게이션 취약 지점

1. **Create 위저드 Step 1~8**: 모든 스텝의 인풋에 `outline: 'none'` — 키보드 사용자 포커스 불가시.
2. **jobs/hire/page.tsx**: 인라인 스타일 폼 — focus 스타일 미정의.
3. **어드민 대시보드**: 섹션 전환 탭이 키보드 접근성 없음.
4. **Admin SectionBots**: `abadge` CSS 클래스는 인터랙티브 요소 아님이나, 상태 변경 버튼에 focus 스타일 미확인.
5. **모바일 탭바**: `focus-visible` 1건 — 전체 4탭에 충분하지 않을 수 있음.

### 5.4 색상 대비

- 다크 모드 기준 `--text-muted` (`#64748B`)를 `--bg-base` (`#0F172A`) 위에 사용 시 대비율 **약 3.8:1** — AA 기준(4.5:1) 미달.
- Create 위저드의 `rgba(255,255,255,0.5)` 텍스트를 불투명 배경 위에서 사용 시 대비율 **약 3.0:1** — AA 미달.

---

## 6. 페이지별 Nielsen 평가 (0~5점)

> 평가 기준: 일관성(디자인 시스템 준수), 위계(정보 구조), 피드백(사용자 액션 응답), 접근성(ARIA/포커스/색상대비), 미학(비주얼 퀄리티)

| 페이지 | 일관성 | 위계 | 피드백 | 접근성 | 미학 | 합계/25 |
|--------|:-----:|:----:|:------:|:-----:|:----:|:-------:|
| Landing (`/`) | 3 | 4 | 3 | 3 | 4 | **17** |
| Home (`/home`) | 3 | 3 | 3 | 2 | 3 | **14** |
| Login (`/login`) | 2 | 3 | 3 | 3 | 3 | **14** |
| Signup (`/signup`) | 2 | 3 | 2 | 2 | 3 | **12** |
| Marketplace (`/marketplace`) | 3 | 3 | 2 | 2 | 3 | **13** |
| Skills (`/skills`) | 3 | 3 | 2 | 2 | 3 | **13** |
| Create (`/create`) | 1 | 3 | 2 | 1 | 2 | **9** |
| Bot Detail (`/bot/[id]`) | 3 | 3 | 3 | 2 | 3 | **14** |
| MyPage (`/mypage`) | 3 | 3 | 3 | 2 | 3 | **14** |
| Admin (`/admin`) | 2 | 3 | 2 | 2 | 2 | **11** |
| Jobs (`/jobs`) | 2 | 3 | 2 | 2 | 3 | **12** |
| Community (`/community`) | 2 | 3 | 2 | 2 | 3 | **12** |
| Guest (`/guest`) | 2 | 3 | 3 | 2 | 3 | **13** |
| Birth (`/birth`) | 3 | 3 | 3 | 3 | 4 | **16** |
| **평균** | **2.5** | **3.1** | **2.5** | **2.1** | **3.0** | **12.4** |

**최저 점수**: Create (`/create`) — 9/25. Create 위저드 전체가 토큰 시스템 이탈.
**최고 점수**: Landing (`/`) — 17/25. 랜딩은 새 디자인 시스템을 일부 적용.

---

## 7. 문제점 목록 (영향도 표시)

| # | 영역 | 문제 | 영향도 | 권장 해결 방향 |
|---|------|------|:-----:|---------------|
| 1 | Create 위저드 | `create/ui.tsx` 전체가 인라인 스타일 + rgba 하드코딩 — CSS 변수 미사용 | High | 토큰 기반 Tailwind 클래스로 전면 재작성 |
| 2 | Create 위저드 | 브랜드 Primary 컬러로 Indigo(`#6366f1`) 사용, 실제 퍼플(`#5E4BFF`)과 다름 | High | `var(--gradient-primary)` 또는 `rgb(var(--color-primary))` 사용 |
| 3 | Create 위저드 | `formInput`에 `outline: 'none'` — 키보드 포커스 완전 차단 | High | focus-visible 스타일 복원 |
| 4 | CSS 파일군 | `css/create.css` 160건 하드코딩 — CSS 변수 0% | High | CSS 변수 전환 또는 컴포넌트 내부 Tailwind로 마이그레이션 |
| 5 | CSS 파일군 | `css/pages.css`의 `body.page-dark` 클래스 — 구버전 다크 시스템(`#0f0c29`) | High | 삭제 또는 토큰 참조로 교체 |
| 6 | Jobs | `app/jobs/search/page-client.tsx:330` — `bg-[#0f0c29]` 라이트 모드 파손 | High | `bg-bg-base` 토큰 클래스 사용 |
| 7 | Jobs | `app/jobs/hire/page.tsx` — 전체가 인라인 스타일, 49건 하드코딩, 라이트 고정값 | High | 토큰 기반 Tailwind 클래스 적용 |
| 8 | 컴포넌트 라이브러리 | `components/ui/`에 Button/Input/Card/Badge/Modal 부재 | High | shadcn/ui 도입 또는 자체 프리미티브 구축 |
| 9 | 접근성 | 다크 모드 `--text-muted` 색상 대비율 3.8:1 — WCAG AA(4.5:1) 미달 | High | `--text-muted`를 `neutral-400`보다 밝은 값으로 조정 |
| 10 | 접근성 | Create 위저드 `rgba(255,255,255,0.5)` 텍스트 — 대비율 3.0:1 미달 | High | `--text-secondary` 토큰 사용 |
| 11 | Admin | `abadge--green/red/muted` 자체 CSS 클래스 — 토큰 시스템 외부 | Med | 토큰 기반 Badge 컴포넌트로 통합 |
| 12 | Admin | 어드민 섹션 전환 탭에 ARIA role/aria-current 없음 | Med | `role="tab"`, `aria-selected`, `aria-current="page"` 추가 |
| 13 | Landing | `components/landing/` 전체가 Tailwind 클래스 대신 `style={}` prop 사용 | Med | Tailwind 클래스 마이그레이션 |
| 14 | Landing | `app/page.tsx`의 그린 섹션 배경 `linear-gradient(135deg, rgb(16 185 129), ...)` — 토큰 없음 | Med | `--gradient-success` 등 신규 토큰 추가 |
| 15 | CSS 파일군 | `css/home.css` 100건 하드코딩 — CSS 변수 54건과 혼재 | Med | 하드코딩 제거, 변수 통일 |
| 16 | CSS 파일군 | `css/chat.css` 137건 하드코딩 — 가장 많은 곳 중 하나 | Med | 채팅 버블 토큰(`--chat-user-bg` 등) 활용 |
| 17 | 타이포 | Hero 텍스트 반응형 처리 불일치 — 일부는 `text-5xl md:text-7xl`, 일부는 `text-[48px]` | Med | Tailwind 스케일 표준화 |
| 18 | 간격 | Create 위저드 내부 spacing이 `rem` 값 직접 사용 — 8pt 그리드 추적 불가 | Med | `--space-*` 변수 또는 Tailwind spacing 클래스 사용 |
| 19 | 폰트 | `app/jobs/hire/page.tsx` 폰트 스택 `'Noto Sans KR', 'Inter'` 별도 지정 — Pretendard 이탈 | Med | CSS 변수 `--font-sans` 사용 |
| 20 | 컴포넌트 | Modal/Toast 없음 — 브라우저 기본 `alert()` 사용 추정 (create ui.tsx 142줄) | Med | 공통 Modal, Toast 컴포넌트 구축 필요 |
| 21 | 토큰 | `:focus-visible` 아웃라인에서 `rgb(var(--color-primary))` 참조 — `--color-primary` 실제 미정의 | Med | `rgb(var(--primary-400))` 또는 `rgb(var(--primary-500))`으로 직접 참조 |
| 22 | 토큰 | `brand.*` 색상 (Sky Blue) — 사용 안 됨, dead code | Low | tailwind.config에서 제거 |
| 23 | 토큰 | `surface.*` — `bg.surface`의 중복 alias | Low | 하나로 통합 |
| 24 | 컴포넌트 | Pagination 컴포넌트 없음 — 마켓플레이스, 커뮤니티 목록에서 필요 | Med | 공통 Pagination 구축 |
| 25 | 컴포넌트 | Skeleton/Loading 상태 — `shimmer` CSS 유틸 있으나 Skeleton 래퍼 컴포넌트 없음 | Med | Skeleton 컴포넌트 구축 |
| 26 | 반응형 | 모달 → 바텀시트 전환 기획만 있고 미구현 | Med | 모바일 BottomSheet 컴포넌트 필요 |
| 27 | 접근성 | 모바일 탭바 4개 탭에 `focus-visible` 1건만 — 나머지 3탭 미적용 가능성 | Med | 모든 탭에 `focus-visible:ring-2` 적용 |
| 28 | 상태 | 전반적 empty state 디자인 없음 — 마켓플레이스·구봇구직 결과 없을 때 처리 부재 | Med | Empty State 컴포넌트/디자인 정의 |
| 29 | 상태 | Error boundary/전역 에러 페이지 (`app/global-error.tsx` 있으나 미스타일링 가능성) | Low | 에러 페이지 디자인 시스템 적용 |
| 30 | 접근성 | Community, Skills, Jobs 페이지 ARIA landmark 사용 부족 | Med | `<main>`, `<nav>`, `<section aria-label>` 구조 강화 |
| 31 | 일관성 | 랜딩 마케팅 GNB(marketing-gnb.tsx)와 앱 Navbar(navbar.tsx) 별도 컴포넌트 — 기능 중복 | Low | 통합 Navbar 컴포넌트 또는 명확한 분리 문서화 |
| 32 | CSS | `css/styles.css`의 `--gradient-hero` — `#0f0c29, #302b63, #24243e` 하드코딩, 구버전 그라데이션 | Med | globals.css의 `--gradient-hero-dark` 토큰으로 대체 |
| 33 | 접근성 | `app/login/page.tsx`의 카카오 버튼 `focus:ring-[#FEE500]` — 다크 배경에서 대비율 확인 필요 | Low | 포커스 링 대비율 검증 |
| 34 | 타이포 | 어드민 페이지 폰트 스케일 비표준 — DESIGN.md 타이포 계층 미적용 | Low | Tailwind 타이포 클래스 표준화 |
| 35 | 일관성 | `css/learning.css`, `css/birth.css` — React 컴포넌트화되었음에도 vanilla CSS 유지 | Med | CSS-in-Tailwind 마이그레이션 또는 모듈화 |

---

## 8. 경쟁 벤치마크 갭 스코어 (개략)

> 각 사이트 현황 기반 추정값. MCW 점수는 본 진단 결과 기준.

| 차원 | MCW | Linear | Vercel | Stripe | Arc | Raycast | MCW 갭 |
|------|----:|-------:|-------:|-------:|----:|--------:|:------:|
| 토큰 시스템 완성도 | 60 | 95 | 95 | 90 | 90 | 88 | -30 |
| 컴포넌트 일관성 | 35 | 95 | 92 | 90 | 85 | 90 | -55 |
| 다크/라이트 지원 | 55 | 95 | 95 | 80 | 95 | 90 | -35 |
| 타이포그래피 위계 | 65 | 90 | 88 | 90 | 85 | 88 | -23 |
| 접근성(WCAG AA) | 45 | 80 | 85 | 90 | 75 | 78 | -33 |
| 마이크로 인터랙션 | 50 | 88 | 82 | 85 | 90 | 88 | -35 |
| 모바일 반응형 | 60 | 90 | 88 | 85 | 88 | 82 | -25 |
| **종합** | **53** | **91** | **89** | **87** | **87** | **87** | **-35** |

**핵심 갭 요인**: Linear/Vercel 대비 컴포넌트 라이브러리 부재(-55p), Stripe 대비 접근성(-45p)이 가장 큰 격차.

---

## 9. 개선 로드맵 Quick Reference

### P0 (즉시 — S7 우선 해결)
- `components/ui/` Button, Input, Card, Badge 프리미티브 구축
- `create/ui.tsx` 토큰 전환 (rgba 하드코딩 → CSS 변수)
- `app/jobs/search/page-client.tsx` `bg-[#0f0c29]` → `bg-bg-base` 단일 수정
- `:focus-visible` 글로벌 정의의 `--color-primary` 참조 오류 수정
- Create 위저드 `outline: 'none'` 제거 → 포커스 링 복원

### P1 (단기 — S7 내 완료 목표)
- `app/jobs/hire/page.tsx` 전면 토큰 전환
- `css/create.css`, `css/chat.css`, `css/home.css` 하드코딩 제거 (3대 최다 파일)
- `css/pages.css` `body.page-dark` 구버전 시스템 제거
- Modal/Toast 공통 컴포넌트 구축
- Admin 섹션 ARIA 개선
- `--text-muted` 색상 대비율 AA 충족 조정

### P2 (중장기 — S7 이후)
- shadcn/ui 도입 또는 자체 컴포넌트 라이브러리 정식 구축
- 나머지 CSS 파일군 전체 토큰 마이그레이션 (community/jobs/skills/learning)
- Skeleton/Pagination/BottomSheet/EmptyState 컴포넌트 추가
- WCAG AA 전수 대비율 검증 자동화
- Storybook 컴포넌트 카탈로그 구축

---

## 10. 부록 — 조사 근거 데이터

### 10.1 Grep 결과 원시 집계

| 검색 패턴 | 경로 | 결과 수 |
|---------|------|:------:|
| `bg-\[#...\]\|text-\[#...\]\|border-\[#...\]` | `app/` | 3건 |
| `bg-\[#...\]\|text-\[#...\]\|border-\[#...\]` | `components/` | 4건 |
| `style=\{.*color.*\}\|style=\{.*background.*\}` | `components/` | 76건 |
| `style=\{.*color.*\}\|style=\{.*background.*\}` | `app/` | 58건 |
| `rgba?\(255,255,255\|rgba?\(0,0,0\|#[0-9a-fA-F]{6}` | `components/create/` | 120건 |
| `rgba?\(255,255,255\|rgba?\(0,0,0\|#[0-9a-fA-F]{6}` | `app/` (tsx) | 414건 발견 (주석·SVG·테이블 포함) |
| `#[0-9a-fA-F]{6}\|rgba?\(` | `css/` | **922건** |
| `var\(--` | `css/` | 1,136건 (CSS 변수도 병용) |
| `var\(--` | `css/create.css` | **0건** (CSS 변수 전혀 미사용) |
| `aria-` | `components/` | 163건 (32개 파일) |
| `focus-visible` | `components/` | 62건 (23개 파일) |
| `disabled:opacity\|:disabled` | `components/` | 49건 (19개 파일) |

### 10.2 globals.css CSS 변수 선언 원본 요약

- **섹션 1** (`:root`): Raw 팔레트 — primary/amber/neutral, font, spacing, radius, transition, layout → 총 ~70개 변수
- **섹션 2** (`:root, .dark`): 시맨틱 다크 토큰 — bg/surface/primary/accent/text/border/state/chat/shadow → 총 ~35개 변수
- **섹션 3** (`.light`): 라이트 override — 섹션 2 시맨틱 토큰 재정의 → ~25개 변수
- **섹션 4** (`:root`): 그라데이션 프리셋 → 6개 변수
- **섹션 5** (`:root, .dark`): 하위 호환 alias → ~14개 변수
- **총계**: **~150개 CSS 변수**

### 10.3 컴포넌트 파일 수 현황

| 디렉토리 | 파일 수 |
|---------|:------:|
| `components/ui/` | 1 (theme-toggle.tsx) |
| `components/common/` | 4 |
| `components/landing/` | 7 |
| `components/home/` | 8 |
| `components/create/` | 2 + steps 8개 = 10 |
| `components/mypage/` | 10 |
| `components/bot/` | 4 |
| `components/skills/` | 2 |
| `components/guest/` | 3 |
| `components/birth/` | 3 |
| `components/community/` | 1 |
| `components/jobs/` | 1 |
| `components/learning/` | 2 |
| `components/seo/` | 1 |
| **합계** | **~57개** |

### 10.4 핵심 판단 근거 파일 목록

- 토큰 설계: `app/globals.css` (561줄), `tailwind.config.ts` (266줄), `DESIGN.md` (328줄)
- 최대 이탈: `components/create/ui.tsx` (191줄 — 100% 인라인 스타일), `css/create.css` (160건 하드코딩)
- 라이트 모드 파손: `app/jobs/hire/page.tsx` (49건 `#f8fafc`, `#fff` 라이트 고정)
- 색상 혼재: `app/jobs/search/page-client.tsx:330` (`#0f0c29` 구 그라데이션 배경)
- 접근성 취약: Create 위저드 모든 Input의 `outline: 'none'` (`create/ui.tsx:53`)

---

*리포트 종료 — S7DS1 진단 완료. 이 문서는 S7 모든 Task의 베이스라인으로 활용됩니다.*
