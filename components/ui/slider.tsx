// @task S7FE2 — Primitive: Slider (Radix)
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible, Clarity)
// Root / Track / Range / Thumb 구조, range 슬라이더 지원

'use client';

import * as React from 'react';
/* TODO: npm install @radix-ui/react-slider */
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, defaultValue, value, ...props }, ref) => {
  // Thumb 수를 value/defaultValue 길이에 맞춰 자동 렌더링 (range 지원)
  const _values = React.useMemo<number[]>(() => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(defaultValue)) return defaultValue;
    return [0];
  }, [value, defaultValue]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      defaultValue={defaultValue}
      value={value}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          'relative h-1.5 w-full grow overflow-hidden rounded-full',
          'bg-surface-2'
        )}
      >
        <SliderPrimitive.Range
          className={cn('absolute h-full bg-interactive-primary')}
        />
      </SliderPrimitive.Track>
      {_values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            'block h-4 w-4 rounded-full',
            'border-2 border-interactive-primary bg-surface-0',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
            'disabled:pointer-events-none disabled:opacity-50',
            'motion-reduce:transition-none'
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
