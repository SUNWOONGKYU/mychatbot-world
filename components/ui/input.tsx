// @task S7FE2 — Primitive: Input
// 기반: S7FE1 토큰 + S7DS3 원칙 (Tokens Are Truth, Accessible by Default)
// CVA variant(default/error/success) + size(sm/md/lg)

'use client';

import * as React from 'react';
/* TODO: npm install class-variance-authority */
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-surface-1 font-sans',
    'text-text-primary placeholder:text-text-tertiary',
    'transition-colors duration-200',
    // File input
    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary',
    // Focus
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
    'focus-visible:border-border-strong',
    // Disabled
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Invalid (aria-invalid=true)
    'aria-[invalid=true]:border-state-danger-border',
    'aria-[invalid=true]:focus-visible:ring-state-danger-border',
    // Motion
    'motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        default: 'border-border-default',
        error: [
          'border-state-danger-border',
          'focus-visible:ring-state-danger-border',
        ],
        success: [
          'border-state-success-border',
          'focus-visible:ring-state-success-border',
        ],
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// HTML input의 size 속성과 충돌 회피 → Omit
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
