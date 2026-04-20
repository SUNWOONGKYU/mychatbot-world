// @task S7FE2 — Primitive: Label (Radix)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Korean First Citizen)

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-label class-variance-authority */
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva([
  'text-sm font-medium font-sans text-text-primary leading-none',
  'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
]);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };
