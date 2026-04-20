// @task S7FE4 — Composite: Spinner
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Motion Tells Direction)
// SVG circular spinner — 순수 CSS animation (tailwind spin)
// size: sm / md / lg
// variant: inline(span) / block(div — 중앙정렬 컨테이너)
// - role="status" + sr-only 라벨("로딩 중") 필수
// - motion-reduce:animate-none 적용
// - Semantic 토큰 소비 (interactive-primary, text-tertiary)

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. SVG 원형 트랙 + arc
   ────────────────────────────────────────────────────────────────────── */

interface SpinnerSvgProps {
  className?: string;
  px: number;        // SVG 크기 (픽셀)
  strokeWidth: number;
}

function SpinnerSvg({ className, px, strokeWidth }: SpinnerSvgProps) {
  const r = (px - strokeWidth) / 2;
  const cx = px / 2;
  const circumference = 2 * Math.PI * r;
  const dashArray = circumference;
  const dashOffset = circumference * 0.75; // 3/4 호 (75% 채움)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className={cn('animate-spin motion-reduce:animate-none', className)}
      aria-hidden="true"
    >
      {/* Track (배경 원) */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-border-default"
      />
      {/* Arc (진행 호) */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        className="stroke-interactive-primary"
        style={{ transformOrigin: 'center' }}
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   §2. 크기·variant 매핑
   ────────────────────────────────────────────────────────────────────── */

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 16, md: 24, lg: 32 };
const STROKE_W: Record<'sm' | 'md' | 'lg', number> = { sm: 2, md: 2.5, lg: 3 };

const spinnerVariants = cva('', {
  variants: {
    variant: {
      inline: 'inline-flex items-center justify-center',
      block:  'flex items-center justify-center w-full py-6',
    },
  },
  defaultVariants: { variant: 'inline' },
});

/* ──────────────────────────────────────────────────────────────────────
   §3. Spinner
   ────────────────────────────────────────────────────────────────────── */

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  size?: 'sm' | 'md' | 'lg';
  /** sr-only 레이블 (기본: '로딩 중') */
  label?: string;
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  (
    {
      className,
      size = 'md',
      variant = 'inline',
      label = '로딩 중',
      ...props
    },
    ref
  ) => {
    const px = SIZE_PX[size];
    const sw = STROKE_W[size];
    const Tag = variant === 'block' ? 'div' : 'span';

    return (
      <Tag
        ref={ref as React.Ref<HTMLSpanElement>}
        role="status"
        className={cn(spinnerVariants({ variant }), className)}
        {...props}
      >
        <SpinnerSvg px={px} strokeWidth={sw} />
        {/* 스크린 리더용 텍스트 */}
        <span className="sr-only">{label}</span>
      </Tag>
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner, spinnerVariants };
