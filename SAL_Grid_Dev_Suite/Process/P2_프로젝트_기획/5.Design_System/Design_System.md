# My Chatbot World — 디자인 시스템

> 작성일: 2026-03-31
> 소급 도입: 기존 CSS/UI 분석 기반

---

## 현재 디자인 구조

### CSS 파일 (13개)

| 파일 | 대상 페이지 |
|------|-----------|
| styles.css | 글로벌 기본 |
| landing.css | 랜딩 |
| birth.css | Birth |
| create.css | Create 위저드 |
| chat.css | Bot 대화 |
| chat-mobile.css | Bot 모바일 |
| home.css | 대시보드 |
| learning.css | School |
| skills.css | Skills 마켓 |
| jobs.css | Jobs |
| job-detail.css | Jobs 상세 |
| community.css | Community |
| pages.css | 공통 페이지 |

### UI 패턴

- **반응형**: 모바일 퍼스트 (chat-mobile.css 별도)
- **사이드바**: 좌측 네비게이션 (sidebar.js)
- **카드 UI**: 대시보드·마켓·커뮤니티 공통
- **모달/팝업**: 설정·상세보기 공통

### 디자인 작업 도구

- **Google Stitch MCP 연동**: 디자인 작업 시 Google Stitch MCP 서버를 통해 작업
- React 전환 시 Tailwind CSS 도입 예정

---

## 테마 모드 (Light / Dark / System — 3가지 필수 지원)

사용자가 직접 선택하거나 System 모드로 OS 설정을 따름.

### 공통 토큰 (모드 불변)

| 토큰 | 값 | 용도 |
|------|-----|------|
| **Primary** | `#6366f1` (Indigo 500) | 브랜드 메인, 버튼, 링크 |
| **Accent** | `#8b5cf6` (Violet 500) | 강조, 배지, CTA |
| **Success** | `#22c55e` | 성공 상태 |
| **Warning** | `#f59e0b` | 경고 상태 |
| **Error** | `#ef4444` | 오류 상태 |
| **Font** | Inter, -apple-system, sans-serif | 본문 |
| **Radius** | sm 6px / md 8px / lg 12px / xl 16px | 모서리 |
| **Gradient** | `135deg, #6366f1 → #8b5cf6 → #a78bfa` | 브랜드 그라디언트 |

### Light 모드

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--bg-primary` | `#ffffff` | 메인 배경 |
| `--bg-secondary` | `#f9fafb` (Gray 50) | 섹션/카드 배경 |
| `--bg-tertiary` | `#f3f4f6` (Gray 100) | 입력필드/호버 배경 |
| `--text-primary` | `#111827` (Gray 900) | 본문 텍스트 |
| `--text-secondary` | `#4b5563` (Gray 600) | 보조 텍스트 |
| `--text-tertiary` | `#9ca3af` (Gray 400) | 플레이스홀더 |
| `--border` | `#e5e7eb` (Gray 200) | 테두리 |
| `--border-hover` | `#d1d5db` (Gray 300) | 테두리 호버 |
| `--card-bg` | `#ffffff` | 카드 배경 |
| `--card-shadow` | `0 1px 3px rgba(0,0,0,0.1)` | 카드 그림자 |
| `--sidebar-bg` | `#ffffff` | 사이드바 배경 |
| `--sidebar-text` | `#374151` (Gray 700) | 사이드바 텍스트 |
| `--sidebar-active` | `#eef2ff` (Primary 50) | 사이드바 활성 항목 |
| `--overlay` | `rgba(0,0,0,0.3)` | 모달 오버레이 |

### Dark 모드

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--bg-primary` | `#0f172a` (Slate 900) | 메인 배경 |
| `--bg-secondary` | `#1e293b` (Slate 800) | 섹션/카드 배경 |
| `--bg-tertiary` | `#334155` (Slate 700) | 입력필드/호버 배경 |
| `--text-primary` | `#f1f5f9` (Slate 100) | 본문 텍스트 |
| `--text-secondary` | `#94a3b8` (Slate 400) | 보조 텍스트 |
| `--text-tertiary` | `#64748b` (Slate 500) | 플레이스홀더 |
| `--border` | `#334155` (Slate 700) | 테두리 |
| `--border-hover` | `#475569` (Slate 600) | 테두리 호버 |
| `--card-bg` | `#1e293b` (Slate 800) | 카드 배경 |
| `--card-shadow` | `0 1px 3px rgba(0,0,0,0.4)` | 카드 그림자 |
| `--sidebar-bg` | `#0f172a` (Slate 900) | 사이드바 배경 |
| `--sidebar-text` | `#cbd5e1` (Slate 300) | 사이드바 텍스트 |
| `--sidebar-active` | `rgba(99,102,241,0.15)` | 사이드바 활성 항목 |
| `--overlay` | `rgba(0,0,0,0.6)` | 모달 오버레이 |

### Dark 모드 Primary/Accent 보정

Dark 배경에서 가독성을 위해 밝기를 한 단계 올림:

| 토큰 | Light | Dark |
|------|-------|------|
| Primary (버튼) | `#6366f1` (500) | `#818cf8` (400) |
| Accent (강조) | `#8b5cf6` (500) | `#a78bfa` (400) |
| Success | `#22c55e` | `#4ade80` |
| Warning | `#f59e0b` | `#fbbf24` |
| Error | `#ef4444` | `#f87171` |

### System 모드 (구현 방식)

```css
/* 기본: Light */
:root { /* Light 토큰 */ }

/* Dark: data-theme 또는 media query */
[data-theme="dark"] { /* Dark 토큰 */ }

/* System: OS 설정 추종 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* Dark 토큰 */ }
}
```

**동작 규칙:**
1. `data-theme="light"` → 강제 Light
2. `data-theme="dark"` → 강제 Dark
3. `data-theme` 없음 또는 `"system"` → OS 설정 자동 추종
4. 사용자 선택은 `localStorage`에 저장하여 새로고침 시 유지

### 테마 전환 UI

- 위치: 사이드바 하단 또는 설정 메뉴
- 아이콘: ☀️ Light / 🌙 Dark / 🖥️ System
- 전환 애니메이션: `transition: background-color 250ms, color 250ms`

---

## 타이포그래피

| 레벨 | 사이즈 | 굵기 | 용도 |
|------|--------|------|------|
| H1 | 3rem (48px) | 800 | 랜딩 히어로 |
| H2 | 2.25rem (36px) | 700 | 섹션 제목 |
| H3 | 1.5rem (24px) | 600 | 카드 제목 |
| H4 | 1.25rem (20px) | 600 | 서브 제목 |
| Body | 1rem (16px) | 400 | 본문 |
| Small | 0.875rem (14px) | 400 | 보조 텍스트 |
| Caption | 0.75rem (12px) | 400 | 캡션/라벨 |

---

## React 전환 계획

| 항목 | 현재 (Vanilla) | 전환 후 (React) |
|------|-------------|-------------|
| 스타일링 | CSS 파일 13개 | Tailwind CSS (dark: 클래스) |
| 테마 관리 | CSS 변수 수동 | next-themes 라이브러리 |
| 컴포넌트 | 없음 | 재사용 컴포넌트 체계 |
| 상태 관리 | DOM 직접 조작 | React state / Context |
| 라우팅 | 파일 기반 (HTML) | Next.js App Router |
| 디자인 도구 | — | **Google Stitch MCP 연동** — UI/컴포넌트 디자인 시 MCP 서버 통해 작업 |
