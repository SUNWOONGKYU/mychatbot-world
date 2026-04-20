// @task S7FE4 — Composite: Badge
// 기반: S7FE1 Semantic 토큰 + S7DS3 원칙 (Clarity First, Tokens Are Truth)
// variant: neutral/brand/success/warning/danger/info
// style: solid/subtle
// size: sm/md
// - Primitive 직접 참조 금지 (state.xxx, text.xxx, border.xxx 토큰만 소비)

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    // Base
    'inline-flex items-center gap-1 rounded-full font-medium font-sans',
    'transition-colors duration-200 motion-reduce:transition-none',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        // neutral — surface-1 기반
        neutral: '',
        // brand — interactive-primary 계열
        brand: '',
        // Semantic State 토큰 소비
        success: '',
        warning: '',
        danger:  '',
        info:    '',
      },
      style: {
        solid:  '',
        subtle: '',
      },
      size: {
        sm: 'px-2   py-0.5 text-xs',
        md: 'px-2.5 py-1   text-sm',
      },
    },
    compoundVariants: [
      /* ── neutral ── */
      {
        variant: 'neutral',
        style:   'solid',
        className: 'bg-surface-4 text-text-inverted border border-transparent',
      },
      {
        variant: 'neutral',
        style:   'subtle',
        className: 'bg-surface-1 text-text-secondary border border-border-default',
      },
      /* ── brand ── */
      {
        variant: 'brand',
        style:   'solid',
        className: 'bg-interactive-primary text-text-inverted border border-transparent',
      },
      {
        variant: 'brand',
        style:   'subtle',
        className: 'bg-interactive-secondary text-text-link border border-ring-focus',
      },
      /* ── success ── */
      {
        variant: 'success',
        style:   'solid',
        className: 'bg-state-success-fg text-text-inverted border border-transparent',
      },
      {
        variant: 'success',
        style:   'subtle',
        className: 'bg-state-success-bg text-state-success-fg border border-state-success-border',
      },
      /* ── warning ── */
      {
        variant: 'warning',
        style:   'solid',
        className: 'bg-state-warning-fg text-text-inverted border border-transparent',
      },
      {
        variant: 'warning',
        style:   'subtle',
        className: 'bg-state-warning-bg text-state-warning-fg border border-state-warning-border',
      },
      /* ── danger ── */
      {
        variant: 'danger',
        style:   'solid',
        className: 'bg-state-danger-fg text-text-inverted border border-transparent',
      },
      {
        variant: 'danger',
        style:   'subtle',
        className: 'bg-state-danger-bg text-state-danger-fg border border-state-danger-border',
      },
      /* ── info ── */
      {
        variant: 'info',
        style:   'solid',
        className: 'bg-state-info-fg text-text-inverted border border-transparent',
      },
      {
        variant: 'info',
        style:   'subtle',
        className: 'bg-state-info-bg text-state-info-fg border border-state-info-border',
      },
    ],
    defaultVariants: {
      variant: 'neutral',
      style:   'subtle',
      size:    'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, style, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, style, size, className }))}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
