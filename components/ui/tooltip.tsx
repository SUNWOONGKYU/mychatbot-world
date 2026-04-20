// @task S7FE3 — Primitive: Tooltip (Radix)
// @task S7FE8 — Motion 토큰 연결: duration-motion-150 (--motion-150 = 150ms, 빠른 전환)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Motion Tells Direction)
// bg-surface-4 (dark chip), text-text-inverted, text-xs, 300ms delay

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-tooltip */
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

// z-index: Tooltip = 60

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipPortal = TooltipPrimitive.Portal;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-[60] overflow-hidden rounded-md px-2 py-1',
      'bg-surface-4 text-text-inverted text-xs font-medium font-sans',
      'shadow-md',
      // side-aware animations
      'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2',
      'data-[side=top]:slide-in-from-bottom-2',
      // S7FE8 Motion 토큰: duration-motion-150 (빠른 전환)
      'duration-motion-150',
      'motion-reduce:animate-none',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn('fill-surface-4', className)}
    {...props}
  />
));
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipPortal,
  TooltipArrow,
};
