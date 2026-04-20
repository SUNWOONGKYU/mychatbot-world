# S7FE1 — Tailwind + globals.css 재구성 통합 보고서

- **Task ID**: S7FE1
- **Stage/Area**: S7 / FE
- **Dependencies**: S7DS5 (Semantic Tokens)
- **Agent**: frontend-developer-core
- **실행일**: 2026-04-20
- **Status**: Executed (검증 대기)

---

## 1. Executive Summary

S7DS4 Primitive(84개) + S7DS5 Semantic(41개) 토큰을 실제 코드로 반영하여 MCW 디자인 시스템 v3.0을 구축했다.
핵심은 **"S7 신규 토큰을 1등 시민으로 승격시키되, S5FE1 v2.0 레거시 alias는 완전히 유지"**해서 기존 25+ 페이지가 한 줄도 깨지지 않게 만드는 것이다.

| 항목 | 수치 |
|------|------|
| 수정 파일 | **2개** (`app/globals.css`, `tailwind.config.ts`) |
| 추가 보고 문서 | **1개** (`S7FE1_integration.md`) |
| 추가 CSS 변수 (Primitive) | **84개** (7 palette × 12 step) — HEX 폴백 + OKLCH 이중 선언 |
| 추가 CSS 변수 (Semantic) | **41개** (Surface 5 + Text 6 + Border 3 + Ring 2 + Interactive 7 + State 12 + Accent 2 + Shadow 4) |
| 유지된 하위호환 alias | **30+개** (shadcn: `background/foreground/primary/secondary/muted/destructive/card/popover` + S5FE1: `bg.*`, `text.muted`, `border.primary`, `accent.*`, `primary.50~950`, `chat.*`) |
| 다크 모드 지원 방식 | `.dark` 클래스 + `[data-theme="dark"]` 속성 + `prefers-color-scheme` 자동 감지 (3중 지원) |

---

## 2. `app/globals.css` 구조 (이미 완료된 상태 요약)

총 875 lines, 13개 섹션:

| § | 섹션명 | 내용 |
|---|--------|------|
| §1 | **S7 PRIMITIVE TOKENS** | OKLCH 기반 84개 원자 색상 (Neutral 250°, Brand 280°, Accent 75°, Success 150°, Warning 60°, Danger 25°, Info 240°) — HEX 폴백 + OKLCH 이중 선언 |
| §2 | **S7 SEMANTIC TOKENS — Light** | `:root` Surface/Text/Border/Ring/Interactive/State/Accent/Shadow (41개) |
| §3 | **S7 SEMANTIC TOKENS — Dark** | `[data-theme="dark"]`, `.dark` 이중 셀렉터 |
| §4 | **시스템 Dark 자동 감지** | `@media (prefers-color-scheme: dark)` + `:root:not([data-theme="light"]):not(.light)` |
| §5 | **레거시 팔레트 (S5FE1 v2.0)** | `--primary-*`, `--amber-*`, `--neutral-*` RGB 트리플렛 유지 |
| §6 | **레거시 다크 모드 시맨틱** | `--bg-*`, `--color-primary`, `--color-accent`, `--text-primary-rgb` 등 |
| §7 | **레거시 라이트 모드 override** | `.light` 클래스 스코프 |
| §8 | **그라데이션 프리셋** | `--gradient-ai/primary/revenue/accent/hero-dark/hero-light` |
| §9 | **하위 호환성 alias** | `--color-bg-base`, `--color-surface` 등 (S1DS1~S4 호환) |
| §10 | **Base Styles** | `body`, `h1-h6`, `:focus-visible`, scrollbar, selection |
| §11 | **Utilities** | `gradient-text-*`, `line-clamp-*`, `text-hero/display/h1/h2`, `card-hover`, `tabular-nums`, `shimmer` |
| §12 | **Keyframes** | `fadeInUp`, `fadeIn`, `shimmer`, `countUp`, `pulse-glow` |
| §13 | **Animation 유틸 + Reduced motion** | `animate-*` + `prefers-reduced-motion` 대응 |

> ※ §1~§4가 S7 신규, §5~§9가 S5FE1 레거시 유지, §10~§13이 공통.

---

## 3. `tailwind.config.ts` 변경 요약 (Before/After)

### 3.1 darkMode

| | Before (S5FE1 v2.0) | After (S7FE1 v3.0) |
|---|---------------------|--------------------|
| darkMode | `'class'` | **`['class', '[data-theme="dark"]']`** |

→ `.dark` 클래스와 `data-theme="dark"` 속성을 **동시에** 다크 모드 트리거로 인식.

### 3.2 colors 구조 비교

| 그룹 | Before (S5FE1) | After (S7FE1) |
|------|----------------|---------------|
| **Primitive** | `primary.50~950` (RGB 트리플렛), `accent.50~900`, `neutral.0~950`, `brand.50~900` (하드코딩) | **`neutral/brand/accent-amber/success/warning/danger/info`** (각 12단계 50~1000) — OKLCH `var(--color-*)` |
| **Surface** | `bg.{base/subtle/muted/surface/...}` (6단계) | **`surface.{0,1,2,3,4}`** (Elevation 5단계) + 레거시 `bg.*` 유지 |
| **Text** | `text.{primary/secondary/muted/on-primary/on-accent}` | **`text.{primary/secondary/tertiary/inverted/link/disabled}`** + 레거시 유지 |
| **Border** | `border.{DEFAULT/subtle/strong/primary}` | **`border.{subtle/default/strong}`** + 레거시 `DEFAULT/primary` 유지 |
| **Ring** | 없음 | **`ring.{focus/offset}`** 신설 (Focus 시각화) |
| **Interactive** | 없음 (primary.DEFAULT/hover만) | **`interactive.{primary/primary-hover/primary-active/secondary/secondary-hover/destructive/destructive-hover}`** 신설 |
| **State** | `success/warning/error/info` (단일 값) | **`state.{success/warning/danger/info}.{bg/fg/border}`** 3속성 (Alert/Toast 등 컴포넌트용) |
| **Accent** | `accent.DEFAULT/hover/muted/50~900` | **`accent.{primary/secondary}`** 신설 + 레거시 모두 유지 |

### 3.3 boxShadow

S5FE1와 동일 키(`sm/md/lg/xl/primary-glow/accent-glow`)지만, §2/§3의 `--shadow-*` 변수가 S7 OKLCH 기반으로 재정의되어 **다크 모드에서 더 강한 투명도**를 자동 적용.

---

## 4. 하위 호환 alias 매핑표

### 4.1 shadcn/ui 패턴 → S7 신 토큰

| shadcn key | S7 매핑 | 용도 |
|------------|---------|------|
| `bg-background` | `var(--surface-0)` | 앱 기본 배경 |
| `text-foreground` | `var(--text-primary)` | 기본 텍스트 |
| `bg-primary` / `text-primary-foreground` | `var(--interactive-primary)` / `var(--text-inverted)` | 주요 버튼 |
| `bg-secondary` / `text-secondary-foreground` | `var(--interactive-secondary)` / `var(--text-primary)` | 보조 버튼 |
| `bg-muted` / `text-muted-foreground` | `rgb(var(--bg-muted))` / `rgb(var(--text-muted))` | 비활성/보조 영역 (레거시 브릿지 유지) |
| `bg-destructive` / `text-destructive-foreground` | `var(--interactive-destructive)` / `var(--text-inverted)` | 삭제/위험 버튼 |
| `bg-card` / `text-card-foreground` | `var(--surface-2)` / `var(--text-primary)` | 카드 |
| `bg-popover` / `text-popover-foreground` | `var(--surface-3)` / `var(--text-primary)` | 팝오버/드롭다운 |
| `border-input` | `var(--border-default)` | Input 테두리 |

### 4.2 S5FE1 v2.0 팔레트 → 유지 (제거 금지)

| 레거시 클래스 | 유지 상태 | 비고 |
|--------------|----------|------|
| `primary-{50..950}` | ✅ 그대로 유지 | RGB 트리플렛 `--primary-*` 변수 참조 |
| `accent-{50..900}` (amber) | ✅ 그대로 유지 | 25+ 페이지 hero/revenue 컴포넌트에서 사용 |
| `neutral-{0..950}` + `neutral-850` | ✅ 그대로 유지 | 사이드바 배경 등에서 사용 |
| `brand-{50..900}` | ✅ S7에서 OKLCH 팔레트로 재정의 | 기존 sky 블루 HEX → OKLCH 280° 바이올렛 (의도된 v3.0 변경) |
| `bg-{base/subtle/muted/surface/surface-hover/surface-raised}` | ✅ 그대로 유지 | S5FE1 `--bg-*` 변수 기반 |
| `text-muted`, `text-on-primary`, `text-on-accent` | ✅ 그대로 유지 | 버튼/배지 전경색 |
| `border-primary`, `border` DEFAULT | ✅ 그대로 유지 | 기존 card/input 스타일 |
| `chat-{user-bg/user-text/bot-bg/bot-text}` | ✅ 그대로 유지 | 챗봇 버블 (코코봇) |
| `shadow-primary-glow`, `shadow-accent-glow` | ✅ 그대로 유지 | pulse-glow 애니메이션 |
| `bg-gradient-{ai/primary/revenue/accent/hero-dark/hero-light}` | ✅ 그대로 유지 | 랜딩/Hero 섹션 |

---

## 5. 빌드 검증

### 5.1 시도 결과

| 검증 | 결과 | 비고 |
|------|------|------|
| `npx tsc --noEmit --skipLibCheck` | ❌ **실행 불가** | 한글 경로(`G:\내 드라이브\`)로 인해 npx/node가 `node_modules` 해결 실패 |
| Junction 경로 (`C:\claude-project`) 경유 재시도 | ❌ **실행 불가** | junction을 따라간 뒤에도 Node가 원본 한글 경로를 참조 |
| `node_modules/.bin/tsc.cmd` 직접 호출 | ❌ **실행 불가** | 동일 원인 |

### 5.2 권고

> **수동 검증 필요**: PO가 `C:\mcw-build` (이전 성공 빌드 환경)에서 `npm run build` 또는 `npx tsc --noEmit`을 실행해 검증할 것.

예상 리스크:
- `tailwind.config.ts`의 `colors.neutral.850`은 `rgb(var(--neutral-850) / <alpha-value>)` 형태(레거시 RGB 트리플렛)인 반면, `neutral.0/50/100/...`는 OKLCH `var(--color-neutral-*)` 형태다. **서로 다른 리턴 포맷**이지만 Tailwind는 문자열만 보므로 빌드는 통과한다. 사용 시 `neutral-850`만 alpha channel 이용 가능.
- `success/warning/info`의 `DEFAULT`는 레거시 RGB 트리플렛, `50~1000` 스텝은 OKLCH. 컴포넌트 기존 `text-success` (DEFAULT) 호출은 계속 작동.

---

## 6. S7FE2 / S7FE3 인계 — 사용 가능 클래스

### 6.1 Surface (Elevation)

```html
<div class="bg-surface-0">   <!-- 앱 바탕 -->
<div class="bg-surface-1">   <!-- 섹션 배경 -->
<div class="bg-surface-2">   <!-- 카드 -->
<div class="bg-surface-3">   <!-- 팝오버/모달 -->
<div class="bg-surface-4">   <!-- 반전 배너 (다크 컨테이너 on light) -->
```

### 6.2 Text

```html
<p class="text-text-primary">본문</p>
<p class="text-text-secondary">보조 설명</p>
<p class="text-text-tertiary">메타 정보</p>
<p class="text-text-inverted">다크 배경 위 텍스트</p>
<a class="text-text-link">링크</a>
<span class="text-text-disabled">비활성</span>
```

### 6.3 Border / Ring

```html
<div class="border border-border-subtle">   <!-- 희미한 구분 -->
<div class="border border-border-default">  <!-- 기본 -->
<div class="border border-border-strong">   <!-- 강조 -->
<button class="focus:ring-2 focus:ring-ring-focus focus:ring-offset-2 focus:ring-offset-ring-offset">
```

### 6.4 Interactive

```html
<button class="bg-interactive-primary hover:bg-interactive-primary-hover active:bg-interactive-primary-active">
<button class="bg-interactive-secondary hover:bg-interactive-secondary-hover">
<button class="bg-interactive-destructive hover:bg-interactive-destructive-hover">
```

### 6.5 State (Alert/Toast)

```html
<div class="bg-state-success-bg text-state-success-fg border border-state-success-border">
  저장되었습니다
</div>
<div class="bg-state-warning-bg text-state-warning-fg border border-state-warning-border">
<div class="bg-state-danger-bg  text-state-danger-fg  border border-state-danger-border">
<div class="bg-state-info-bg    text-state-info-fg    border border-state-info-border">
```

### 6.6 Accent (브랜드 강조)

```html
<span class="text-accent-primary">   <!-- 브랜드 바이올렛 -->
<span class="text-accent-secondary"> <!-- 서브 액센트 (앰버) -->
```

### 6.7 Shadow

```html
<div class="shadow-sm">
<div class="shadow-md">
<div class="shadow-lg">
<div class="shadow-xl">
```

> ※ 다크 모드에서 투명도가 자동 강화됨.

### 6.8 Primitive (필요 시)

```html
<div class="bg-neutral-50">     <!-- OKLCH 250° -->
<div class="bg-brand-500">      <!-- OKLCH 280° -->
<div class="bg-accent-amber-400"> <!-- OKLCH 75° -->
<div class="bg-success-500">
<div class="bg-danger-500">
```

---

## 7. MINOR 권고 반영 여부

| # | 권고 | 반영 | 증빙 |
|---|------|:----:|------|
| 1 | **Neutral-0 Primitive 추가** (`#FFFFFF` 순백 필요 시) | ✅ 반영 완료 | globals.css §1 라인 34-35: `--color-neutral-0: #FFFFFF / oklch(1 0 0)` |
| 2 | **OKLCH 구형 브라우저 폴백** (HEX 먼저 선언) | ✅ 반영 완료 | globals.css §1 전체 — 84개 색상 모두 HEX → OKLCH 순서로 2회 선언하여 cascade override |
| 3 | **중복 다크 블록 통합** (수동 `.dark` + system `prefers-color-scheme`) | ⚠️ **부분 반영** | `.dark` + `[data-theme="dark"]` 블록(§3)과 `@media (prefers-color-scheme: dark)` 블록(§4)이 여전히 분리되어 있음 → 사용자가 명시적으로 테마를 선택하지 않은 경우에만 시스템 감지가 적용되는 우선순위 구조. DRY 위반이지만 **우선순위 의도 명시**를 위해 의도적으로 중복 유지 |

---

## 8. 파일 절대 경로 (완료 산출물)

- `G:\내 드라이브\mychatbot-world\app\globals.css` (875 lines — 이전 세션에서 완료)
- `G:\내 드라이브\mychatbot-world\tailwind.config.ts` (본 세션 재작성 완료)
- `G:\내 드라이브\mychatbot-world\SAL_Grid_Dev_Suite\Process\S0_Project-SAL-Grid_생성\2.sal-grid\task-results\S7FE1_integration.md` (본 보고서)
- `G:\내 드라이브\mychatbot-world\SAL_Grid_Dev_Suite\Process\S0_Project-SAL-Grid_생성\3.method\json\data\grid_records\S7FE1.json` (status 업데이트 완료)

---

## 9. 다음 단계 (S7FE2 / S7FE3 / PO)

1. **PO 빌드 검증**: `C:\mcw-build` 환경에서 `npm run build` 수행 (한글 경로 이슈 회피)
2. **S7FE2**: 위 §6의 클래스 목록을 사용하여 기존 페이지를 신 토큰으로 점진 마이그레이션
3. **S7FE3**: shadcn 컴포넌트 재구성 — `Button`, `Card`, `Alert`, `Toast`, `Input` 등에 `state.*`, `interactive.*` 적용
4. **검증 에이전트 투입**: `code-reviewer-core`가 `S7FE1_verification.md` 기준으로 검증 → `verification_status`: `Verified` 확정 → `task_status`: `Completed` 전이
