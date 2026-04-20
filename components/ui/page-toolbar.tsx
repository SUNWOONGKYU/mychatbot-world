// @task S7FE4 — Composite: PageToolbar
// 기반: S7FE1 토큰 + S7DS3 원칙 (Clarity First, Dense but Breathable)
// 구조: title + breadcrumb + action 버튼 정렬
// - flex justify-between 반응형 wrap
// - Breadcrumb 세퍼레이터 자동 삽입 (React.Children 기반)
// - Semantic 토큰만 소비 (surface-2, border-subtle, text-primary/secondary/link)

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. Breadcrumb 서브 컴포넌트
   ────────────────────────────────────────────────────────────────────── */

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, children, ...props }, ref) => {
    // children 사이에 세퍼레이터 자동 삽입
    const items = React.Children.toArray(children).filter(Boolean);
    const withSeparators = items.flatMap((child, i) =>
      i < items.length - 1
        ? [
            child,
            <span
              key={`sep-${i}`}
              className="mx-1.5 text-text-tertiary"
              aria-hidden="true"
            >
              /
            </span>,
          ]
        : [child]
    );

    return (
      <nav
        ref={ref}
        aria-label="이동 경로"
        className={cn('flex items-center flex-wrap gap-0', className)}
        {...props}
      >
        <ol className="flex items-center flex-wrap text-sm text-text-secondary gap-0">
          {withSeparators.map((node, i) => (
            <li key={i} className="flex items-center">
              {node}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = 'Breadcrumb';

/* ──────────────────────────────────────────────────────────────────────
   §2. BreadcrumbItem
   ────────────────────────────────────────────────────────────────────── */

export interface BreadcrumbItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** true이면 현재 페이지 (링크 없음, aria-current="page") */
  current?: boolean;
}

const BreadcrumbItem = React.forwardRef<HTMLAnchorElement, BreadcrumbItemProps>(
  ({ className, current = false, href, children, ...props }, ref) => {
    if (current) {
      return (
        <span
          aria-current="page"
          className={cn(
            'font-medium text-text-primary [word-break:keep-all]',
            className
          )}
        >
          {children}
        </span>
      );
    }
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          'text-text-link hover:underline underline-offset-4',
          'transition-colors duration-150 [word-break:keep-all]',
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

/* ──────────────────────────────────────────────────────────────────────
   §3. PageToolbar
   ────────────────────────────────────────────────────────────────────── */

export interface PageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 페이지 제목 */
  title: React.ReactNode;
  /** breadcrumb 슬롯 — Breadcrumb 컴포넌트 권장 */
  breadcrumb?: React.ReactNode;
  /** 오른쪽 액션 버튼 슬롯 — Button 컴포넌트 권장 */
  actions?: React.ReactNode;
  /**
   * 하단 구분선 표시 여부
   */
  divider?: boolean;
}

const PageToolbar = React.forwardRef<HTMLDivElement, PageToolbarProps>(
  (
    {
      className,
      title,
      breadcrumb,
      actions,
      divider = false,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        'w-full bg-surface-2',
        divider && 'border-b border-border-subtle',
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {/* ── 왼쪽: breadcrumb + title ── */}
        <div className="flex min-w-0 flex-col gap-1">
          {breadcrumb && (
            <div className="text-sm text-text-secondary">{breadcrumb}</div>
          )}
          <h1
            className={cn(
              'truncate text-xl font-semibold font-sans text-text-primary',
              '[word-break:keep-all] tracking-tight leading-tight'
            )}
          >
            {title}
          </h1>
        </div>

        {/* ── 오른쪽: action 버튼 슬롯 ── */}
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
);
PageToolbar.displayName = 'PageToolbar';

export { PageToolbar, Breadcrumb, BreadcrumbItem };
