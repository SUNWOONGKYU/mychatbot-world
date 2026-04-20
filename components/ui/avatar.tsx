// @task S7FE4 — Composite: Avatar
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default)
// 순수 구현 (Radix Avatar 옵션) — 이미지 로드 실패 시 fallback 이니셜 자동 표시
// size: sm(24px) / md(32px) / lg(40px) / xl(56px)
// - Semantic 토큰만 소비 (surface-1, border-default, text-secondary, interactive-primary)

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. Size 변형
   ────────────────────────────────────────────────────────────────────── */

const avatarSizeVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center',
    'rounded-full overflow-hidden',
    'bg-surface-1 border border-border-default',
    'font-sans font-medium select-none',
    'text-text-secondary',
  ],
  {
    variants: {
      size: {
        sm: 'h-6  w-6  text-xs',   // 24px
        md: 'h-8  w-8  text-sm',   // 32px
        lg: 'h-10 w-10 text-base', // 40px
        xl: 'h-14 w-14 text-lg',   // 56px
      },
    },
    defaultVariants: { size: 'md' },
  }
);

/* ──────────────────────────────────────────────────────────────────────
   §2. AvatarImage — 내부 이미지. 로드 실패 시 onError → fallback 표시
   ────────────────────────────────────────────────────────────────────── */

export interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onError, onLoad, onLoadingStatusChange, ...props }, ref) => {
    const handleLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
      onLoadingStatusChange?.('loaded');
      onLoad?.(e);
    };
    const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
      onLoadingStatusChange?.('error');
      onError?.(e);
    };
    return (
      <img
        ref={ref}
        className={cn('h-full w-full object-cover', className)}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

/* ──────────────────────────────────────────────────────────────────────
   §3. AvatarFallback — 이미지 없을 때 이니셜 표시
   ────────────────────────────────────────────────────────────────────── */

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center',
        'bg-interactive-secondary text-text-primary',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

/* ──────────────────────────────────────────────────────────────────────
   §4. Avatar Root — 이미지 로드 상태 관리 + fallback 전환
   ────────────────────────────────────────────────────────────────────── */

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarSizeVariants> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, children, ...props }, ref) => {
    const [imgStatus, setImgStatus] = React.useState<
      'idle' | 'loading' | 'loaded' | 'error'
    >(src ? 'loading' : 'idle');

    const showFallback = imgStatus === 'idle' || imgStatus === 'error';

    return (
      <div
        ref={ref}
        className={cn(avatarSizeVariants({ size, className }))}
        role="img"
        aria-label={alt}
        {...props}
      >
        {src && !showFallback && (
          <AvatarImage
            src={src}
            alt={alt ?? ''}
            onLoadingStatusChange={setImgStatus}
          />
        )}
        {src && imgStatus === 'loading' && (
          /* 이미지 로드 중에는 숨김 레이어로 미리 로드 */
          <AvatarImage
            src={src}
            alt={alt ?? ''}
            className="absolute opacity-0"
            onLoadingStatusChange={setImgStatus}
          />
        )}
        {showFallback && (
          <AvatarFallback>
            {fallback ?? (alt ? getInitials(alt) : '?')}
          </AvatarFallback>
        )}
        {/* 직접 자식 컴포넌트(AvatarImage/AvatarFallback) 지원 */}
        {children}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

/* ──────────────────────────────────────────────────────────────────────
   §5. 이니셜 추출 유틸
   ────────────────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export { Avatar, AvatarImage, AvatarFallback, avatarSizeVariants };
