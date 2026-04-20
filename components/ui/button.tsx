// @task S7FE2 — Primitive: Button
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Clarity First, Dense but Breathable)
// CVA 기반 variant/size 시스템, Radix Slot asChild 패턴

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-slot class-variance-authority */
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    // Base — 8pt 그리드, Pretendard(font-sans), 의미 전달용 트랜지션
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'font-medium font-sans',
    'transition-colors duration-200',
    // Focus ring — S7DS3 원칙 #5 Accessible (WCAG 2.4.7)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2',
    'focus-visible:ring-offset-surface-0',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // SVG 아이콘 기본 크기
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4',
    // Motion 축소 대응
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-interactive-primary text-text-inverted',
          'hover:bg-interactive-primary-hover',
          'active:bg-interactive-primary-active',
        ],
        primary: [
          'bg-interactive-primary text-text-inverted',
          'hover:bg-interactive-primary-hover',
          'active:bg-interactive-primary-active',
        ],
        secondary: [
          'bg-interactive-secondary text-text-primary',
          'hover:bg-interactive-secondary-hover',
        ],
        destructive: [
          'bg-interactive-destructive text-text-inverted',
          'hover:bg-interactive-destructive-hover',
        ],
        outline: [
          'border border-border-default bg-transparent text-text-primary',
          'hover:bg-surface-1 hover:border-border-strong',
        ],
        ghost: [
          'bg-transparent text-text-primary',
          'hover:bg-surface-1',
        ],
        link: [
          'bg-transparent text-text-link underline-offset-4',
          'hover:underline',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
