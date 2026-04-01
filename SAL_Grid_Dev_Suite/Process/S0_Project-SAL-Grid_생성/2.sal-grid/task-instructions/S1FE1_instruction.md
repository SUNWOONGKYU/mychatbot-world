# Task Instruction - S1FE1

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
S1FE1

## Task Name
공통 레이아웃 + 사이드바 컴포넌트 (React)

## Task Goal
Next.js App Router 기반의 공통 레이아웃을 구현한다. 12개 메뉴 항목을 포함한 사이드바, 상단 헤더, 모바일 네비게이션을 구현하며 Light/Dark 모드를 지원한다.

## Prerequisites (Dependencies)
- S1BI1 (Next.js 프로젝트 초기화)
- S1DS1 (디자인 시스템 구축)

## Specific Instructions

### 1. app/layout.tsx 업데이트 (메인 레이아웃 구조)
사이드바 + 메인 콘텐츠 영역의 2단 레이아웃:

```tsx
/**
 * @task S1FE1
 * @description 루트 레이아웃 — 사이드바 + 메인 콘텐츠
 */
import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme-provider';
import { Sidebar } from '@/components/common/sidebar';
import { Header } from '@/components/common/header';
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
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. components/common/sidebar.tsx 작성

12개 메뉴 항목:
1. 대시보드 (Dashboard) — `/dashboard`
2. 챗봇 관리 (My Bots) — `/bots`
3. 봇 만들기 (Create Bot) — `/bots/new`
4. 대화 내역 (Conversations) — `/conversations`
5. 지식 베이스 (Knowledge Base) — `/knowledge`
6. 페르소나 (Personas) — `/personas`
7. 템플릿 (Templates) — `/templates`
8. 연동 설정 (Integrations) — `/integrations`
9. 분석 (Analytics) — `/analytics`
10. 크레딧 (Credits) — `/credits`
11. 설정 (Settings) — `/settings`
12. 도움말 (Help) — `/help`

```tsx
/**
 * @task S1FE1
 * @description 사이드바 — 12개 메뉴, Light/Dark 지원
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: '⊞' },
  { href: '/bots', label: '챗봇 관리', icon: '🤖' },
  { href: '/bots/new', label: '봇 만들기', icon: '✚' },
  { href: '/conversations', label: '대화 내역', icon: '💬' },
  { href: '/knowledge', label: '지식 베이스', icon: '📚' },
  { href: '/personas', label: '페르소나', icon: '👤' },
  { href: '/templates', label: '템플릿', icon: '📋' },
  { href: '/integrations', label: '연동 설정', icon: '🔗' },
  { href: '/analytics', label: '분석', icon: '📊' },
  { href: '/credits', label: '크레딧', icon: '💳' },
  { href: '/settings', label: '설정', icon: '⚙️' },
  { href: '/help', label: '도움말', icon: '❓' },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-sidebar flex-shrink-0 flex-col border-r border-border bg-surface md:flex">
      {/* 로고 */}
      <div className="flex h-header items-center border-b border-border px-6">
        <span className="text-lg font-bold text-primary">MCW</span>
      </div>

      {/* 내비게이션 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                  )}
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

### 3. components/common/header.tsx 작성

```tsx
/**
 * @task S1FE1
 * @description 상단 헤더 — 타이틀, 테마 토글, 사용자 메뉴
 */
'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MobileNav } from '@/components/common/mobile-nav';

export function Header() {
  return (
    <header className="flex h-header items-center justify-between border-b border-border bg-surface px-6">
      {/* 모바일 햄버거 (md 미만에서만 표시) */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* 페이지 타이틀 (데스크탑) */}
      <div className="hidden md:block">
        <span className="text-sm text-text-secondary">My Chatbot World</span>
      </div>

      {/* 우측 액션 */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {/* 사용자 아바타 — S2SC1에서 실제 유저 연동 */}
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs text-primary font-medium">U</span>
        </div>
      </div>
    </header>
  );
}
```

### 4. components/common/mobile-nav.tsx 작성

```tsx
/**
 * @task S1FE1
 * @description 모바일 네비게이션 — 드로어 방식
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/bots', label: '챗봇 관리' },
  { href: '/conversations', label: '대화 내역' },
  { href: '/knowledge', label: '지식 베이스' },
  { href: '/personas', label: '페르소나' },
  { href: '/templates', label: '템플릿' },
  { href: '/integrations', label: '연동 설정' },
  { href: '/analytics', label: '분석' },
  { href: '/credits', label: '크레딧' },
  { href: '/settings', label: '설정' },
  { href: '/help', label: '도움말' },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover"
        aria-label="메뉴 열기"
      >
        ☰
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 드로어 */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-surface transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-header items-center justify-between border-b border-border px-6">
          <span className="text-lg font-bold text-primary">MCW</span>
          <button
            onClick={() => setOpen(false)}
            className="text-text-secondary hover:text-text-primary"
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-surface-hover',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
```

### 5. 반응형 처리
- 데스크탑 (md 이상, 768px+): 사이드바 고정 표시
- 모바일 (md 미만): 사이드바 숨김, 햄버거 버튼 + 드로어 방식

## Expected Output Files
- `app/layout.tsx` (업데이트)
- `components/common/sidebar.tsx`
- `components/common/header.tsx`
- `components/common/mobile-nav.tsx`

## Completion Criteria
- [ ] 12개 메뉴 항목이 사이드바에 모두 표시
- [ ] 현재 활성 메뉴 하이라이트 (pathname 기반)
- [ ] Light/Dark 모드에서 사이드바, 헤더 스타일 정상 적용
- [ ] 데스크탑: 사이드바 고정 표시
- [ ] 모바일: 햄버거 버튼 → 드로어 정상 동작
- [ ] `npm run build` 에러 없음
- [ ] TypeScript 타입 에러 없음
- [ ] `ThemeToggle`이 헤더에 올바르게 표시

## Tech Stack
- Next.js 14+ (App Router, Client Components)
- TypeScript
- Tailwind CSS
- clsx

## Tools
- npm

## Execution Type
AI-Only

## Remarks
- 아이콘은 현재 이모지 사용 (S2DS1에서 lucide-react 또는 heroicons로 교체 예정)
- 사용자 아바타는 플레이스홀더 — S2SC1(Auth) 이후 실제 유저 정보 연동
- 메뉴 항목 순서는 UX 흐름 고려 (생성 → 관리 → 분석 → 설정)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1FE1 → `Process/S1_개발_준비/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- FE Area: Stage 폴더 + `pages/` (Pre-commit Hook 자동 복사)
- `components/` 파일들도 Stage 폴더에 원본 보관
