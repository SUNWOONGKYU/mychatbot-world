// @task S7FE2 — Primitive: RadioGroup (Radix)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible, Clarity)

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-radio-group */
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn('grid gap-2', className)}
      {...props}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full',
        'border border-border-default bg-surface-1 text-interactive-primary',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
        'data-[state=checked]:border-interactive-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-state-danger-border',
        'motion-reduce:transition-none',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="block h-2 w-2 rounded-full bg-interactive-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
