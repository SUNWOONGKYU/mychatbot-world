// @task S7FE3 — Primitive: Accordion (Radix)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Motion Tells Direction)
// single | multiple type 지원, chevron rotation, accordion-down animation

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-accordion */
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-border-subtle font-sans', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

// Chevron icon (inline SVG — no new icon dep)
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-4 w-4 shrink-0', className)}
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 text-sm font-medium font-sans',
        'text-text-primary text-left [word-break:keep-all]',
        'transition-all duration-200 motion-reduce:transition-none',
        'hover:bg-surface-1 hover:underline',
        '[&[data-state=open]>svg]:rotate-180',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="text-text-secondary transition-transform duration-200 motion-reduce:transition-none" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-sm text-text-secondary',
      'data-[state=closed]:animate-accordion-up',
      'data-[state=open]:animate-accordion-down',
      'motion-reduce:animate-none',
    )}
    {...props}
  >
    <div className={cn('pb-4 pt-0 [word-break:keep-all]', className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
