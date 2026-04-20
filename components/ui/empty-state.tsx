// @task S7FE4 — Composite: EmptyState
// 기반: S7FE1 토큰 + S7DS3 원칙 (Clarity First, Dense but Breathable)
// 구조: icon 슬롯 + title + description + CTA(Action) 버튼 슬롯
// - 중앙 정렬 + padding
// - Semantic 토큰만 소비 (surface-1, border-subtle, text-primary/secondary/tertiary)
// - Icon/Button 컴포넌트와 연계 사용 권장

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. EmptyState
   ────────────────────────────────────────────────────────────────────── */

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 상단 아이콘 슬롯 (Icon 컴포넌트 or 임의 ReactNode) */
  icon?: React.ReactNode;
  /** 주요 제목 */
  title: string;
  /** 부가 설명 텍스트 */
  description?: React.ReactNode;
  /** CTA 버튼 슬롯 (Button 컴포넌트 권장) */
  action?: React.ReactNode;
  /**
   * 크기 — sm: 컴팩트 (카드 내부), md(기본): 표준, lg: 전체 화면
   */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { wrapper: 'py-8  px-4',  icon: 'h-10 w-10', title: 'text-sm',  desc: 'text-xs'  },
  md: { wrapper: 'py-12 px-6',  icon: 'h-12 w-12', title: 'text-base', desc: 'text-sm' },
  lg: { wrapper: 'py-20 px-8',  icon: 'h-16 w-16', title: 'text-lg',  desc: 'text-base' },
} as const;

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      action,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const cfg = SIZE_CONFIG[size];

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          cfg.wrapper,
          className
        )}
        {...props}
      >
        {/* ── 아이콘 슬롯 ── */}
        {icon && (
          <div
            className={cn(
              'mb-4 flex items-center justify-center rounded-full',
              'bg-interactive-secondary text-text-tertiary',
              cfg.icon
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}

        {/* ── 제목 ── */}
        <h3
          className={cn(
            'font-semibold font-sans text-text-primary [word-break:keep-all]',
            cfg.title
          )}
        >
          {title}
        </h3>

        {/* ── 설명 ── */}
        {description && (
          <p
            className={cn(
              'mt-1.5 max-w-sm font-sans text-text-secondary leading-relaxed [word-break:keep-all]',
              cfg.desc
            )}
          >
            {description}
          </p>
        )}

        {/* ── CTA 슬롯 ── */}
        {action && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {action}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
