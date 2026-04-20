# S7FE8 Motion 시스템 적용 — 구현 요약 리포트

**Task ID**: S7FE8
**완료일**: 2026-04-20
**상태**: Executed
**원칙**: "장식이 아닌 안내로서의 모션" — 60fps GPU 가속, prefers-reduced-motion 완전 대응

---

## 1. Motion 토큰 스펙 (Duration 5 + Easing 3)

### Duration

| CSS 변수 | 값 | 용도 |
|---------|-----|------|
| `--motion-75` | 75ms | 즉각 피드백 (tap, toggle) |
| `--motion-150` | 150ms | 빠른 전환 (hover, focus, tooltip) |
| `--motion-250` | 250ms | 기본 전환 (modal, toast 진입) |
| `--motion-350` | 350ms | 페이지 전환 (drawer 등 대형 요소) |
| `--motion-500` | 500ms | 축하/주목 애니메이션 |

### Easing

| CSS 변수 | cubic-bezier | 용도 |
|---------|-------------|------|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | 일반 전환 (중립적) |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | 사라지는 요소 (exit) |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | 나타나는 요소 (enter) |

**저장 위치**: `app/globals.css` §14 섹션 (기존 §13 prefers-reduced-motion 뒤에 병합)

---

## 2. lib/motion.ts — Framer Motion Variants 프리셋

**파일**: `lib/motion.ts` (신규 생성)

### Variants 목록

| Export | 타입 | 설명 | 주요 Transition |
|--------|------|------|----------------|
| `fadeInUp` | `Variants` | 하단→위로 페이드인 (modal/card 등장) | enter: 250ms decelerate, exit: 150ms accelerate |
| `fadeInScale` | `Variants` | 중앙 스케일 페이드인 (Dialog) | enter: 250ms decelerate, exit: 150ms accelerate |
| `slideInRight` | `Variants` | 우측→좌측 슬라이드 (Drawer/Panel) | enter: 350ms decelerate, exit: 250ms accelerate |
| `listStagger` | `Variants` | 리스트 순차 등장 — parent | staggerChildren: 0.06s, delayChildren: 0.05s |
| `listStaggerItem` | `Variants` | 리스트 순차 등장 — child | 250ms decelerate, y: 12px→0 |
| `buttonTap` | `object` | 버튼 탭 피드백 | scale: 0.98, 75ms standard |

### getMotionProps 헬퍼 시그니처

```typescript
export function getMotionProps(
  variants: Variants,
  initial?: string,   // 기본값: 'hidden'
  animate?: string,   // 기본값: 'visible'
): {
  variants: Variants;
  initial: string;
  animate: string;
}
```

- `useReducedMotion()` 훅 내부 사용
- reduced-motion 시 `initial === animate` → 애니메이션 사실상 무효화
- Framer Motion 사용 측에서 `{...getMotionProps(fadeInUp)}` 형태로 spread

---

## 3. tailwind.config.ts 변경사항

**§8 TRANSITION 섹션 확장** (기존 fast/base/slow 보존):

```typescript
// 신규 추가
transitionDuration: {
  'motion-75':  '75ms',
  'motion-150': '150ms',
  'motion-250': '250ms',
  'motion-350': '350ms',
  'motion-500': '500ms',
},
transitionTimingFunction: {
  standard:   'cubic-bezier(0.4, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1,   1)',
  decelerate: 'cubic-bezier(0, 0, 0.2,   1)',
},
```

**§9 KEYFRAMES 신규 추가** (기존 유지):

| keyframe | 설명 |
|---------|------|
| `fadeInUpMotion` | Motion Token 기반 fadeInUp (250ms decelerate) |
| `fadeInScaleMotion` | 중앙 스케일 페이드인 (Dialog) |
| `listItemIn` | 리스트 아이템 순차 등장용 (CSS fallback) |

**§9 ANIMATION 신규 추가**:

| 클래스 | 값 |
|--------|-----|
| `animate-motion-fade-in-up` | `fadeInUpMotion 0.25s cubic-bezier(0, 0, 0.2, 1) both` |
| `animate-motion-fade-in-scale` | `fadeInScaleMotion 0.25s cubic-bezier(0, 0, 0.2, 1) both` |
| `animate-motion-list-item` | `listItemIn 0.25s cubic-bezier(0, 0, 0.2, 1) both` |

---

## 4. 수정된 기존 컴포넌트 목록

| 파일 | 변경 내용 | 적용 duration 토큰 |
|------|----------|-------------------|
| `components/ui/dialog.tsx` | `duration-motion-250` 추가 + @task 주석 | --motion-250 |
| `components/ui/drawer.tsx` | `duration-motion-350` 추가 + @task 주석 | --motion-350 |
| `components/ui/tooltip.tsx` | `duration-motion-150` 추가 + @task 주석 | --motion-150 |
| `components/ui/popover.tsx` | `duration-motion-150` 추가 + @task 주석 | --motion-150 |
| `components/ui/toast.tsx` | `duration-motion-250` 추가 + @task 주석 | --motion-250 |

**변경 원칙**: 기존 `data-[state]` Radix 애니메이션 클래스 보존. 하드코딩된 duration이 없어 구조 변경 없이 Tailwind duration 유틸 추가만으로 Motion Token 연동 완성. 비즈니스 로직 무변경.

**Duration 매핑 근거**:
- Dialog/Toast: modal/overlay 진입 = 기본 전환 → 250ms
- Drawer: 대형 패널 진입 = 페이지 전환급 → 350ms
- Tooltip/Popover: 인터랙티브 요소 반응 = 빠른 전환 → 150ms

---

## 5. prefers-reduced-motion 대응 위치

| 파일 | 대응 방식 |
|------|----------|
| `app/globals.css` §13 | `@media (prefers-reduced-motion: reduce)` — 전역 `animation-duration: 0.01ms !important` 이미 구현됨 (기존 유지) |
| `components/ui/*.tsx` (5종) | `motion-reduce:animate-none` 클래스 이미 적용됨 (기존 유지) |
| `lib/motion.ts` | `useReducedMotion()` 훅으로 `getMotionProps()` 내 initial/animate 동일화 → Framer Motion 애니메이션 무효화 |

**중요**: §14의 CSS 토큰 변수 자체는 `prefers-reduced-motion` 안에서 0으로 재선언하지 않음 — 전역 `@media` 규칙이 이미 모든 `transition-duration`과 `animation-duration`을 0.01ms로 강제하기 때문에 중복 불필요.

---

## 6. 설치 필요 패키지

현재 상태: `framer-motion` **미설치** (package.json 확인 결과)

```bash
# 필수 설치
npm install framer-motion

# 버전 권장
# framer-motion@11+ (useReducedMotion 훅 안정 지원)
```

`lib/motion.ts`의 `import { type Variants } from 'framer-motion'` 및 `import { useReducedMotion } from 'framer-motion'`은 설치 후 즉시 사용 가능.

**현재 영향 없음**: framer-motion 미설치 상태에서 `lib/motion.ts`는 빌드 시 import 오류를 냄. 사용 전 반드시 설치 후 활성화할 것. CSS 토큰, Tailwind extend, overlay Primitive 변경은 framer-motion과 무관하게 즉시 동작함.

---

## 7. 사용 예시 (코드 스니펫)

### 기본 사용 (framer-motion 설치 후)

```tsx
import { motion } from 'framer-motion';
import { fadeInUp, getMotionProps } from '@/lib/motion';

// prefers-reduced-motion 자동 대응
function MyCard() {
  const motionProps = getMotionProps(fadeInUp);
  return (
    <motion.div {...motionProps}>
      카드 내용
    </motion.div>
  );
}
```

### listStagger — 리스트 순차 등장

```tsx
import { motion } from 'framer-motion';
import { listStagger, listStaggerItem } from '@/lib/motion';

function SkillList({ skills }: { skills: Skill[] }) {
  return (
    <motion.ul
      variants={listStagger}
      initial="hidden"
      animate="visible"
    >
      {skills.map((skill) => (
        <motion.li key={skill.id} variants={listStaggerItem}>
          <SkillCard skill={skill} />
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### buttonTap — 탭 피드백

```tsx
import { motion } from 'framer-motion';
import { buttonTap } from '@/lib/motion';

function ActionButton() {
  return (
    <motion.button whileTap={buttonTap}>
      실행
    </motion.button>
  );
}
```

### CSS only — Tailwind Motion 유틸

```html
<!-- Framer Motion 없이도 사용 가능 -->
<div class="animate-motion-fade-in-up">카드 등장</div>
<div class="transition duration-motion-250 ease-decelerate hover:translate-y-[-2px]">호버 효과</div>
```

---

## 8. 파일 변경 요약

| 파일 | 변경 유형 | 비고 |
|------|----------|------|
| `app/globals.css` | Edit — §14 Motion Token 추가 | 기존 내용 보존, 병합 |
| `lib/motion.ts` | 신규 생성 | Framer Motion Variants 5종 + getMotionProps |
| `tailwind.config.ts` | Edit — §8/§9 extend 확장 | 기존 토큰 보존 |
| `components/ui/dialog.tsx` | Edit — duration 토큰 + 주석 | motion 관련 값만 |
| `components/ui/drawer.tsx` | Edit — duration 토큰 + 주석 | motion 관련 값만 |
| `components/ui/tooltip.tsx` | Edit — duration 토큰 + 주석 | motion 관련 값만 |
| `components/ui/popover.tsx` | Edit — duration 토큰 + 주석 | motion 관련 값만 |
| `components/ui/toast.tsx` | Edit — duration 토큰 + 주석 | motion 관련 값만 |
| `app/marketplace/page-client.tsx` | Edit — listStagger 패턴 주석 시연 | 비즈니스 로직 무변경 |
