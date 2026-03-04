# /ui-ux-builder-core

> **SAL Grid Dev Suite** — UX 경험 설계 + UI 컴포넌트 구현 통합 스킬
> **사용 시점**: 화면 설계, 사용자 흐름 설계, 컴포넌트 개발, 반응형 UI 구축이 필요할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능
> **핵심 원칙**: UX 먼저, UI 다음

---

## 전문 분야

UX 경험 설계부터 UI 컴포넌트 구현까지 전 과정을 담당하는 통합 스킬

- **UX 설계**: 페르소나, 사용자 저니 맵, 정보 구조(IA), 사용자 플로우, 와이어프레임
- **React/Next.js**: `app/` (App Router), `components/` 구조
- **Vanilla**: `pages/` 디렉토리 + 순수 HTML/CSS/JS
- **스타일링**: Tailwind CSS 기반 디자인 시스템
- **접근성**: WCAG 2.1 준수

---

## PART 1: UX 설계 프로세스

### 1.1 작업 흐름

```
UX 분석
  → 페르소나 정의 (누가 쓰는가?)
  → 사용자 저니 맵 (어떻게 경험하는가?)
  → 정보 구조 설계 (무엇을 배치할 것인가?)
  → 사용자 플로우 설계 (어떤 순서로 이동하는가?)
  → 와이어프레임 (어떻게 보일 것인가?)
        ↓
UI 설계
  → 디자인 시스템 선택 (컬러, 타이포, 토큰)
  → 컴포넌트 가이드 (버튼 상태, 카드 구조)
  → 반응형 레이아웃 설계
        ↓
frontend-developer 전달
  → 와이어프레임 + 컴포넌트 가이드 + 플로우 문서 전달
  → UI 구현 및 컴포넌트 개발 착수
```

### 1.2 페르소나 템플릿

```markdown
## 페르소나: [이름]

| 항목 | 내용 |
|------|------|
| 이름 | [가상 이름] |
| 나이 | [나이대] |
| 직업 | [직업] |
| 기술 수준 | 초급 / 중급 / 고급 |
| 주요 목표 | [이 서비스를 통해 달성하려는 것] |
| 주요 불편 | [현재 겪고 있는 문제] |
| 사용 환경 | [모바일 / 데스크톱 / 둘 다] |

### 대표 시나리오
[페르소나가 이 서비스를 사용하는 구체적인 상황 설명]

### 성공 기준
[페르소나가 "이 서비스가 좋다"고 느끼는 조건]
```

### 1.3 사용자 저니 맵 템플릿

```markdown
## 사용자 저니 맵: [시나리오명]

| 단계 | 행동 | 생각 | 감정 | 기회 |
|------|------|------|------|------|
| 인지 | [서비스를 알게 되는 행동] | [생각] | 중립 | [개선 기회] |
| 탐색 | [서비스를 둘러보는 행동] | [생각] | 기대 | [개선 기회] |
| 사용 | [핵심 기능을 사용하는 행동] | [생각] | 만족/불만 | [개선 기회] |
| 재방문 | [다시 돌아오는 행동] | [생각] | 신뢰 | [개선 기회] |

### 감정 곡선
인지(중립) → 탐색(기대) → 사용(만족) → 재방문(신뢰)
```

### 1.4 사용자 플로우 템플릿

```markdown
## 사용자 플로우: [기능명]

### 시작점
[진입 경로 설명]

### 플로우
[시작] → [화면 A] → [액션] → [화면 B] → [완료]
                              ↓ (오류 시)
                          [오류 화면] → [재시도]

### 분기 조건
- 조건 A: [설명] → [이동 화면]
- 조건 B: [설명] → [이동 화면]

### 종료점
- 성공: [설명]
- 실패: [설명]
```

### 1.5 와이어프레임 템플릿 (ASCII)

**목록 페이지 와이어프레임**
```
+------------------------------------------+
| [LOGO]   홈  |  목록  |  소개   [로그인] |
+------------------------------------------+
| [제목]                                   |
| [검색바________________________] [검색]  |
+------------------------------------------+
| +--------+  +--------+  +--------+       |
| | 카드 1  |  | 카드 2  |  | 카드 3  |    |
| | 제목   |  | 제목   |  | 제목   |       |
| | 설명   |  | 설명   |  | 설명   |       |
| +--------+  +--------+  +--------+       |
| +--------+  +--------+  +--------+       |
| | 카드 4  |  | 카드 5  |  | 카드 6  |    |
| +--------+  +--------+  +--------+       |
+------------------------------------------+
|       [이전] 1  2  3  4  5 [다음]        |
+------------------------------------------+
```

**상세 페이지 와이어프레임**
```
+------------------------------------------+
| [LOGO]   홈  |  목록  |  소개   [로그인] |
+------------------------------------------+
| [뒤로가기]                               |
| +------+  [제목]                         |
| | 이미지|  [부제목 / 상태]               |
| |      |  [주요 수치: ★ 4.5]            |
| +------+                                 |
+------------------------------------------+
| [탭: 상세정보] [리뷰] [관련항목]          |
+------------------------------------------+
| [본문 내용 영역]                          |
|                                          |
+------------------------------------------+
| [하단 액션 버튼]                          |
+------------------------------------------+
```

### 1.6 UX 산출물 유형 표

| 산출물 | 분류 | 형식 | 예시 |
|--------|------|------|------|
| 페르소나 | 사용자 이해 | Markdown 문서 | 30대 직장인 김철수 |
| 사용자 저니 맵 | 경험 설계 | Markdown 표 | 인지→탐색→사용→재방문 |
| 정보 구조(IA) | 구조 설계 | 트리 다이어그램 | 홈>목록>상세 |
| 사용자 플로우 | 흐름 설계 | 플로우 차트 | 로그인→대시보드 |
| 와이어프레임 | 화면 설계 | ASCII / Markdown | 목록/상세 페이지 레이아웃 |
| 컴포넌트 가이드 | UI 스펙 | 코드 + 설명 | 버튼 4가지 variant |
| 디자인 토큰 | 시스템 | CSS 변수 | --color-primary |

---

## PART 2: 디자인 시스템

### 2.1 컬러 팔레트 (tailwind.config.ts)

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#64748b',
          600: '#475569',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      }
    }
  }
}
```

### 2.2 타이포그래피

```css
h1: text-4xl font-bold
h2: text-3xl font-semibold
h3: text-2xl font-semibold
body: text-base
small: text-sm
```

### 2.3 디자인 토큰 (CSS 변수)

```css
:root {
  --color-primary: #3b82f6;
  --color-primary-dark: #1d4ed8;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --font-base: 1rem;
  --spacing-base: 0.25rem;
  --radius-base: 0.5rem;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
}
```

---

## PART 3: UI 컴포넌트 템플릿

### 1. Button 컴포넌트

```typescript
// components/ui/Button.tsx
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-primary-600 hover:bg-primary-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
```

**버튼 상태 가이드**

| 상태 | variant | 설명 |
|------|---------|------|
| 기본 | `primary` | 주요 액션 (저장, 제출) |
| 보조 | `secondary` | 보조 액션 (취소, 돌아가기) |
| 외곽선 | `outline` | 강조 없는 선택 |
| 투명 | `ghost` | 최소 강조 (링크형) |
| 비활성 | `disabled` | 클릭 불가 상태 |
| 로딩 | `isLoading` | 처리 중 상태 |

### 2. Card 컴포넌트

```typescript
// components/ui/Card.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md p-6',
        hover && 'transition-shadow hover:shadow-lg cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-2xl font-semibold', className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-gray-600', className)}>{children}</div>;
}
```

**카드 구조 가이드**

```
+---------------------------+
| CardHeader                |
|   CardTitle               |
|   [부제목 / 메타정보]      |
+---------------------------+
| CardContent               |
|   [본문 내용]              |
|   [수치 / 태그]            |
+---------------------------+
```

### 3. Input 컴포넌트

```typescript
// components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500',
            error ? 'border-error' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### 4. 항목 카드 컴포넌트 (프로젝트별 커스터마이즈)

```typescript
// components/items/ItemCard.tsx
// 이 컴포넌트는 이 프로젝트의 주요 엔티티에 맞게 커스터마이즈하세요.
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Item {
  id: number;
  title: string;
  description?: string;
  status: string;
  avatar_url?: string;
  avg_score?: number;
  [key: string]: unknown;
}

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`}>
      <Card hover>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              {item.avatar_url ? (
                <img
                  src={item.avatar_url}
                  alt={item.title}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  {item.title[0]}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-xl">{item.title}</CardTitle>
              <p className="text-sm text-gray-500">{item.status}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {item.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
              )}
            </div>
            {item.avg_score !== undefined && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {item.avg_score?.toFixed(1) || 'N/A'}
                </div>
                <p className="text-xs text-gray-500">평균 평점</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 5. 페이지네이션 컴포넌트

```typescript
// components/ui/Pagination.tsx
'use client';

import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        이전
      </Button>

      {pages.map(page => {
        // 현재 페이지 근처만 표시
        if (
          page === 1 ||
          page === totalPages ||
          (page >= currentPage - 2 && page <= currentPage + 2)
        ) {
          return (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          );
        }

        // "..." 표시
        if (page === currentPage - 3 || page === currentPage + 3) {
          return <span key={page} className="px-2">...</span>;
        }

        return null;
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        다음
      </Button>
    </div>
  );
}
```

---

## PART 4: 페이지 템플릿

### 항목 목록 페이지

**React/Next.js (App Router)**

```typescript
// app/items/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ItemCard } from '@/components/items/ItemCard';
import { Pagination } from '@/components/ui/Pagination';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems(currentPage);
  }, [currentPage]);

  async function fetchItems(page: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/items?page=${page}&limit=12`);
      const data = await res.json();

      setItems(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">목록</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {items.map((item: any) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
```

**Vanilla (HTML)**

```html
<!-- pages/items/index.html -->
<!--
@description 항목 목록 페이지
-->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>목록 — {PROJECT_NAME}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  <nav class="bg-white shadow-md">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <a href="/" class="text-2xl font-bold text-blue-600">{PROJECT_NAME}</a>
    </div>
  </nav>

  <main class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">목록</h1>
    <div id="items-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- JS로 동적 렌더링 -->
    </div>
    <div id="pagination" class="flex justify-center gap-2"></div>
  </main>

  <script>
    let currentPage = 1;

    async function fetchItems(page) {
      const res = await fetch(`/api/items?page=${page}&limit=12`);
      const data = await res.json();
      renderItems(data.data);
      renderPagination(page, data.pagination.totalPages);
    }

    function renderItems(items) {
      const grid = document.getElementById('items-grid');
      grid.innerHTML = items.map(item => `
        <a href="/items/${item.id}.html" class="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <h3 class="text-xl font-semibold mb-2">${item.title}</h3>
          <p class="text-gray-500 text-sm">${item.status}</p>
        </a>
      `).join('');
    }

    fetchItems(currentPage);
  </script>
</body>
</html>
```

### 항목 상세 페이지 (React/Next.js)

```typescript
// app/items/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: item, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !item) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{item.title}</h1>
              <p className="text-xl text-gray-600 mb-4">{item.status}</p>
            </div>

            {item.avg_score !== undefined && (
              <div className="text-center">
                <div className="text-5xl font-bold text-primary-600">
                  {item.avg_score?.toFixed(1) || 'N/A'}
                </div>
                <p className="text-sm text-gray-500">평균 평점</p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">설명</h2>
            <p className="text-gray-700 leading-relaxed">
              {item.description || '설명이 없습니다.'}
            </p>
          </div>

          {/* 추가 섹션: 프로젝트 요구사항에 따라 추가 */}
        </div>
      </div>
    </div>
  );
}
```

---

## PART 5: 레이아웃 & 네비게이션

### 루트 레이아웃 (React/Next.js)

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '{PROJECT_NAME}',
  description: '이 프로젝트에 맞는 설명을 작성하세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-gray-50">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

### 네비게이션 바

```typescript
// components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const pathname = usePathname();

  // 이 프로젝트의 메뉴 구조에 맞게 수정하세요.
  const links = [
    { href: '/', label: '홈' },
    { href: '/items', label: '목록' },
    { href: '/about', label: '소개' },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            {/* 프로젝트 로고/이름 */}
            {'{PROJECT_NAME}'}
          </Link>

          <div className="flex items-center gap-6">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-primary-600 transition-colors ${
                  pathname === link.href ? 'text-primary-600 font-semibold' : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <Button size="sm">로그인</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## PART 6: 반응형 & 접근성

### 반응형 브레이크포인트

```typescript
// Tailwind 기본 브레이크포인트 사용
sm: '640px'   // 모바일
md: '768px'   // 태블릿
lg: '1024px'  // 데스크톱
xl: '1280px'  // 대형 데스크톱

// 사용 예
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**반응형 전략**

| 화면 | 컬럼 | 폰트 | 패딩 |
|------|------|------|------|
| 모바일 (< 640px) | 1열 | text-base | px-4 |
| 태블릿 (640~1024px) | 2열 | text-base | px-6 |
| 데스크톱 (> 1024px) | 3열 | text-base | px-8 |

### 접근성 필수 사항

```typescript
// 1. alt 텍스트
<img src="..." alt="항목 이미지 설명" />

// 2. aria-label
<button aria-label="메뉴 열기">
  <MenuIcon />
</button>

// 3. 키보드 네비게이션
<button onKeyDown={(e) => e.key === 'Enter' && handleClick()}>

// 4. 포커스 관리
<input className="focus:outline-none focus:ring-2 focus:ring-primary-500" />

// 5. 시맨틱 HTML
<main>, <nav>, <article>, <section> 사용
```

**WCAG 2.1 체크리스트**

- [ ] 모든 이미지에 alt 텍스트 있음
- [ ] 색상 대비 비율 4.5:1 이상 (일반 텍스트)
- [ ] 키보드만으로 모든 기능 접근 가능
- [ ] 포커스 시각적 표시 있음
- [ ] 시맨틱 HTML 태그 사용
- [ ] 폼 레이블 연결됨

---

## PART 7: 로딩 & 에러 상태

### 로딩 스피너

```typescript
// components/ui/LoadingSpinner.tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`}></div>
    </div>
  );
}
```

### 에러 메시지

```typescript
// components/ui/ErrorMessage.tsx
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
      <p className="font-medium">오류 발생</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}
```

---

## 작업 완료 보고 템플릿

```markdown
=== UX/UI 작업 완료 보고 ===

## UX 결정사항
- 페르소나: [정의한 페르소나 요약]
- 핵심 플로우: [주요 사용자 플로우]
- IA 결정: [정보 구조 결정 사항]
- 와이어프레임: [작성한 화면 목록]

## 디자인 시스템
- 컬러: primary #3b82f6, secondary #64748b
- 디자인 토큰: CSS 변수 적용 (--color-primary 등)
- 타이포그래피: h1~h3, body, small

## UI 구현 내용
- Button: 재사용 가능한 버튼 (4가지 variant: primary, secondary, outline, ghost)
- Card: 카드 레이아웃 (CardHeader, CardTitle, CardContent)
- Input: 폼 입력 (label, error 상태 지원)
- ItemCard: 항목 카드 (이 프로젝트의 주요 엔티티)
- Pagination: 페이지네이션

## 구현 페이지
- React: /items (목록), /items/[id] (상세)
- Vanilla: pages/items/index.html, pages/items/[id].html

## 기능
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 로딩 상태 표시 (LoadingSpinner)
- 에러 핸들링 (ErrorMessage)
- 접근성 준수 (WCAG 2.1)

## 생성 파일
- components/ui/Button.tsx
- components/ui/Card.tsx
- components/ui/Input.tsx
- components/ui/Pagination.tsx
- components/ui/LoadingSpinner.tsx
- components/ui/ErrorMessage.tsx
- components/items/ItemCard.tsx
- components/layout/Navbar.tsx
- app/layout.tsx
- app/items/page.tsx (React) 또는 pages/items/index.html (Vanilla)
- app/items/[id]/page.tsx (React) 또는 pages/items/detail.html (Vanilla)

## frontend-developer 전달 사항
- 와이어프레임 파일: [경로]
- 디자인 토큰: globals.css 또는 tailwind.config.ts 참조
- 컴포넌트 가이드: 각 컴포넌트 파일 상단 주석 참조
- 사용자 플로우: [경로]

## 다음 단계
- 다크 모드 지원
- 애니메이션 추가
- 성능 최적화 (React.memo, useMemo)
- 추가 페이지 구현
```

---

**이 스킬을 사용하면 UX 경험 설계부터 접근성 높은 UI 구현까지 일관된 프로세스로 빠르게 완성할 수 있습니다.**
