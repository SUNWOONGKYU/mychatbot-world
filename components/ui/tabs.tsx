// @task S7FE3 — Primitive: Tabs (Radix)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Clarity First)
// variants: default | underline | pills

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-tabs class-variance-authority */
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

// ═══════════════════════════════════════════════════════════════════
// Variant context — List + Trigger 공유
// ═══════════════════════════════════════════════════════════════════
type TabsVariant = 'default' | 'underline' | 'pills';
const TabsVariantContext = React.createContext<TabsVariant>('default');

const tabsListVariants = cva(
  ['inline-flex items-center text-text-secondary font-sans'],
  {
    variants: {
      variant: {
        default: [
          'h-10 rounded-md bg-surface-1 p-1 gap-1',
        ],
        underline: [
          'h-10 border-b border-border-default gap-4 w-full',
        ],
        pills: [
          'h-auto rounded-full bg-surface-1 p-1 gap-1',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap',
    'text-sm font-medium font-sans',
    'transition-all duration-200 motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'h-8 px-3 rounded-sm',
          'data-[state=active]:bg-surface-2 data-[state=active]:text-text-primary',
          'data-[state=active]:shadow-sm',
        ],
        underline: [
          'h-10 px-1 border-b-2 border-transparent -mb-px',
          'data-[state=active]:border-interactive-primary data-[state=active]:text-text-primary',
          'hover:text-text-primary',
        ],
        pills: [
          'h-8 px-4 rounded-full',
          'data-[state=active]:bg-surface-2 data-[state=active]:text-text-primary',
          'data-[state=active]:shadow-sm',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsVariantContext.Provider value={variant ?? 'default'}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  </TabsVariantContext.Provider>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 text-text-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
