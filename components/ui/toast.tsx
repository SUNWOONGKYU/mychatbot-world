// @task S7FE3 — Primitive: Toast (Radix)
// @task S7FE8 — Motion 토큰 연결: duration-motion-250 (--motion-250 = 250ms)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Motion Tells Direction, Clarity First)
// variants: default | success | warning | danger | info
// Viewport: fixed bottom-right, z-[100]

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-toast class-variance-authority */
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed z-[100] flex max-h-screen w-full flex-col-reverse p-4 gap-2',
      // bottom-right on desktop, bottom-full on mobile
      'bottom-0 right-0',
      'sm:top-auto sm:right-0 sm:flex-col',
      'md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center justify-between',
    'gap-3 overflow-hidden rounded-md border p-4 pr-8 shadow-lg font-sans',
    'transition-all',
    // Radix state animations — slide in from right / swipe to close
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
    'data-[state=closed]:slide-out-to-right-full',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=end]:animate-out',
    // S7FE8 Motion 토큰: duration-motion-250
    'duration-motion-250',
    'motion-reduce:animate-none motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        default: 'bg-surface-2 border-border-default text-text-primary',
        success:
          'bg-state-success-bg border-state-success-border text-state-success-fg',
        warning:
          'bg-state-warning-bg border-state-warning-border text-state-warning-fg',
        danger:
          'bg-state-danger-bg border-state-danger-border text-state-danger-fg',
        info:
          'bg-state-info-bg border-state-info-border text-state-info-fg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md',
      'border border-border-default bg-transparent px-3 text-sm font-medium',
      'transition-colors hover:bg-surface-1',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
      'disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 opacity-70',
      'transition-opacity hover:opacity-100',
      'focus:outline-none focus:ring-2 focus:ring-ring-focus',
      className
    )}
    toast-close=""
    aria-label="닫기"
    {...props}
  >
    {/* minimal X icon (SVG) — avoid adding new icon dep */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      'text-sm font-semibold [word-break:keep-all]',
      className
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      'text-sm opacity-90 leading-relaxed [word-break:keep-all]',
      className
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
};
