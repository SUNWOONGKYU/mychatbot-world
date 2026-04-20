# Design System — CoCoBot (CoCoBot)

> AI 코딩 에이전트가 이 파일을 읽고 CoCoBot의 디자인 시스템에 맞는 일관된 UI를 생성합니다.
> 모든 페이지, 컴포넌트, 스타일은 이 문서를 따라야 합니다.

## 1. Visual Theme & Atmosphere

CoCoBot는 AI 챗봇 생성·공유·수익화 플랫폼이다. 디자인은 **다크 모드 퍼스트**이되, 라이트 모드를 완벽히 지원한다. 전체적인 인상은 "기술적이면서도 친근한" — Linear의 정밀한 다크 UI와 Stripe의 프리미엄 수익 UI를 결합한 느낌이다.

Primary 색상은 **바이올렛 퍼플(`#5E4BFF`)** — AI/기술/창의성을 상징한다. Accent 색상은 **앰버 골드(`#F59E0B`)** — 수익/가치/보상을 강조한다. 이 두 색상은 명확히 역할이 분리되어 있다: 퍼플은 브랜드·인터랙션·CTA, 앰버는 수익·크레딧·가치 지표.

폰트는 **Pretendard Variable** — 한글과 영문 모두 자연스러운 가변 폰트다. Linear의 Inter처럼 400(본문)→500(UI)→600(제목)→700(강조)→800(Hero) 웨이트 시스템을 사용한다.

배경은 **Slate 계열 뉴트럴** — Linear처럼 순수 블랙이 아닌 약간의 블루 톤이 있는 `#0F172A`(다크)를 사용하여 차가우면서도 깊이감 있는 인상을 준다.

**핵심 특성:**
- 다크 모드 퍼스트: `#0F172A` 배경 (Slate 900) — 순수 블랙 대신 블루 톤
- Pretendard Variable 가변 폰트 — 한글 최적화
- 퍼플(`#5E4BFF`) + 앰버(`#F59E0B`) 듀얼 브랜드 시스템
- 반투명 보더: `rgb(var(--border))` — Linear 스타일 미묘한 구분선
- 퍼플 글로우 그림자: CTA 버튼에 `#5E4BFF` 기반 글로우 이펙트
- CSS 변수 기반: `rgb(var(--토큰명))` 패턴으로 모든 색상 참조
- 다크/라이트 자동 전환: `.dark`/`.light` 클래스로 시맨틱 토큰 override

## 2. Color Palette & Roles

### Primary — Violet Purple (브랜드, CTA, 인터랙션)
- **Primary 500** (`#5E4BFF`): 기준색. 라이트 모드 CTA 버튼, 링크.
- **Primary 400** (`#7B6EFF`): 다크 모드 CTA 버튼, 링크. 다크 배경에서 더 밝게.
- **Primary 300** (`#A89EFF`): 호버 상태 (다크).
- **Primary 600** (`#4A35E0`): 호버 상태 (라이트).
- **Primary 50** (`#F3F0FF`): 라이트 모드 배지 배경, 뮤트 서피스.
- **Primary 950** (`#0D0638`): 다크 모드 배지 배경.
- **Primary 900** (`#1A0D68`): 그라데이션 시작점, 딥 퍼플.
- **Primary 700** (`#3822B8`): 포커스 링 보더.

### Accent — Amber Gold (수익, 크레딧, 가치)
- **Amber 500** (`#F59E0B`): 기준색. 수익 위젯, 크레딧 표시.
- **Amber 400** (`#FBBF24`): 다크 모드 강조. **+ 딥 퍼플 Navbar의 active 메뉴 밑줄 및 회원가입 CTA 강조색** (퍼플 배경 위 대비색으로 허용).
- **Amber 300** (`#FCD34D`): 다크 모드 호버.
- **Amber 600** (`#D97706`): 라이트 모드 호버.
- **Amber 50** (`#FFFBEB`): 라이트 모드 앰버 배지 배경.

### Neutral — Slate 계열 (배경, 텍스트, 보더)

**다크 모드 배경:**
- **Neutral 950** (`#080E1A`): 가장 깊은 배경 (Hero 그라데이션 바닥)
- **Neutral 900** (`#0F172A`): `--bg-base` — 메인 페이지 배경
- **Neutral 850** (`#172033`): `--bg-subtle` — 섹션 구분
- **Neutral 800** (`#1E293B`): `--bg-surface` — 카드, 사이드바, 패널
- **Neutral 700** (`#334155`): `--bg-surface-hover` — 호버 상태, 봇 버블

**다크 모드 텍스트:**
- **Neutral 50** (`#F8FAFC`): `--text-primary` — 메인 텍스트
- **Neutral 400** (`#94A3B8`): `--text-secondary` — 부제목, 설명
- **Neutral 500** (`#64748B`): `--text-muted` — 플레이스홀더, 메타

**다크 모드 보더:**
- **Neutral 700** (`#334155`): `--border` — 일반 구분선
- **Neutral 800** (`#1E293B`): `--border-subtle` — 카드 내부
- **Neutral 600** (`#475569`): `--border-strong` — 강조 보더

**라이트 모드:** 위 토큰들이 자동 override됨 (.light 클래스)
- 배경: `#FFFFFF` → `#F8FAFC` → `#F1F5F9`
- 텍스트: `#111827` → `#64748B` → `#94A3B8`
- 보더: `#E2E8F0` → `#F1F5F9` → `#CBD5E1`

### Status Colors
- **Success** — 다크: `#34D399` / 라이트: `#10B981`
- **Warning** — `#FBBF24` / `#F59E0B`
- **Error** — `#F87171` / `#EF4444`
- **Info** — `#60A5FA` / `#3B82F6`

### Shadows
- **다크 모드**: 강한 검은 그림자 (`rgb(0 0 0 / 0.4~0.7)`)
- **라이트 모드**: 부드러운 그림자 (`rgb(0 0 0 / 0.05~0.1)`)
- **퍼플 글로우**: `0 0 0 3px rgb(94 75 255 / 0.3), 0 8px 24px rgb(94 75 255 / 0.2)` — CTA 버튼
- **앰버 글로우**: `0 0 0 3px rgb(245 158 11 / 0.3), 0 8px 24px rgb(245 158 11 / 0.2)` — 수익 위젯

## 3. Typography Rules

### Font Family
- **Primary**: `PretendardVariable`, `Pretendard`, `-apple-system`, `BlinkMacSystemFont`, `Apple SD Gothic Neo`, `Malgun Gothic`, `Noto Sans KR`, `sans-serif`
- **Monospace**: `JetBrains Mono`, `Fira Code`, `Consolas`, `Courier New`, `monospace`

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Hero Display | 48px (3rem) | 800 | 1.1 (tight) | -0.02em | 랜딩 Hero 타이틀 |
| Section Title | 36px (2.25rem) | 700 | 1.2 | -0.02em | 섹션 제목 |
| Heading 1 | 30px (1.875rem) | 700 | 1.2 | -0.02em | 페이지 제목 |
| Heading 2 | 24px (1.5rem) | 600 | 1.3 | -0.02em | 서브 섹션 |
| Heading 3 | 20px (1.25rem) | 600 | 1.4 | -0.01em | 카드 타이틀 |
| Body Large | 18px (1.125rem) | 400 | 1.625 | normal | 소개 텍스트, 설명 |
| Body | 16px (1rem) | 400 | 1.625 | normal | 표준 본문 |
| Body Medium | 16px (1rem) | 500 | 1.5 | normal | 네비게이션, 라벨 |
| Body Semibold | 16px (1rem) | 600 | 1.5 | normal | 강조 라벨 |
| Small | 14px (0.875rem) | 400 | 1.5 | normal | 캡션, 메타 |
| Caption | 12px (0.75rem) | 500 | 1.4 | normal | 배지, 태그 |
| Micro | 11px (0.6875rem) | 500 | 1.4 | normal | 아주 작은 라벨 |
| Code | 14px (0.875rem) | 400 (mono) | 1.6 | normal | 코드 블록 |

### Principles
- **한글 우선**: Pretendard는 한글 자간이 자연스러움. 영문만 쓰는 사이트와 달리 한글 line-height를 1.625로 넉넉하게.
- **웨이트 시스템**: 400(본문) → 500(UI/네비) → 600(카드 제목) → 700(섹션 제목) → 800(Hero)
- **Heading letter-spacing**: `-0.02em` — 한글에서 살짝 타이트하게.
- **Mono는 코드 전용**: JetBrains Mono는 코드 블록과 기술 라벨에만 사용.

## 4. Component Stylings

### Buttons

**Primary (퍼플 CTA)**
- Background: `rgb(var(--color-primary))` → 다크 `#7B6EFF`, 라이트 `#5E4BFF`
- Text: `#FFFFFF`
- Padding: `12px 24px`
- Radius: `--radius-lg` (12px)
- Font: 16px weight 600
- Hover: `rgb(var(--color-primary-hover))` + `translateY(-1px)` + 퍼플 글로우 그림자
- Active: `translateY(0)` + 글로우 축소
- Use: "시작하기", "챗봇 만들기", 주요 CTA

**Secondary (아웃라인)**
- Background: transparent
- Text: `rgb(var(--color-primary))`
- Border: `1px solid rgb(var(--border))`
- Padding: `12px 24px`
- Radius: `--radius-lg` (12px)
- Hover: `rgb(var(--bg-surface-hover))` 배경 + 퍼플 보더
- Use: "더 알아보기", 보조 액션

**Accent (앰버 — 수익 관련)**
- Background: `rgb(var(--color-accent))`
- Text: `#111111`
- Radius: `--radius-lg` (12px)
- Hover: 앰버 글로우
- Use: "정산 요청", "크레딧 충전", 수익 관련 CTA

**Ghost (투명)**
- Background: transparent
- Text: `rgb(var(--text-secondary))`
- Hover: `rgb(var(--bg-surface-hover))` 배경
- Use: 네비게이션 항목, 필터, 정렬

### Cards

**Standard Card**
- Background: `rgb(var(--bg-surface))`
- Border: `1px solid rgb(var(--border))`
- Radius: `--radius-xl` (16px)
- Padding: `24px`
- Shadow: `var(--shadow-md)`
- Hover: `translateY(-2px)` + 퍼플 보더(`rgb(var(--primary-400))`) + `var(--shadow-lg)`

**Skill Card (스킬장터)**
- 위와 동일 + 이모지 아이콘(40px) + 가격 태그(앰버 유료, 그린 무료)

**Job Card (구봇구직)**
- 위와 동일 + 카테고리 칩 + 마감일 표시

### Navigation

**상단 Navbar (앱 내부) — Deep Purple Brand Bar**
- Height: `64px` (`--header-height`)
- Background: `rgb(var(--nav-bg))` = **`primary-900`** (#1A0D68 딥 퍼플) — **라이트/다크 모드 동일**. 테마 토글해도 헤더는 변하지 않아 브랜드 정체성을 고정. (DS §7 "다크/라이트 자동 전환" 원칙의 **브랜드 고정 예외**)
- Text: `rgb(var(--nav-text))` = `#FFFFFF`, 비활성 `rgb(var(--nav-text-muted))` (연한 라벤더 톤)
- Active 메뉴: 흰색 + **앰버(`amber-400`) 밑줄 글로우** — 퍼플 배경 위 대비 확보 (DS §2 "앰버=가치/강조" 역할과 일치)
- Border-bottom: 스크롤 시에만 `1px solid rgb(var(--nav-border))` — `primary-500 / 0.30` + `backdrop-blur-md` + `shadow-sm`
- 로그인/로그아웃 버튼: transparent + 흰색 보더(`rgb(255 255 255 / 0.25)`), 호버 시 흰색 10% 배경
- 회원가입 버튼: 앰버 배경 + 검정 텍스트 (Accent CTA 강조)
- 로고: "CoCoBot" 텍스트 (`font-extrabold`, `text-primary`)
- 4대 메뉴: Birth / Skills / Jobs / Community
- 활성 메뉴: `text-primary` 색상, 밑줄 또는 퍼플 하이라이트
- 비활성: `text-text-muted`
- 숨김 경로: `/`, `/pricing`, `/store`, `/blog`, `/about`, `/login`, `/signup`, `/guest`, `/admin`

**모바일 하단 탭바**
- 4탭: Home / Birth / Skills / Community
- 높이: 48px 이상 (터치 타겟)
- 활성: 퍼플(`text-primary`), 비활성: `text-text-muted`
- Safe-area 패딩: `env(safe-area-inset-bottom)`
- `md:` 이상에서 숨김

**하단 Footer (랜딩)**
- Background: `var(--nav-bg)` — **Navbar와 동일 토큰 참조** (헤더/푸터 한 쌍으로 브랜드 일관성 유지)
- Border-top: `1px solid rgb(var(--primary-500) / 0.30)` — 본문과 경계
- Text: 흰색 (헤더 예외 조항 동일 적용)
- 원칙: 페이지 상·하단이 같은 딥 퍼플로 프레임되어 **브랜드 샌드위치** 효과

### Inputs

**Text Input**
- Background: `rgb(var(--bg-surface))`
- Border: `1px solid rgb(var(--border))`
- Radius: `--radius-md` (8px)
- Padding: `10px 14px`
- Focus: `2px solid rgb(var(--color-primary))` + 퍼플 글로우
- Placeholder: `rgb(var(--text-muted))`

### Badges / Pills

**카테고리 칩**
- Background: `rgb(var(--color-primary-muted))`
- Text: `rgb(var(--color-primary))`
- Radius: `--radius-full` (9999px)
- Padding: `4px 12px`
- Font: 14px weight 500

**가격 태그 (유료)**
- Background: `rgb(var(--color-accent-muted))`
- Text: `rgb(var(--color-accent))`

**가격 태그 (무료)**
- Background: `rgb(var(--color-success) / 0.15)`
- Text: `rgb(var(--color-success))`

## 5. Layout Principles

### Spacing Scale (4px 기반)
`0 → 2px → 4px → 6px → 8px → 10px → 12px → 16px → 20px → 24px → 32px → 40px → 48px → 64px → 80px → 96px → 128px`

### Grid
- 최대 너비: `1280px` (컨텐츠 영역)
- 카드 그리드: 데스크탑 3~4열, 태블릿 2열, 모바일 1열
- 카드 간격: `24px` (gap-6)
- 섹션 간격: `80px~96px` (py-20 ~ py-24)
- 컨텐츠 패딩: 데스크탑 `0 24px`, 모바일 `0 16px`

### Page Structure
```
[Navbar — 64px 고정 상단]
[Main — flex-1, bg-bg-base]
  [Hero Section — 그라데이션 배경]
  [Content Sections — 카드 그리드]
  [Footer]
[MobileTabBar — 모바일 하단 고정]
```

## 6. Depth & Elevation

| Level | Use | Shadow (Dark) | Shadow (Light) |
|-------|-----|---------------|----------------|
| 0 | 페이지 배경 | none | none |
| 1 | 카드, 패널 | `0 1px 2px 0 rgb(0 0 0 / 0.4)` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| 2 | 호버 카드, 드롭다운 | `0 4px 6px -1px rgb(0 0 0 / 0.5)` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` |
| 3 | 모달, 토스트 | `0 10px 15px -3px rgb(0 0 0 / 0.6)` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` |
| Glow | CTA 퍼플 | 퍼플 글로우 (`#5E4BFF / 0.3`) | 퍼플 글로우 (약하게) |
| Glow Accent | 수익 위젯 | 앰버 글로우 (`#F59E0B / 0.3`) | 앰버 글로우 (약하게) |

## 7. Do's and Don'ts

### Do
- CSS 변수(`rgb(var(--토큰명))`) 사용 — 하드코딩 색상 금지
- 퍼플은 브랜드/CTA/인터랙션에만, 앰버는 수익/크레딧에만
- 카드 호버에 `translateY(-2px)` + 퍼플 보더 + 그림자 증가
- 다크/라이트 양쪽에서 테스트
- Pretendard 폰트 사용 (한글 포함)
- `--radius-xl` (16px)을 카드에, `--radius-lg` (12px)을 버튼에

### Don't
- `#0d0d12`, `#16161c` 같은 하드코딩 다크 배경 사용 금지 — `rgb(var(--bg-base))` 사용
- 이모지를 SVG 대용으로 남발하지 않기 (렌더링 불안정)
- 한 페이지에 다크+라이트 혼재 금지 — 테마 시스템을 따를 것
- `rgba(255,255,255,0.6)` 같은 인라인 색상 대신 시맨틱 토큰 사용
- 순수 블랙(`#000000`) 배경 금지 — 항상 `--bg-base` 사용
- 순수 화이트(`#FFFFFF`) 텍스트 금지 (다크 모드) — `--text-primary` 사용
  - **예외**: Navbar의 딥 퍼플(`primary-900`) 배경 위에서는 대비 확보를 위해 `--nav-text` (#FFFFFF) 허용

## 8. Responsive Behavior

### Breakpoints (Tailwind 기본)
| Name | Min Width | Description |
|------|-----------|-------------|
| `sm` | 640px | 큰 모바일 |
| `md` | 768px | 태블릿 — Navbar 표시, 탭바 숨김 |
| `lg` | 1024px | 데스크탑 — 3열 그리드 |
| `xl` | 1280px | 큰 데스크탑 — 4열 그리드 |

### Touch Targets
- 최소 터치 영역: `48px × 48px`
- 하단 탭바 아이템: `min-h-[48px]`
- 버튼 최소 높이: `44px`

### Mobile Adaptations
- Navbar → 로고만 표시 (메뉴는 하단 탭바로)
- 카드 그리드 → 1열
- 사이드바 → 숨김 (모바일에서는 전체 화면)
- Hero 텍스트: `48px` → `32px`
- 모달 → 바텀시트 전환 (기획)
- `pb-[calc(env(safe-area-inset-bottom)+64px)]` — 하단 탭바 높이만큼 패딩

## 9. Agent Prompt Guide

### 색상 참조 방법
```css
/* 올바른 방법 */
background-color: rgb(var(--bg-base));
color: rgb(var(--text-primary));
border-color: rgb(var(--border));

/* 투명도 필요 시 */
background-color: rgb(var(--primary-500) / 0.2);

/* 잘못된 방법 — 절대 사용 금지 */
background: #0d0d12;
color: white;
border: 1px solid #333;
```

### Tailwind 클래스 매핑
```
bg-bg-base      → rgb(var(--bg-base))
bg-surface       → rgb(var(--bg-surface))
text-text-primary → rgb(var(--text-primary))
text-primary     → rgb(var(--color-primary))
border-border    → rgb(var(--border))
```

### 새 컴포넌트 작성 시 체크리스트
1. CSS 변수 사용 여부 확인 (하드코딩 색상 없는지)
2. 다크/라이트 양쪽 렌더링 확인
3. 모바일 반응형 확인 (md: 브레이크포인트)
4. 호버/포커스/액티브 상태 구현
5. 접근성: 포커스 링, aria 라벨
6. 퍼플은 CTA/브랜드, 앰버는 수익/가치에만 사용

### 그라데이션 참조
```css
/* Hero 배경 (다크) */
background: var(--gradient-hero-dark);

/* Primary 버튼 */
background: var(--gradient-primary);

/* 수익 섹션 */
background: var(--gradient-revenue);
```
