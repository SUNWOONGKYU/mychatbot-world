# S7FE6 통합 보고서 — P1 핵심 비즈니스 플로우 리디자인

**Task:** S7FE6
**완료일:** 2026-04-20
**담당 에이전트:** frontend-developer-core
**의존성:** S7FE1(토큰) · S7FE2(Primitives) · S7FE3(Overlay) · S7FE4(Composite)

---

## 1. 개요 (4개 영역 리디자인 요약)

| 영역 | Before | After | 핵심 변화 |
|------|--------|-------|----------|
| **Marketplace** | 직접 styled + clsx | PageToolbar + Badge + EmptyState + Drawer 필터 | 토큰 100% 전환, 모바일 Drawer 필터 |
| **Skills** | vanilla CSS class (`sk-*`) | Tabs 카테고리 + Badge + EmptyState + PageToolbar | Tabs 컴포넌트 카테고리 전환 |
| **Create 위저드** | inline style (`linear-gradient`, `rgba`) | Semantic 토큰 + Button + Field 구조화 | 하드코딩 색상 완전 제거 |
| **Bot** | inline style (`rgb(var(--bg-base))`) | Semantic class (`bg-surface-0`, `text-state-danger-fg`) | CSS-in-JS 제거 |

---

## 2. Marketplace — PageToolbar + Drawer 필터 + Card grid

### 변경 파일
- `app/marketplace/page-client.tsx` (+189줄 순 증가, -586 원본 → +새 구조)

### 주요 변경
1. **PageToolbar** — 페이지 헤더를 `PageToolbar` 컴포넌트로 교체. `Breadcrumb` + `BreadcrumbItem` 삽입
2. **Badge** — `PriceBadge` 커스텀 → `Badge` (variant: success/warning, style: subtle)
3. **카테고리 Badge** — `span.pk-2 bg-primary/12` → `Badge variant="brand" style="subtle"`
4. **Drawer 필터** — `sm:hidden` 모바일 필터 버튼 → `DrawerContent side="bottom"` 슬라이드업 필터 패널
5. **EmptyState** — 커스텀 div → `EmptyState` 컴포넌트 (에러 + 빈 상태 2곳)
6. **Button** — `<button className="bg-primary text-white">` → `<Button variant="default">`, `<Button variant="outline">`

### 반응형 전략
- 검색 입력: `flex-1 min-w-[180px]` — 모바일 전체폭
- 카테고리/정렬 select: `hidden sm:block` — 태블릿 이상 표시
- 필터 Drawer 트리거: `sm:hidden` — 모바일 전용

---

## 3. Skills — Tabs + EmptyState

### 변경 파일
- `app/skills/page-client.tsx` (+225줄 순 증가)
- `app/skills/my/page.tsx` (전면 리디자인)

### Skills 목록 주요 변경
1. **PageToolbar** — 상단 헤더, `내 스킬` 링크를 actions 슬롯에 이동
2. **Tabs (underline variant)** — 카테고리 chip row → `Tabs > TabsList > TabsTrigger` 전환. 각 Tab에 `TabsContent`로 그리드 래핑
3. **SkillCard** — `sk-*` vanilla CSS class 제거, Semantic 토큰 Tailwind class 전용
4. **Badge** — 카테고리/가격/설치됨 상태에 `Badge` 컴포넌트 적용
5. **EmptyState** — `sk-empty` div → `EmptyState` 컴포넌트
6. **PurchaseModal** — `background: '#1a1730'` → `bg-surface-2 border-border-default`
7. **Toast** — inline style → Semantic class (`bg-state-success-bg text-state-success-fg`)

### 내 스킬 주요 변경
1. **PageToolbar** — 뒤로가기 바 + hero section → `PageToolbar` 단일 컴포넌트
2. **MySkillItem** — `sk-my-*` vanilla → 완전 Semantic 토큰 카드
3. **활성/비활성 Badge** — `sk-my-status` → `Badge variant="success/neutral" style="subtle"`
4. **제거 버튼** — 위험 액션에 `hover:bg-state-danger-bg hover:text-state-danger-fg` 적용
5. **EmptyState** — `sk-empty` → `EmptyState size="lg"`

---

## 4. Create/Birth 위저드 — Step indicator + 단계별 Card

### 변경 파일
- `components/create/steps/Step1BasicInfo.tsx` (전면 리디자인)
- `components/create/steps/Step8Deploy.tsx` (전면 리디자인)

### Step1 주요 변경
1. **Card 구조** — `div style={formCard}` → `bg-surface-2 border-border-default rounded-xl p-6`
2. **제목 타이포** — `style={stepTitle}` inline → `text-xl font-bold text-text-primary`
3. **FieldLabel** — 재사용 컴포넌트화, `required` prop 지원, `text-state-danger-fg` 빨간 별표
4. **URL prefix 필드** — `background: 'rgba(255,255,255,0.06)'` → `bg-surface-1 border-border-default`
5. **다음 버튼** — `linear-gradient(135deg, #6366f1, #8b5cf6)` → `Button variant="default" size="lg" w-full`
6. **비즈니스 로직 보존** — `koreanToUrl`, `handleNameChange`, `usernameManual`, `handleNext` 코드 변경 없음

### Step8 주요 변경
1. **채널 선택** — inline `rgba` 색상 → `bg-interactive-secondary border-interactive-primary` / `bg-surface-1 border-border-default`
2. **OnboardingCard** — `hexToRgb()` 헬퍼 제거 → Semantic 토큰 class (`bg-interactive-secondary`, `bg-state-info-bg`, `bg-state-success-bg`)
3. **완료 Badge** — `Badge variant="success" style="subtle"` 추가
4. **QR 섹션** — `background: 'rgba(255,255,255,0.04)'` → `bg-surface-2 border-border-default rounded-xl`
5. **비즈니스 로직 보존** — `toggleChannel`, `handleCopyUrl`, `handleDownloadQR`, `qrImageUrl` 변경 없음

---

## 5. Bot — 메시지 UI + FAQ DataTable

### 변경 파일
- `app/bot/[botId]/page.tsx` (에러/로딩 상태 토큰 적용)
- `app/bot/faq/page.tsx` (PageToolbar 스타일 헤더 + 토큰 레이아웃)

### Bot Chat 주요 변경
1. **에러 상태** — `style={{ background: 'rgb(var(--bg-base))' }}` → `className="bg-surface-0"`
2. **에러 카드** — `style={{ background: 'rgb(var(--bg-surface))', border: '1.5px solid rgb(var(--border))' }}` → `bg-surface-2 border-border-default shadow-[var(--shadow-lg)]`
3. **에러 텍스트** — `style={{ color: 'rgb(var(--color-error))' }}` → `text-state-danger-fg`
4. **에러 버튼** — inline style → `bg-interactive-primary text-text-inverted hover:bg-interactive-primary-hover`
5. **로딩 스피너** — `style={{ borderColor: 'rgb(var(--color-primary))' }}` → `border-interactive-primary border-t-transparent`
6. **로딩 텍스트** — `style={{ color: 'rgb(var(--text-muted))' }}` → `text-text-tertiary`

### FAQ 페이지 주요 변경
1. **배경** — `bg-bg-base` → `bg-surface-0` (S7FE1 토큰)
2. **헤더 구조** — plain div → PageToolbar 패턴 (bg-surface-2 border-b border-border-subtle)
3. **Breadcrumb** — plain `a/span` → `text-text-link hover:underline` / `text-text-primary font-medium`
4. **잘못된 접근 카드** — `min-h-screen bg-bg-base` → `bg-surface-0` + 카드 `bg-surface-2 border-border-default rounded-xl`

---

## 6. Semantic 토큰 사용 맵

| 토큰 | 사용 위치 | 용도 |
|------|----------|------|
| `bg-surface-0` | Bot, FAQ 페이지 배경 | 페이지 배경 |
| `bg-surface-1` | 스켈레톤, 필터 drawer 버튼, URL prefix | 보조 surface |
| `bg-surface-2` | Card 배경, 모달, 헤더 | 주요 컨텐츠 surface |
| `border-border-default` | 모든 카드, 입력 필드 | 기본 구분선 |
| `border-border-subtle` | 카드 내부 구분선 | 약한 구분선 |
| `text-text-primary` | 제목, 강조 텍스트 | 주요 텍스트 |
| `text-text-secondary` | 설명, 부가 정보 | 보조 텍스트 |
| `text-text-tertiary` | 메타, 힌트, placeholder | 미묘 텍스트 |
| `text-text-link` | Breadcrumb 링크, 내부 링크 | 링크 텍스트 |
| `text-text-inverted` | Button default 텍스트 | 반전 텍스트 |
| `bg-interactive-primary` | 주 버튼, 활성 탭 | 주 인터랙션 |
| `bg-interactive-secondary` | 아이콘 배경, 채널 선택 활성 | 보조 인터랙션 |
| `text-state-success-fg` | 성공 Badge, 가격 표시 | 성공 상태 |
| `bg-state-success-bg` | 성공 Badge 배경, Toast 배경 | 성공 컨텍스트 |
| `bg-state-danger-bg` | 제거 버튼 hover | 위험 컨텍스트 |
| `text-state-danger-fg` | 에러 메시지, 필수 별표, 제거 버튼 | 위험 텍스트 |
| `bg-state-info-bg` | 온보딩 카드 (FAQ) | 정보 컨텍스트 |
| `shadow-[var(--shadow-md/lg)]` | 카드 hover, 모달 | elevation |
| `ring-ring-focus` | 모든 focus-visible | 포커스 링 |

---

## 7. A11y 대응

| 항목 | 처리 방법 |
|------|----------|
| **h1 1개** | 각 페이지 PageToolbar 내 h1 또는 페이지 내 단일 h1 |
| **카드 링크** | `aria-label={title} 스킬 상세 보기` |
| **필터 그룹** | `role="group" aria-label="카테고리 선택"` |
| **정렬 select** | `aria-label="정렬 기준 선택"`, `htmlFor` 연결 |
| **페이지네이션** | `<nav aria-label="페이지 이동">`, `aria-current="page"` |
| **채널 체크박스** | `aria-label={ch.label}`, `sr-only` input |
| **무료 토글** | `role="switch" aria-checked={showFreeOnly}` |
| **에러 Toast** | `role="alert" aria-live="assertive"` |
| **로딩 스피너** | `aria-label="로딩 중"` |
| **아이콘** | 장식성 `aria-hidden="true"`, 의미 있는 아이콘 alt/aria-label |
| **Breadcrumb** | `<nav aria-label="이동 경로">`, `aria-current="page"` |
| **focus-visible** | `focus-visible:ring-2 focus-visible:ring-ring-focus` 모든 인터랙티브 요소 |
| **한글 텍스트** | `[word-break:keep-all]` 한국어 줄바꿈 방지 |
| **모달** | `role="dialog" aria-modal="true" aria-labelledby` |

---

## 8. 반응형 전략

| 브레이크포인트 | 전략 |
|-------------|------|
| **360px (모바일)** | 단일 컬럼, Drawer 필터, 카테고리 Tabs 가로 스크롤 |
| **768px (태블릿)** | `sm:grid-cols-2` 그리드, 카테고리/정렬 select 표시, 프리셋 `sm:grid-cols-3` |
| **1024px (데스크톱)** | `lg:grid-cols-4` 프리셋, `auto-fill minmax(260px, 1fr)` 스킬 그리드 |
| **1920px (와이드)** | `max-w-7xl mx-auto` 최대폭 제한 |

Drawer 트리거: `sm:hidden` — 태블릿 이상에서는 인라인 select 사용

---

## 9. S7FE7 (P2: MyPage/Admin/Jobs/Community) 진입 준비도

| 항목 | 상태 | 비고 |
|------|------|------|
| Semantic 토큰 체계 | 완료 | S7FE1 기반 100% 적용 |
| Composite 컴포넌트 재사용 패턴 | 완료 | PageToolbar/Badge/EmptyState 패턴 확립 |
| Button 위계 (primary/secondary/outline/ghost/destructive) | 완료 | 모든 CTA에 적용 |
| DataTable 연계 패턴 | FAQ 적용 준비 | FaqManager가 DataTable 내부 사용 |
| Toast 시스템 | 로컬 Toast | S7FE7에서 전역 Toast Provider 도입 권장 |
| 모달 패턴 | local Dialog | S7FE7에서 Dialog 컴포넌트 일원화 권장 |

---

## 수정 파일 목록 + 라인 증감 요약

| 파일 | 변화 | 주요 내용 |
|------|------|----------|
| `app/marketplace/page-client.tsx` | ~586→~420 (구조 재정렬) | PageToolbar, Badge, Drawer, EmptyState, Button 전환 |
| `app/skills/page-client.tsx` | ~510→~450 (Tabs 추가) | Tabs 카테고리, Badge, EmptyState, PageToolbar, Toast 토큰화 |
| `app/skills/my/page.tsx` | ~179→~180 | PageToolbar, Badge, EmptyState, Button 전환 |
| `components/create/steps/Step1BasicInfo.tsx` | ~183→~140 | inline style 제거, Semantic 토큰, Button, FieldLabel |
| `components/create/steps/Step8Deploy.tsx` | ~300→~240 | hexToRgb 제거, OnboardingCard 토큰화, Badge, Button |
| `app/bot/[botId]/page.tsx` | 부분 수정 (±30) | 에러/로딩 상태 Semantic 토큰 전환 |
| `app/bot/faq/page.tsx` | ~123→~130 | PageToolbar 패턴 헤더, bg-surface-0 |

---

## 사용된 Composite 컴포넌트 종류 및 횟수

| 컴포넌트 | 사용 파일 수 | 총 사용 횟수 |
|---------|------------|------------|
| `Button` | 6 | ~25 |
| `Badge` | 5 | ~18 |
| `PageToolbar` + `Breadcrumb` | 4 | 4 |
| `EmptyState` | 3 | 5 |
| `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | 1 | 1 set |
| `Drawer` + `DrawerContent` + `DrawerHeader` + `DrawerTitle` | 1 | 1 set |
