# Task Instruction - S1DS1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S1DS1

## Task Name
디자인 시스템 구축 (Light/Dark/System 3모드)

## Task Goal
CSS 변수 기반 테마 시스템을 구축하여 Light/Dark/System 3가지 모드를 지원한다. Tailwind CSS `dark:` 클래스와 next-themes를 연동하여 프로젝트 전체의 디자인 토큰을 정의한다.

## Prerequisites (Dependencies)
- S1BI1 (Next.js 프로젝트 초기화 + Tailwind CSS 설정)

## Specific Instructions

### 1. 디자인 토큰 정의
아래 컬러 토큰을 CSS 변수로 정의한다:

**Primary 컬러:** `#6366f1` (Indigo-500)
**Gray Scale:** Tailwind `gray-*`
**Slate Scale:** Tailwind `slate-*` (Dark 모드 배경)

### 2. styles/globals.css 작성
```css
/**
 * @task S1DS1
 * @description 전역 CSS — 테마 변수 + Tailwind 기반
 */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Primary */
    --color-primary: 99 102 241;        /* #6366f1 indigo-500 */
    --color-primary-hover: 79 70 229;   /* #4f46e5 indigo-600 */
    --color-primary-light: 224 231 255; /* #e0e7ff indigo-100 */

    /* Background */
    --color-bg-base: 255 255 255;       /* white */
    --color-bg-subtle: 249 250 251;     /* gray-50 */
    --color-bg-muted: 243 244 246;      /* gray-100 */

    /* Surface */
    --color-surface: 255 255 255;       /* white */
    --color-surface-hover: 243 244 246; /* gray-100 */

    /* Border */
    --color-border: 229 231 235;        /* gray-200 */
    --color-border-strong: 209 213 219; /* gray-300 */

    /* Text */
    --color-text-primary: 17 24 39;     /* gray-900 */
    --color-text-secondary: 107 114 128;/* gray-500 */
    --color-text-muted: 156 163 175;    /* gray-400 */

    /* Status */
    --color-success: 34 197 94;         /* green-500 */
    --color-warning: 234 179 8;         /* yellow-500 */
    --color-error: 239 68 68;           /* red-500 */
    --color-info: 59 130 246;           /* blue-500 */

    /* Sidebar */
    --sidebar-width: 256px;
    --header-height: 64px;
  }

  .dark {
    /* Background */
    --color-bg-base: 15 23 42;          /* slate-900 */
    --color-bg-subtle: 30 41 59;        /* slate-800 */
    --color-bg-muted: 51 65 85;         /* slate-700 */

    /* Surface */
    --color-surface: 30 41 59;          /* slate-800 */
    --color-surface-hover: 51 65 85;    /* slate-700 */

    /* Border */
    --color-border: 51 65 85;           /* slate-700 */
    --color-border-strong: 71 85 105;   /* slate-600 */

    /* Text */
    --color-text-primary: 248 250 252;  /* slate-50 */
    --color-text-secondary: 148 163 184;/* slate-400 */
    --color-text-muted: 100 116 139;    /* slate-500 */
  }
}
```

### 3. tailwind.config.ts 확장
S1BI1에서 만든 `tailwind.config.ts`에 CSS 변수 기반 컬러 토큰 추가:

```ts
/**
 * @task S1DS1
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        bg: {
          base: 'rgb(var(--color-bg-base) / <alpha-value>)',
          subtle: 'rgb(var(--color-bg-subtle) / <alpha-value>)',
          muted: 'rgb(var(--color-bg-muted) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
      height: {
        header: 'var(--header-height)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 4. lib/theme-provider.tsx 작성
next-themes를 래핑한 ThemeProvider 컴포넌트:

```tsx
/**
 * @task S1DS1
 * @description 테마 프로바이더 — next-themes 래퍼
 */
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### 5. components/ui/theme-toggle.tsx 작성
Light/Dark/System 3모드 전환 버튼:

```tsx
/**
 * @task S1DS1
 * @description 테마 토글 버튼 — Light/Dark/System 전환
 */
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-bg-muted p-1">
      <button
        onClick={() => setTheme('light')}
        className={`rounded px-2 py-1 text-sm transition-colors ${
          theme === 'light'
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="라이트 모드"
      >
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`rounded px-2 py-1 text-sm transition-colors ${
          theme === 'dark'
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="다크 모드"
      >
        Dark
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`rounded px-2 py-1 text-sm transition-colors ${
          theme === 'system'
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="시스템 모드"
      >
        System
      </button>
    </div>
  );
}
```

### 6. app/layout.tsx 업데이트
ThemeProvider로 감싸도록 수정:

```tsx
/**
 * @task S1DS1 (S1BI1 이어서 수정)
 */
import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Chatbot World',
  description: 'AI 챗봇 빌더 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-bg-base text-text-primary">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### 7. Google Stitch MCP 활용 (선택적)
UI 컴포넌트 디자인 레퍼런스가 필요한 경우 Google Stitch MCP를 통해 디자인 인사이트를 얻을 수 있다. 단, 실제 구현은 위 가이드라인을 따른다.

## Expected Output Files
- `styles/globals.css` (업데이트 — CSS 변수 추가)
- `tailwind.config.ts` (업데이트 — 토큰 색상 추가)
- `lib/theme-provider.tsx`
- `components/ui/theme-toggle.tsx`
- `app/layout.tsx` (업데이트 — ThemeProvider 감싸기)

## Completion Criteria
- [ ] CSS 변수가 `:root`와 `.dark`에 올바르게 정의됨
- [ ] `tailwind.config.ts`에서 `bg-primary`, `text-text-primary` 등 커스텀 클래스 사용 가능
- [ ] Light 모드: 흰 배경, 어두운 텍스트
- [ ] Dark 모드: Slate-900 배경, 밝은 텍스트
- [ ] System 모드: OS 설정에 따라 자동 전환
- [ ] `ThemeToggle` 컴포넌트가 3모드 전환 정상 동작
- [ ] `suppressHydrationWarning` 설정으로 Hydration 오류 없음
- [ ] TypeScript 타입 에러 없음

## Tech Stack
- CSS Custom Properties (CSS 변수)
- Tailwind CSS 3+ (darkMode: 'class')
- next-themes
- React (Client Component)

## Tools
- npm
- Google Stitch MCP (선택적 디자인 레퍼런스)

## Execution Type
AI-Only

## Remarks
- `darkMode: 'class'`는 S1BI1에서 이미 설정됨 — 이 Task에서 CSS 변수와 Tailwind 토큰 연결에 집중
- `rgb(var(--color-*) / <alpha-value>)` 패턴으로 opacity 지원
- `suppressHydrationWarning`은 next-themes의 SSR Hydration 문제 방지를 위해 필수

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1DS1 → `Process/S1_개발_준비/Design/`

### 제2 규칙: Production 코드는 이중 저장
- DS Area는 Production 저장 대상 아님
- 실제 파일은 프로젝트 루트의 `styles/`, `lib/`, `components/ui/`에 저장
