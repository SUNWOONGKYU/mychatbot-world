// @task S7FE3 — Primitive: Drawer (Side Sheet / Mobile Bottom Sheet)
// @task S7FE8 — Motion 토큰 연결: duration-motion-350 (--motion-350 = 350ms, 페이지 전환급)
// 기반: S7FE1 토큰 + Radix Dialog 기반 커스텀 (side variant)
// side: bottom (모바일 기본) | right (데스크톱 기본) | left
// Motion: slideInRight/Bottom 350ms decelerate | exit: 250ms accelerate

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-dialog (Drawer는 Dialog 재활용) */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// z-index: Drawer = 70 (Dialog 80보다 낮지만 일반 콘텐츠 위)

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'motion-reduce:animate-none',
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = 'DrawerOverlay';

const drawerVariants = cva(
  [
    'fixed z-[70] bg-surface-3 border-border-default shadow-xl',
    'flex flex-col gap-4',
    'focus:outline-none',
    // S7FE8 Motion 토큰: duration-motion-350 연동
    'duration-motion-350',
    'motion-reduce:animate-none',
  ],
  {
    variants: {
      side: {
        bottom: [
          'inset-x-0 bottom-0 border-t',
          'rounded-t-lg',
          'max-h-[85vh] p-6',
          // Motion: slide up from bottom
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
        ],
        top: [
          'inset-x-0 top-0 border-b',
          'rounded-b-lg',
          'max-h-[85vh] p-6',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-top',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top',
        ],
        left: [
          'inset-y-0 left-0 border-r',
          'h-full w-3/4 max-w-sm p-6',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-left',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left',
        ],
        right: [
          'inset-y-0 right-0 border-l',
          'h-full w-3/4 max-w-sm p-6',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-right',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
        ],
      },
    },
    defaultVariants: {
      side: 'bottom',
    },
  }
);

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ side = 'bottom', className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(drawerVariants({ side }), className)}
      {...props}
    >
      {/* drag handle (bottom only) */}
      {side === 'bottom' && (
        <div
          aria-hidden
          className="mx-auto h-1.5 w-12 rounded-full bg-border-default"
        />
      )}
      {children}
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col gap-1.5 text-left', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 pt-4', className)}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
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
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = React.forwardRef<
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
DrawerDescription.displayName = 'DrawerDescription';

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
