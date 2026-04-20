// @task S7FE3 — Primitive: Dialog (Radix Portal + focus trap)
// @task S7FE8 — Motion 토큰 연결: duration-motion-250 (--motion-250 = 250ms)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible by Default, Motion Tells Direction)
// Overlay: bg-black/60 backdrop-blur-sm / Content: bg-surface-3 shadow-xl
// Motion: fadeInScale 250ms decelerate (--ease-decelerate) | exit: 150ms accelerate

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-dialog */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

// z-index: Dialog = 80 (Drawer 70, Toast 100-viewport top, Popover 50, Tooltip 60)
// Radix Portal 기본 위치는 body 최상단 — z-[80]로 고정

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm',
      // Motion: fade in/out (S7DS5 spring)
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'motion-reduce:animate-none',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Position
        'fixed left-1/2 top-1/2 z-[80] -translate-x-1/2 -translate-y-1/2',
        'w-full max-w-lg',
        // Surface — surface-3 elevation
        'bg-surface-3 border border-border-default',
        'rounded-lg shadow-xl',
        // Spacing
        'p-6 gap-4 grid',
        // Focus ring offset — focus 자체는 Radix가 내부 요소로 이동
        'focus:outline-none',
        // Motion — zoom + fade | duration-motion-250 (S7FE8 토큰 연동)
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'duration-motion-250',
        'motion-reduce:animate-none',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col gap-1.5 text-left', className)}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight text-text-primary [word-break:keep-all]',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      'text-sm text-text-secondary leading-relaxed [word-break:keep-all]',
      className
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
