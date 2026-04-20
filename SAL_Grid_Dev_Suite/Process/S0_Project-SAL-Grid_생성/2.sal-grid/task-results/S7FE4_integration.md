# S7FE4 통합 보고서: Composite 컴포넌트 9종

- **Task ID**: S7FE4
- **Task Name**: Composite 컴포넌트 (Typography/Badge/Avatar/Icon/Spinner/Skeleton + DataTable/EmptyState/Toolbar)
- **완료일**: 2026-04-20
- **담당 Agent**: frontend-developer-core

---

## 1. 개요 (9종 요약 + 총 라인 수)

| # | 파일 | 분류 | 라인 수 | 핵심 기능 |
|---|------|------|--------:|----------|
| 1 | `components/ui/typography.tsx` | 표현 | 173 | Display/Heading(1-6)/Text/Code, CVA, as prop |
| 2 | `components/ui/badge.tsx` | 표현 | 132 | CVA 6variant × 2style × 2size |
| 3 | `components/ui/avatar.tsx` | 표현 | 158 | 이미지+fallback 이니셜, 4 size |
| 4 | `components/ui/icon.tsx` | 표현 | 64 | lucide-react 래퍼, 4 size, aria-hidden 기본 |
| 5 | `components/ui/spinner.tsx` | 표현 | 126 | SVG circular, role="status", motion-reduce |
| 6 | `components/ui/skeleton.tsx` | 표현 | 128 | text/rect/circle, animate-pulse, aria-busy |
| 7 | `components/ui/data-table.tsx` | 구조 | 443 | TanStack Table v8, 정렬/필터/페이지네이션 |
| 8 | `components/ui/empty-state.tsx` | 구조 | 109 | icon+title+desc+CTA, 3 size |
| 9 | `components/ui/page-toolbar.tsx` | 구조 | 165 | title+breadcrumb+action, 반응형 |
| **합계** | — | — | **1,498** | — |

---

## 2. 컴포넌트별 설계 의도 (variant/prop/Semantic 토큰 매핑)

### 2-1. Typography (`typography.tsx`)

| 컴포넌트 | 주요 prop | 토큰 소비 |
|----------|-----------|----------|
| `Display` | `size` (xl/lg/md/sm), `as` | `text-text-primary` |
| `Heading` | `level` (1-6), `as` | `text-text-primary` |
| `Text` | `variant` (body/lead/caption/label/helper/link), `as` | `text-text-primary/secondary/tertiary/link` |
| `Code` | `block` (boolean) | `bg-surface-1`, `border-border-subtle` |

- `[word-break:keep-all]` 한글 줄바꿈 전 컴포넌트에 기본 적용
- `as` prop(polymorphic)으로 의미론적 HTML 태그 자유 선택
- 타입 스케일은 tailwind.config의 fontSize 값 직접 소비 (7xl ~ xs)

### 2-2. Badge (`badge.tsx`)

| variant | solid | subtle |
|---------|-------|--------|
| neutral | `bg-surface-4 text-text-inverted` | `bg-surface-1 text-text-secondary border-border-default` |
| brand | `bg-interactive-primary text-text-inverted` | `bg-interactive-secondary text-text-link` |
| success | `bg-state-success-fg text-text-inverted` | `bg-state-success-bg text-state-success-fg border-state-success-border` |
| warning | `bg-state-warning-fg text-text-inverted` | `bg-state-warning-bg text-state-warning-fg border-state-warning-border` |
| danger | `bg-state-danger-fg text-text-inverted` | `bg-state-danger-bg text-state-danger-fg border-state-danger-border` |
| info | `bg-state-info-fg text-text-inverted` | `bg-state-info-bg text-state-info-fg border-state-info-border` |

### 2-3. Avatar (`avatar.tsx`)

- `imgStatus` state (idle→loading→loaded/error)로 fallback 전환 제어
- `src` 없으면 즉시 fallback, 로드 실패시 onError→error→fallback
- `fallback` prop 없으면 `alt` 문자열에서 이니셜 자동 추출 (`getInitials()`)
- 토큰: `bg-surface-1 border-border-default` (컨테이너), `bg-interactive-secondary text-text-primary` (fallback)

### 2-4. Icon (`icon.tsx`)

- `icon` prop: lucide-react의 `LucideIcon` 타입 (컴포넌트 직접 주입)
- `label` 없으면 `aria-hidden="true"` (장식 아이콘), 있으면 `role="img" aria-label`
- `SIZE_MAP` export로 외부에서 크기 상수 재사용 가능

### 2-5. Spinner (`spinner.tsx`)

- SVG `strokeDasharray/strokeDashoffset`로 75% 호(arc) 구현
- `stroke-border-default` (트랙) + `stroke-interactive-primary` (호) 소비
- `role="status"` + `<span className="sr-only">로딩 중</span>` — WCAG 4.1.3
- `motion-reduce:animate-none` — prefers-reduced-motion 대응

### 2-6. Skeleton (`skeleton.tsx`)

- `variant`: text(h-4 w-full) / rect(명시적 크기) / circle(rounded-full)
- `circle` boolean prop = `variant="circle"` shorthand
- `aria-busy="true" aria-live="polite"` — 로딩 상태 스크린리더 전달
- `SkeletonText`: lines prop, 마지막 줄 `w-3/4` 처리
- `SkeletonAvatar`: Avatar size 대응 원형 스켈레톤

### 2-7. DataTable (`data-table.tsx`)

TanStack Table 설계 의도 → 섹션 3 참조.

- 짝수 행: `bg-surface-2`, 홀수 행: `bg-surface-1`, hover: `bg-interactive-secondary`
- 헤더: `bg-surface-1 border-b border-border-default text-text-secondary`
- 셀: `text-text-primary`
- 빈 상태: `text-text-tertiary` 인라인 메시지 or `emptyMessage` slot
- aria-sort 속성으로 정렬 방향 스크린리더 전달

### 2-8. EmptyState (`empty-state.tsx`)

- `icon` 슬롯: `bg-interactive-secondary text-text-tertiary` 원형 컨테이너 (Icon 컴포넌트와 연계)
- `size`: sm(py-8) / md(py-12) / lg(py-20)
- `action` 슬롯: Button 컴포넌트 1개 또는 복수 배치 가능

### 2-9. PageToolbar (`page-toolbar.tsx`)

- `flex flex-wrap items-start justify-between gap-3` — 반응형 자동 wrap
- `Breadcrumb` → `BreadcrumbItem` 세퍼레이터 자동 삽입 (`React.Children.toArray`)
- `current` prop: `aria-current="page"` + 비링크 스타일
- `divider` prop: `border-b border-border-subtle` 옵션 하단 구분선

---

## 3. TanStack Table 도입 근거 (DataTable)

| 항목 | 선택 이유 |
|------|-----------|
| Headless 설계 | UI 토큰과 100% 완전 분리 가능 — Semantic 토큰 준수 용이 |
| React 18 서버 컴포넌트 호환 | `'use client'` 경계를 DataTable 단독으로 제한 가능 |
| TypeScript 제네릭 | `ColumnDef<TData>` 제네릭으로 타입 안전 열 정의 |
| 10k행 성능 | 가상화(TanStack Virtual) 추후 연결 가능한 구조 |
| 부분 기능 활성화 | getSortedRowModel/getFilteredRowModel을 prop으로 on/off — 불필요 번들 배제 |
| 생태계 | 업계 표준, `@tanstack/react-table` v8 (MIT) |

`'use client'` 지시문은 `data-table.tsx` 상단에 명시. 서버 컴포넌트 페이지에서는 이 파일만 client boundary가 된다.

---

## 4. Typography 타입 스케일 (Display/H1-H6/Text/Code)

| 레벨 | 컴포넌트 | font-size | line-height | font-weight |
|------|----------|-----------|-------------|-------------|
| Display XL | `<Display size="xl">` | 4.5rem (7xl) | 1.0 | 700 |
| Display LG | `<Display size="lg">` | 3.75rem (6xl) | 1.05 | 700 |
| Display MD | `<Display size="md">` | 3rem (5xl) | 1.1 | 700 |
| Display SM | `<Display size="sm">` | 2.25rem (4xl) | 1.2 | 700 |
| H1 | `<Heading level={1}>` | 2.25rem (4xl) | 1.2 | 700 |
| H2 | `<Heading level={2}>` | 1.875rem (3xl) | 1.25 | 700 |
| H3 | `<Heading level={3}>` | 1.5rem (2xl) | 1.375 | 600 |
| H4 | `<Heading level={4}>` | 1.25rem (xl) | 1.5 | 600 |
| H5 | `<Heading level={5}>` | 1.125rem (lg) | 1.625 | 500 |
| H6 | `<Heading level={6}>` | 1rem (base) | 1.625 | 500 |
| Body | `<Text variant="body">` | 1rem | 1.625 | 400 |
| Lead | `<Text variant="lead">` | 1.125rem | 1.625 | 400 |
| Caption | `<Text variant="caption">` | 0.875rem | 1.5 | 400 |
| Label | `<Text variant="label">` | 0.875rem | 1.5 | 500 |
| Helper | `<Text variant="helper">` | 0.75rem | 1.5 | 400 |
| Link | `<Text variant="link">` | 0.875rem | 1.5 | 400 |
| Code (인라인) | `<Code>` | 0.875rem | - | 400 (mono) |
| Code (블록) | `<Code block>` | 0.875rem | relaxed | 400 (mono) |

---

## 5. 접근성 대응

| 컴포넌트 | 접근성 처리 |
|----------|-----------|
| Icon | `aria-hidden="true"` (기본, 장식). `label` prop 있으면 `role="img" aria-label` |
| Spinner | `role="status"` + `<span className="sr-only">로딩 중</span>` (변경 가능) |
| Skeleton | `aria-busy="true" aria-live="polite"` |
| DataTable | `aria-sort` (정렬 방향), `aria-label` (필터 입력), `scope="col"` |
| Breadcrumb | `aria-label="이동 경로"`, `aria-current="page"` (현재 항목) |
| Avatar | `role="img" aria-label` (alt prop 소비) |
| PageToolbar | 제목을 `<h1>` semantic 태그로 렌더링 |

---

## 6. S7FE2/S7FE3 컴포넌트와의 연계

| S7FE4 컴포넌트 | 연계 대상 | 연계 방식 |
|----------------|-----------|-----------|
| EmptyState | Icon (S7FE4) + Button (S7FE2) | icon slot + action slot에 직접 주입 |
| DataTable | Spinner (S7FE4) | 로딩 상태 overlay로 연계 가능 |
| PageToolbar | Button (S7FE2) | actions slot에 Button primary/secondary 주입 |
| Avatar | Skeleton (S7FE4) | SkeletonAvatar로 로딩 상태 대응 |
| Badge | Card (S7FE3) | CardHeader 내 상태 뱃지로 배치 |
| Typography | Dialog (S7FE3) | DialogTitle → Heading, DialogDescription → Text 대체 가능 |

---

## 7. 설치 명령

```bash
npm install lucide-react @radix-ui/react-avatar @tanstack/react-table
```

| 패키지 | 사용 컴포넌트 | 현재 상태 |
|--------|-------------|----------|
| `lucide-react` | icon.tsx | TODO — 설치 후 import 주석 해제 |
| `@radix-ui/react-avatar` | (옵션) avatar.tsx는 순수 구현으로 완성 | 선택적 |
| `@tanstack/react-table` | data-table.tsx | TODO — 설치 필수 |
| `class-variance-authority` | badge/spinner/skeleton/typography | S7FE2에서 이미 가정됨 |

> avatar.tsx는 순수 구현 완성 — `@radix-ui/react-avatar`는 선택적 의존성.
> data-table.tsx는 `@tanstack/react-table` 없이는 컴파일 불가 — 필수 설치 필요.

---

## 8. S7FE5 페이지 진입 시 사용 예시

```tsx
// S7FE5 페이지 예시 — 일반적인 목록 페이지 패턴
import { PageToolbar, Breadcrumb, BreadcrumbItem } from '@/components/ui/page-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Heading, Text } from '@/components/ui/typography';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { SkeletonText } from '@/components/ui/skeleton';
import { PlusIcon, UsersIcon } from 'lucide-react';

// 로딩 상태
if (isLoading) return <Spinner variant="block" size="lg" />;

// 페이지 구조
return (
  <>
    <PageToolbar
      title="사용자 관리"
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbItem href="/">홈</BreadcrumbItem>
          <BreadcrumbItem current>사용자 관리</BreadcrumbItem>
        </Breadcrumb>
      }
      actions={
        <Button size="sm">
          <Icon icon={PlusIcon} size="sm" />
          사용자 추가
        </Button>
      }
    />
    {data.length === 0 ? (
      <EmptyState
        icon={<Icon icon={UsersIcon} size="lg" />}
        title="등록된 사용자가 없습니다"
        description="새 사용자를 추가해서 시작하세요."
        action={<Button>사용자 추가</Button>}
      />
    ) : (
      <DataTable columns={columns} data={data} />
    )}
  </>
);
```

---

## 9. Blockers (외부 패키지 설치 대기)

| Blocker | 영향 컴포넌트 | 해결 방법 |
|---------|-------------|----------|
| `@tanstack/react-table` 미설치 | `data-table.tsx` 컴파일 오류 | `npm install @tanstack/react-table` 후 해제 |
| `lucide-react` 미설치 | `icon.tsx` 컴파일 오류 | `npm install lucide-react` 후 해제 (이미 설치된 경우 확인 필요) |

나머지 7개 컴포넌트 (typography, badge, avatar, spinner, skeleton, empty-state, page-toolbar)는 `class-variance-authority`와 `@/lib/utils` 외 추가 의존성 없음.
