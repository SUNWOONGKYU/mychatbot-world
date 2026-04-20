// @task S7FE2 — Primitive: Textarea
// 기반: S7FE1 토큰 + S7DS3 원칙 (Tokens Are Truth, Accessible, Korean First Citizen)
// CVA variant(default/error/success), min-h 80px, resize-y

'use client';

import * as React from 'react';
/* TODO: npm install class-variance-authority */
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  [
    'flex w-full rounded-md border bg-surface-1 px-3 py-2',
    'text-sm font-sans text-text-primary placeholder:text-text-tertiary',
    'min-h-[80px] resize-y',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
    'focus-visible:border-border-strong',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-[invalid=true]:border-state-danger-border',
    'aria-[invalid=true]:focus-visible:ring-state-danger-border',
    // 한국어 가독성 — Korean First Citizen
    '[word-break:keep-all]',
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
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
