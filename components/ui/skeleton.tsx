// @task S7FE4 — Composite: Skeleton
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Motion Tells Direction)
// 텍스트(height text 기반) / 원형(circle prop) / 직사각형
// animate-pulse + motion-reduce:animate-none
// aria-busy="true" — 콘텐츠 로딩 중 상태 전달
// - Semantic 토큰 소비 (surface-1, border-subtle)

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. Skeleton 기본 variants
   ────────────────────────────────────────────────────────────────────── */

const skeletonVariants = cva(
  [
    'block rounded-md',
    'bg-surface-1 border border-border-subtle',
    'animate-pulse motion-reduce:animate-none',
  ],
  {
    variants: {
      /**
       * text: 텍스트 라인 높이 기반 (line-height 기반 h 자동)
       * rect: 명시적 w/h 지정
       * circle: 원형 (rounded-full)
       */
      variant: {
        text:   'h-4 w-full',
        rect:   '',
        circle: 'rounded-full',
      },
    },
    defaultVariants: { variant: 'rect' },
  }
);

/* ──────────────────────────────────────────────────────────────────────
   §2. Skeleton 컴포넌트
   ────────────────────────────────────────────────────────────────────── */

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * circle shorthand — variant="circle"과 동일 효과.
   * w/h를 className으로 전달해야 함.
   * 예: <Skeleton circle className="h-10 w-10" />
   */
  circle?: boolean;
}

const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(
  ({ className, variant, circle, ...props }, ref) => {
    const resolvedVariant = circle ? 'circle' : (variant ?? 'rect');
    return (
      <span
        ref={ref}
        aria-busy="true"
        aria-live="polite"
        className={cn(skeletonVariants({ variant: resolvedVariant }), className)}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

/* ──────────────────────────────────────────────────────────────────────
   §3. SkeletonText — 여러 줄 텍스트 스켈레톤
   lines prop으로 줄 수 지정, 마지막 줄 w-3/4 처리
   ────────────────────────────────────────────────────────────────────── */

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ className, lines = 3, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2', className)}
      aria-busy="true"
      aria-live="polite"
      {...props}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
);
SkeletonText.displayName = 'SkeletonText';

/* ──────────────────────────────────────────────────────────────────────
   §4. SkeletonAvatar — 원형 스켈레톤 (Avatar 대응)
   ────────────────────────────────────────────────────────────────────── */

const AVATAR_SIZE: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'h-6  w-6',
  md: 'h-8  w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

export interface SkeletonAvatarProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SkeletonAvatar = React.forwardRef<HTMLSpanElement, SkeletonAvatarProps>(
  ({ className, size = 'md', ...props }, ref) => (
    <Skeleton
      ref={ref}
      circle
      className={cn(AVATAR_SIZE[size], className)}
      {...props}
    />
  )
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

export { Skeleton, SkeletonText, SkeletonAvatar, skeletonVariants };
