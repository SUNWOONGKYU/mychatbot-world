/**
 * @task S7FE8 — Motion 시스템 (Framer Motion Variants 공통 프리셋)
 * "장식이 아닌 안내로서의 모션" — 60fps GPU 가속, prefers-reduced-motion 대응
 *
 * 사용법:
 *   import { fadeInUp, listStagger, listStaggerItem, getMotionProps } from '@/lib/motion';
 *   <motion.div {...getMotionProps(fadeInUp)}>...</motion.div>
 *
 * 설치 필요:
 *   npm install framer-motion
 */

import { type Variants } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

// ─── Duration 상수 (초 단위, CSS var --motion-* 와 동일한 값) ───────────────
/** 즉각 피드백용 (tap, toggle) */
const DUR_75  = 0.075;
/** 빠른 전환용 (hover, focus) */
const DUR_150 = 0.15;
/** 기본 전환용 (modal, toast 진입) */
const DUR_250 = 0.25;
/** 페이지 전환용 */
const DUR_350 = 0.35;
/** 축하 / 주목 애니메이션용 */
// const DUR_500 = 0.5; // 현재 미사용, 필요 시 주석 해제

// ─── Easing 상수 (CSS --ease-* 와 동일한 값) ──────────────────────────────
/** 일반 전환 */
const EASE_STANDARD   = [0.4, 0, 0.2, 1] as const;
/** 사라지는 요소 (exit) */
const EASE_ACCELERATE = [0.4, 0, 1,   1] as const;
/** 나타나는 요소 (enter) */
const EASE_DECELERATE = [0,   0, 0.2, 1] as const;

// ─── fadeInUp ─────────────────────────────────────────────────────────────
/**
 * 하단에서 위로 올라오며 페이드인 (모달 / 카드 등장)
 * enter: opacity 0→1, translateY 16px→0
 * exit:  opacity 1→0, translateY 0→8px
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DUR_250,
      ease: EASE_DECELERATE,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: {
      duration: DUR_150,
      ease: EASE_ACCELERATE,
    },
  },
};

// ─── fadeInScale ──────────────────────────────────────────────────────────
/**
 * 중앙 기준 스케일 + 페이드인 (Dialog / Alert 등장)
 * enter: opacity 0→1, scale 0.95→1
 * exit:  opacity 1→0, scale 1→0.95
 */
export const fadeInScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DUR_250,
      ease: EASE_DECELERATE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: DUR_150,
      ease: EASE_ACCELERATE,
    },
  },
};

// ─── slideInRight ─────────────────────────────────────────────────────────
/**
 * 우측에서 좌측으로 슬라이드 (Drawer / Side Panel 등장)
 * enter: opacity 0→1, translateX 24px→0
 * exit:  opacity 1→0, translateX 0→24px
 */
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DUR_350,
      ease: EASE_DECELERATE,
    },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: {
      duration: DUR_250,
      ease: EASE_ACCELERATE,
    },
  },
};

// ─── listStagger (parent + child 쌍) ──────────────────────────────────────
/**
 * 리스트 순차 등장 (stagger) 패턴
 *
 * 사용법:
 *   <motion.ul variants={listStagger} initial="hidden" animate="visible">
 *     {items.map(item => (
 *       <motion.li key={item.id} variants={listStaggerItem}>...</motion.li>
 *     ))}
 *   </motion.ul>
 *
 * parent (listStagger): staggerChildren + delayChildren 설정
 */
export const listStagger: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      /** 자식 요소 간 딜레이 (ms 단위 불가, 초 단위) */
      staggerChildren: 0.06,
      /** 첫 번째 자식 등장 전 지연 */
      delayChildren: 0.05,
    },
  },
};

/**
 * listStagger 의 child variant
 * parent의 stagger에 따라 순차적으로 위에서 아래로 등장
 */
export const listStaggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DUR_250,
      ease: EASE_DECELERATE,
    },
  },
};

// ─── buttonTap ────────────────────────────────────────────────────────────
/**
 * 버튼 탭 피드백 (scale 0.98 — 즉각적이고 섬세한 눌림감)
 *
 * 사용법:
 *   <motion.button whileTap={buttonTap}>...</motion.button>
 */
export const buttonTap = {
  scale: 0.98,
  transition: {
    duration: DUR_75,
    ease: EASE_STANDARD,
  },
} as const;

// ─── getMotionProps ────────────────────────────────────────────────────────
/**
 * prefers-reduced-motion 대응 헬퍼
 *
 * reduced-motion이 활성화된 경우 initial === animate 로 설정해
 * Framer Motion 애니메이션을 사실상 무효화한다.
 *
 * @param variants - 사용할 Framer Motion Variants 객체
 * @param initial  - 초기 variant 이름 (기본값: 'hidden')
 * @param animate  - 최종 variant 이름 (기본값: 'visible')
 * @returns        - <motion.div> 에 spread 할 props 객체
 *
 * 사용법:
 *   const motionProps = getMotionProps(fadeInUp);
 *   <motion.div {...motionProps}>...</motion.div>
 */
export function getMotionProps(
  variants: Variants,
  initial: string = 'hidden',
  animate: string = 'visible',
): {
  variants: Variants;
  initial: string;
  animate: string;
} {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const shouldReduce = useReducedMotion();

  return {
    variants,
    /**
     * reduced-motion 시 initial = animate 로 설정
     * → 시작 상태가 이미 최종 상태이므로 애니메이션 발생 안 함
     */
    initial: shouldReduce ? animate : initial,
    animate,
  };
}

// ─── 타입 re-export (외부에서 Variants 타입 직접 사용 가능하도록) ─────────
export type { Variants };
