# S1DS1 — 디자인 시스템 구축 (Light / Dark / System 3모드)

> Task ID: S1DS1
> Stage: S1 개발 준비
> Area: Design
> 완료일: 2026-03-31

---

## 개요

next-themes 기반 3모드 테마 시스템과 CSS 변수 디자인 토큰을 구축한다.
모든 컬러·치수 값은 CSS 변수로 정의하고, Tailwind config에서 `rgb(var(...) / <alpha-value>)` 패턴으로 연결한다.

---

## 파일 구조

```
app/
  globals.css             ← CSS 변수 전체 정의 (라이트/다크)
  layout.tsx              ← ThemeProvider 래핑
lib/
  theme-provider.tsx      ← next-themes ThemeProvider 래퍼
components/ui/
  theme-toggle.tsx        ← Light/Dark/System 3버튼 토글 컴포넌트
tailwind.config.ts        ← CSS 변수 → Tailwind 색상 토큰 매핑
```

---

## 테마 모드

| 모드 | 설명 | HTML class |
|------|------|------------|
| light | 라이트 모드 강제 | (없음 / `:root` 기본값 사용) |
| dark | 다크 모드 강제 | `<html class="dark">` |
| system | OS 설정 자동 따라감 | OS에 따라 자동 전환 |

- `defaultTheme: "system"` — 첫 방문자는 OS 설정 따라감
- `disableTransitionOnChange: true` — 테마 전환 시 CSS transition 깜빡임 방지
- `suppressHydrationWarning` — `<html>` 태그에 필수 (SSR hydration 불일치 억제)

---

## CSS 변수 디자인 토큰 레퍼런스

### 포맷 규칙

```css
/* CSS 변수 정의 — RGB 채널 값만 (rgb() 래퍼 없음) */
--color-primary: 99 102 241;

/* 사용 시 */
color: rgb(var(--color-primary));             /* 불투명 */
color: rgb(var(--color-primary) / 0.5);       /* 50% 투명도 */
```

### Primary (브랜드 컬러)

| 토큰 | 라이트 | 다크 | 설명 |
|------|--------|------|------|
| `--color-primary` | `99 102 241` (#6366f1) | `129 140 248` (#818cf8) | Indigo 500/400 |
| `--color-primary-hover` | `79 70 229` (#4f46e5) | `99 102 241` (#6366f1) | Indigo 600/500 |
| `--color-primary-light` | `238 242 255` (#eef2ff) | `30 27 75` (#1e1b4b) | Indigo 50/950 |

### 배경 (Background)

| 토큰 | 라이트 | 다크 | 설명 |
|------|--------|------|------|
| `--color-bg-base` | `255 255 255` | `15 23 42` | 메인 배경 |
| `--color-bg-subtle` | `249 250 251` | `30 41 59` | 서브 배경 (Gray 50 / Slate 800) |
| `--color-bg-muted` | `243 244 246` | `51 65 85` | 더 약한 배경 (Gray 100 / Slate 700) |

### 서피스 (Surface — 카드, 패널)

| 토큰 | 라이트 | 다크 | 설명 |
|------|--------|------|------|
| `--color-surface` | `255 255 255` | `30 41 59` | 카드/패널 기본 |
| `--color-surface-hover` | `249 250 251` | `51 65 85` | 호버 상태 |

### 보더 (Border)

| 토큰 | 라이트 | 다크 | 설명 |
|------|--------|------|------|
| `--color-border` | `229 231 235` | `51 65 85` | 기본 선 (Gray 200 / Slate 700) |
| `--color-border-strong` | `209 213 219` | `71 85 105` | 강조 선 (Gray 300 / Slate 600) |

### 텍스트 (Text)

| 토큰 | 라이트 | 다크 | 설명 |
|------|--------|------|------|
| `--color-text-primary` | `17 24 39` | `248 250 252` | 본문 (Gray 900 / Slate 50) |
| `--color-text-secondary` | `107 114 128` | `148 163 184` | 보조 (Gray 500 / Slate 400) |
| `--color-text-muted` | `156 163 175` | `100 116 139` | 희미 (Gray 400 / Slate 500) |

### 상태 컬러 (Status)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--color-success` | `34 197 94` (Green 500) | `74 222 128` (Green 400) |
| `--color-warning` | `234 179 8` (Yellow 500) | `250 204 21` (Yellow 400) |
| `--color-error` | `239 68 68` (Red 500) | `248 113 113` (Red 400) |
| `--color-info` | `59 130 246` (Blue 500) | `96 165 250` (Blue 400) |

### 챗봇 특화

| 토큰 | 설명 |
|------|------|
| `--color-chat-user` | 사용자 말풍선 배경 |
| `--color-chat-bot` | 봇 말풍선 배경 |
| `--color-chat-user-text` | 사용자 말풍선 텍스트 |
| `--color-chat-bot-text` | 봇 말풍선 텍스트 |

### 레이아웃 치수

| 변수 | 값 | 설명 |
|------|----|------|
| `--sidebar-width` | `260px` | 사이드바 너비 |
| `--header-height` | `60px` | 헤더 높이 |

---

## Tailwind 클래스 토큰 매핑

| Tailwind 클래스 | CSS 변수 | 설명 |
|-----------------|----------|------|
| `bg-bg-base` | `--color-bg-base` | 메인 배경 |
| `bg-bg-subtle` | `--color-bg-subtle` | 서브 배경 |
| `bg-bg-muted` | `--color-bg-muted` | 더 약한 배경 |
| `bg-surface` | `--color-surface` | 카드/패널 배경 |
| `bg-surface-hover` | `--color-surface-hover` | 카드 호버 배경 |
| `bg-primary` | `--color-primary` | 브랜드 배경 |
| `bg-primary-hover` | `--color-primary-hover` | 브랜드 호버 배경 |
| `bg-primary-light` | `--color-primary-light` | 브랜드 연한 배경 |
| `text-text-primary` | `--color-text-primary` | 본문 텍스트 |
| `text-text-secondary` | `--color-text-secondary` | 보조 텍스트 |
| `text-text-muted` | `--color-text-muted` | 희미 텍스트 |
| `border-border` | `--color-border` | 기본 선 |
| `border-border-strong` | `--color-border-strong` | 강조 선 |
| `text-primary` | `--color-primary` | 브랜드 텍스트 색상 |
| `w-sidebar` | `--sidebar-width` | 사이드바 너비 |
| `h-header` | `--header-height` | 헤더 높이 |

### Alpha 투명도 사용 예시

```tsx
// Tailwind에서 alpha 채널 조절
<div className="bg-primary/10">   // 10% opacity primary 배경
<div className="text-primary/70"> // 70% opacity primary 텍스트
<div className="border-border/50"> // 50% opacity border
```

---

## ThemeToggle 컴포넌트 사용법

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

// 헤더나 설정 페이지에 배치
export default function Header() {
  return (
    <header className="h-header flex items-center justify-between px-4">
      <h1>My Chatbot World</h1>
      <ThemeToggle />
    </header>
  );
}
```

---

## 구현 결정 사항

1. **RGB 포맷 선택 이유**: Tailwind의 `<alpha-value>` 슬롯을 활용하기 위해 `rgb()` 래퍼를 변수 값에 포함하지 않는다. 변수 값은 채널만 (`99 102 241`), 사용 시 `rgb(var(--color-primary) / 0.5)` 형태로 작성한다.

2. **next-themes attribute="class"**: CSS 변수가 `.dark` 선택자에 정의되어 있으므로, next-themes는 반드시 `attribute="class"` 를 사용해야 한다.

3. **disableTransitionOnChange**: 테마 전환 시 모든 CSS `transition`이 잠시 비활성화되어 색상이 한 번에 바뀐다. 깜빡임/부드러운 전환이 필요하다면 이 옵션을 제거하고 선택적 transition 클래스를 적용한다.

4. **Hydration 처리**: `ThemeToggle`은 `mounted` 상태를 확인한 후에만 실제 버튼을 렌더링한다. 서버에서는 스켈레톤 placeholder를 표시한다.
