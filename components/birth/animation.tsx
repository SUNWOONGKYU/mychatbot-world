/**
 * @task S2FE5 - Birth 페이지 React 전환
 * @file components/birth/animation.tsx
 * @description 코코봇 생성 완료 순서형 fade-in 애니메이션 컨테이너
 *
 * 애니메이션 순서:
 *  1) 코코봇 아이콘 fade-in (step 1, delay 0ms)
 *  2) "탄생했습니다!" 텍스트 (step 2, delay 400ms)
 *  3) URL 표시 (step 3, delay 800ms)
 *  4) QR코드 (step 4, delay 1200ms)
 *  5) 공유 버튼 (step 5, delay 1600ms)
 *
 * CSS keyframes: animate-fade-in-up (globals.css에 등록 필요)
 * Tailwind 커스텀 animation 토큰 사용
 */
'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

/** 단일 애니메이션 단계 Props */
interface AnimationStepProps {
  /** 이 단계가 표시될 순서 번호 (1-based) */
  step: number;
  /** 현재 활성화된 단계 수 */
  activeStep: number;
  /** 지연 ms (선택적, step 기반 계산 대신 직접 지정) */
  delayMs?: number;
  /** 자식 요소 */
  children: React.ReactNode;
  /** 추가 className */
  className?: string;
}

/**
 * AnimationStep — 개별 단계 fade-in-up 래퍼
 * activeStep >= step 이면 표시 (opacity-100 translate-y-0)
 */
export function AnimationStep({
  step,
  activeStep,
  children,
  className,
}: AnimationStepProps) {
  const isVisible = activeStep >= step;

  return (
    <div
      className={clsx(
        'transition-all duration-700 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none',
        className,
      )}
      aria-hidden={!isVisible}
    >
      {children}
    </div>
  );
}

/** BirthAnimation 컴포넌트 Props */
export interface BirthAnimationProps {
  /** 렌더링할 각 단계의 콘텐츠 배열 (인덱스 0 = step 1) */
  steps: React.ReactNode[];
  /** 단계 간 딜레이 ms (기본: 400) */
  stepDelayMs?: number;
  /** 전체 wrapper className */
  className?: string;
}

/**
 * BirthAnimation — 순서형 fade-in 오케스트레이터
 *
 * steps 배열을 받아 stepDelayMs 간격으로 순차 표시.
 * 각 step은 AnimationStep으로 래핑되어 fade-in-up 효과 적용.
 *
 * @example
 * <BirthAnimation steps={[<Icon />, <Title />, <URL />, <QR />, <Share />]} />
 */
export function BirthAnimation({
  steps,
  stepDelayMs = 400,
  className,
}: BirthAnimationProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // 각 step을 stepDelayMs 간격으로 순차 활성화
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setActiveStep(idx + 1); // step은 1-based
      }, idx * stepDelayMs);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [steps.length, stepDelayMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={clsx('flex flex-col items-center gap-6', className)}>
      {steps.map((stepContent, idx) => (
        <AnimationStep
          key={idx}
          step={idx + 1}
          activeStep={activeStep}
        >
          {stepContent}
        </AnimationStep>
      ))}
    </div>
  );
}
