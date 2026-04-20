// @task S7FE2 — Primitive: Checkbox (Radix)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible, Clarity)
// checked / unchecked / indeterminate 지원

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-checkbox */
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-4 w-4 shrink-0 items-center justify-center',
      'rounded-sm border border-border-default bg-surface-1',
      'transition-colors duration-200',
      // Focus
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
      // Checked & Indeterminate
      'data-[state=checked]:bg-interactive-primary data-[state=checked]:border-interactive-primary',
      'data-[state=checked]:text-text-inverted',
      'data-[state=indeterminate]:bg-interactive-primary data-[state=indeterminate]:border-interactive-primary',
      'data-[state=indeterminate]:text-text-inverted',
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Invalid
      'aria-[invalid=true]:border-state-danger-border',
      'motion-reduce:transition-none',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      {props.checked === 'indeterminate' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 10a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
