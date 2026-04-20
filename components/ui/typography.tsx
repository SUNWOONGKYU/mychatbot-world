// @task S7FE4 — Composite: Typography
// 기반: S7FE1 토큰 + S7DS3 원칙 (Clarity First, Dense but Breathable)
// Display / Heading(1-6) / Text / Code
// - as prop(polymorphic) 지원
// - 한글 가독성: [word-break:keep-all] 기본 적용
// - Semantic 토큰만 소비 (text-primary, text-secondary, text-tertiary, text-link)

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────
   §1. Display — 랜딩/히어로용 초대형 헤드라인
   ────────────────────────────────────────────────────────────────────── */

const displayVariants = cva(
  [
    'font-sans font-bold tracking-tight text-text-primary',
    '[word-break:keep-all]',
  ],
  {
    variants: {
      size: {
        xl:  'text-7xl leading-none',    // 4.5rem / lh 1.0
        lg:  'text-6xl leading-[1.05]',  // 3.75rem
        md:  'text-5xl leading-[1.1]',   // 3rem
        sm:  'text-4xl leading-[1.2]',   // 2.25rem
      },
    },
    defaultVariants: { size: 'lg' },
  }
);

export interface DisplayProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof displayVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ className, size, as: Tag = 'h1', ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement>}
      className={cn(displayVariants({ size, className }))}
      {...props}
    />
  )
);
Display.displayName = 'Display';

/* ──────────────────────────────────────────────────────────────────────
   §2. Heading — h1~h6, level prop
   level별 폰트 크기·라인 높이 맵핑 (S7DS4 Typography Scale 기반)
   ────────────────────────────────────────────────────────────────────── */

const headingConfig: Record<
  1 | 2 | 3 | 4 | 5 | 6,
  string
> = {
  1: 'text-4xl font-bold   leading-[1.2]  tracking-tight',   // 2.25rem
  2: 'text-3xl font-bold   leading-[1.25] tracking-tight',   // 1.875rem
  3: 'text-2xl font-semibold leading-[1.375] tracking-[-0.015em]', // 1.5rem
  4: 'text-xl  font-semibold leading-[1.5]   tracking-[-0.01em]',  // 1.25rem
  5: 'text-lg  font-medium  leading-[1.625] tracking-[-0.005em]',  // 1.125rem
  6: 'text-base font-medium  leading-[1.625]',                // 1rem
};

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, as, ...props }, ref) => {
    const Tag = (as ?? (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'));
    return (
      <Tag
        ref={ref}
        className={cn(
          'font-sans text-text-primary [word-break:keep-all]',
          headingConfig[level],
          className
        )}
        {...props}
      />
    );
  }
);
Heading.displayName = 'Heading';

/* ──────────────────────────────────────────────────────────────────────
   §3. Text — body, caption, label 변형
   ────────────────────────────────────────────────────────────────────── */

const textVariants = cva(
  ['font-sans [word-break:keep-all]'],
  {
    variants: {
      variant: {
        body:    'text-base leading-[1.625] text-text-primary',
        lead:    'text-lg   leading-[1.625] text-text-primary',
        caption: 'text-sm   leading-[1.5]   text-text-secondary',
        label:   'text-sm   leading-[1.5]   font-medium text-text-primary',
        helper:  'text-xs   leading-[1.5]   text-text-tertiary',
        link:    'text-sm   leading-[1.5]   text-text-link underline-offset-4 hover:underline',
      },
    },
    defaultVariants: { variant: 'body' },
  }
);

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div' | 'small' | 'strong' | 'em' | 'label';
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, as: Tag = 'p', ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={cn(textVariants({ variant, className }))}
      {...props}
    />
  )
);
Text.displayName = 'Text';

/* ──────────────────────────────────────────────────────────────────────
   §4. Code — 인라인 코드 + 블록 코드
   ────────────────────────────────────────────────────────────────────── */

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  /** true이면 <pre><code> 블록 형태, false(기본)이면 인라인 <code> */
  block?: boolean;
}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, block = false, children, ...props }, ref) => {
    if (block) {
      return (
        <pre
          className={cn(
            'rounded-md bg-surface-1 border border-border-subtle px-4 py-3 overflow-x-auto',
            'text-sm font-mono leading-relaxed text-text-primary',
            '[word-break:normal]',
            className
          )}
        >
          <code ref={ref as React.Ref<HTMLElement>} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          'rounded-sm bg-surface-1 border border-border-subtle',
          'px-1.5 py-0.5 text-sm font-mono text-text-primary',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
);
Code.displayName = 'Code';

export { Display, displayVariants, Heading, Text, textVariants, Code };
