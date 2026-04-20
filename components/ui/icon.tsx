// @task S7FE4 — Composite: Icon
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default)
// lucide-react 래퍼 — 크기 토큰화, aria-hidden 기본값 true
// size: xs(12) / sm(16) / md(20) / lg(24)
// - icon prop으로 lucide 컴포넌트 직접 주입
// - label prop 있으면 role="img" + aria-label 전환 (접근성)

import * as React from 'react';
/* TODO: npm install lucide-react */
import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. 크기 맵
   ────────────────────────────────────────────────────────────────────── */

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg', number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
};

/* ──────────────────────────────────────────────────────────────────────
   §2. Icon 컴포넌트
   ────────────────────────────────────────────────────────────────────── */

export interface IconProps
  extends Omit<LucideProps, 'size' | 'ref'> {
  /** lucide-react 아이콘 컴포넌트 */
  icon: LucideIcon;
  /** 크기 토큰 — xs(12) / sm(16) / md(20) / lg(24) */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /**
   * 접근성 레이블.
   * 설정하면 aria-hidden=false + role="img" + aria-label 적용.
   * 미설정(기본)이면 aria-hidden="true" (장식 아이콘).
   */
  label?: string;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size = 'md', label, className, ...props }, ref) => {
    const px = SIZE_MAP[size];
    const isDecorative = !label;

    return (
      <IconComponent
        ref={ref}
        width={px}
        height={px}
        aria-hidden={isDecorative ? 'true' : undefined}
        role={!isDecorative ? 'img' : undefined}
        aria-label={!isDecorative ? label : undefined}
        focusable="false"
        className={cn('shrink-0', className)}
        {...props}
      />
    );
  }
);
Icon.displayName = 'Icon';

export { Icon, SIZE_MAP };
