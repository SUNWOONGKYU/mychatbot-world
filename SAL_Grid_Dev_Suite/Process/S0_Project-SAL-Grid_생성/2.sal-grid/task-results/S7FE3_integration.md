# S7FE3 — Primitive 컴포넌트 8종 (Overlay/Container) 통합 보고서

- **Task ID**: S7FE3
- **Stage/Area**: S7 / FE
- **Dependencies**: S7FE1 (Tailwind + globals.css), S7FE2 (Form Primitive)
- **Agent**: frontend-developer-core
- **실행일**: 2026-04-20
- **Status**: Executed (검증 대기)

---

## 1. Executive Summary

S7FE1의 Semantic 토큰과 S7FE2의 Form Primitive 위에 **Overlay/Container Primitive 8종**을 `components/ui/` 경로에 신규 구축했다. 모두 Radix UI Portal·WAI-ARIA 기반으로 focus trap·ESC 닫기·keyboard nav·data-state 애니메이션을 내장한다.

| 항목 | 수치 |
|------|------|
| 신규 컴포넌트 파일 | **8개** (card / dialog / drawer / toast / tooltip / popover / tabs / accordion) |
| 기존 파일 덮어쓰기 | **0건** (기존 `components/ui/`에 overlay 계열 전무) |
| CVA 사용 컴포넌트 | **4종** (Card / Toast / Tabs-List / Tabs-Trigger) |
| Radix Portal 래핑 | **5종** (Dialog / Drawer / Toast / Tooltip / Popover) |
| a11y 필수 기능 | focus trap(Dialog/Drawer) · ESC 닫기(Radix 내장) · aria-label(Close 버튼) · keyboard nav(Tabs/Accordion) |
| 토큰 소스 | S7FE1 Semantic 전용 (`surface-1~4`, `border-default/subtle`, `state-*-bg/border/fg`, `shadow-sm/md/lg/xl`, `ring-focus`, `text-inverted`) |
| **설치 필요 npm 패키지** | **6개** (`@radix-ui/react-dialog`, `@radix-ui/react-toast`, `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, `@radix-ui/react-accordion`) + 애니메이션 플러그인 `tailwindcss-animate` |

> **중요**: `package.json`에 위 Radix 패키지와 `tailwindcss-animate`가 아직 없다. 각 소스 파일 상단에 `/* TODO: npm install ... */` 주석을 남겼으며, §7에 PO가 실행할 설치 명령어 단일 라인을 명시한다.

---

## 2. 컴포넌트 매핑 표

| # | 컴포넌트 | 파일 | Radix 패키지 | 서브컴포넌트 | variants |
|---|----------|------|--------------|--------------|----------|
| 1 | **Card** | `components/ui/card.tsx` | — (순수 React) | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | default / elevated / outlined / ghost |
| 2 | **Dialog** | `components/ui/dialog.tsx` | `react-dialog` | Dialog, Trigger, Portal, Overlay, Content, Header, Footer, Title, Description, Close | — (고정 surface-3) |
| 3 | **Drawer** | `components/ui/drawer.tsx` | `react-dialog` (재활용) | Drawer, Trigger, Portal, Overlay, Content, Header, Footer, Title, Description, Close | side: **bottom**(default) / top / left / right |
| 4 | **Toast** | `components/ui/toast.tsx` | `react-toast` | Provider, Viewport, Toast, Title, Description, Action, Close | default / success / warning / danger / info |
| 5 | **Tooltip** | `components/ui/tooltip.tsx` | `react-tooltip` | Provider, Tooltip, Trigger, Portal, Content, Arrow | — (surface-4 dark chip) |
| 6 | **Popover** | `components/ui/popover.tsx` | `react-popover` | Popover, Trigger, Portal, Content, Close, Anchor, Arrow | — (surface-2) |
| 7 | **Tabs** | `components/ui/tabs.tsx` | `react-tabs` | Tabs, List, Trigger, Content | List/Trigger: **default** / underline / pills |
| 8 | **Accordion** | `components/ui/accordion.tsx` | `react-accordion` | Accordion, Item, Trigger, Content (Chevron 내장) | type: single / multiple (Radix prop) |

### 2.1 파일 크기 (근사)

| 파일 | Lines |
|------|-------|
| card.tsx | ~115 |
| dialog.tsx | ~125 |
| drawer.tsx | ~155 |
| toast.tsx | ~175 |
| tooltip.tsx | ~60 |
| popover.tsx | ~70 |
| tabs.tsx | ~120 |
| accordion.tsx | ~90 |

---

## 3. Overlay z-index 체계

> 겹침 우선순위는 "닫기 행위가 가장 시급한 레이어"가 최상단.

| 레이어 | z-index | 컴포넌트 | 근거 |
|--------|:-------:|---------|------|
| Toast Viewport | **100** | `toast.tsx` | 에러/알림은 Dialog 위에도 표시되어야 함 |
| Dialog | **80** | `dialog.tsx` | 시스템 차단형 모달 |
| Drawer | **70** | `drawer.tsx` | Dialog 하위, 일반 콘텐츠 위 |
| Tooltip | **60** | `tooltip.tsx` | Popover 위에서 설명 가능 |
| Popover | **50** | `popover.tsx` | 일반 Overlay 베이스 |
| (base) | auto/0~10 | Header/Sidebar 등 레이아웃 | — |

**구현 방식**: 각 Content/Viewport/Overlay에 Tailwind arbitrary `z-[XX]` 직접 지정. 추후 `globals.css`에 `--z-dialog`, `--z-toast` 토큰 추가 시 마이그레이션 가능(S7DC1 문서화 범위).

---

## 4. 애니메이션 전략

### 4.1 전략: `tailwindcss-animate` 플러그인 채택

본 8개 컴포넌트는 shadcn/ui 규약을 따라 Radix `data-state` 기반 유틸리티 클래스를 사용한다:

- `data-[state=open]:animate-in` + `fade-in-0` + `zoom-in-95`
- `data-[state=closed]:animate-out` + `fade-out-0` + `zoom-out-95`
- `data-[side=top|right|bottom|left]:slide-in-from-*`
- `animate-accordion-down` / `animate-accordion-up` (Accordion 전용)

이 유틸리티들은 **`tailwindcss-animate` 플러그인**이 제공한다. 설치 전까지는 애니메이션만 무시되고 기능은 정상 작동한다(graceful degradation).

### 4.2 S7FE1 globals.css와의 관계

S7FE1에는 이미 `fadeInUp` / `fadeIn` / `shimmer` / `countUp` / `pulse-glow` 5개 커스텀 keyframe이 있으나, 이는 **페이지 단위 등장 모션**용이고 Radix data-state에는 부합하지 않는다. 따라서 overlay 계열 모션은 `tailwindcss-animate`가 제공하는 `accordion-down` 등 전용 유틸리티에 의존한다.

> **옵션 (플러그인 미설치 원칙)**: 필요시 S7FE8 Motion 시스템 Task에서 `globals.css`에 아래 keyframe을 직접 추가하여 플러그인 없이 동작하게 할 수 있다. 본 Task는 플러그인 채택을 권장한다.
>
> ```
> @keyframes accordion-down / accordion-up / slide-in-from-right / zoom-in-95 / fade-in-0 ...
> ```

### 4.3 motion-reduce 대응

모든 컴포넌트에 `motion-reduce:animate-none` 또는 `motion-reduce:transition-none`이 포함되어 있다. `prefers-reduced-motion: reduce` 사용자는 정지 상태로 overlay가 즉시 표시된다(기능 동일).

---

## 5. 사용 예시 5선

### 5.1 Dialog + Form (S7FE2 재사용)

```tsx
'use client';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function EditBotDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">코코봇 편집</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>코코봇 정보 수정</DialogTitle>
          <DialogDescription>
            이름과 설명은 챗봇 프로필에 즉시 반영됩니다.
          </DialogDescription>
        </DialogHeader>
        <Field label="이름" required>
          <Input placeholder="예: 코코봇" />
        </Field>
        <Field label="설명">
          <Textarea placeholder="이 챗봇은 무엇을 도와주나요?" />
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">취소</Button>
          </DialogClose>
          <Button>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.2 Toast 프로그래매틱 호출 (Provider + 상태 관리)

```tsx
// app/layout.tsx (Provider 주입)
import { ToastProvider, ToastViewport } from '@/components/ui/toast';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}

// 사용처
'use client';
import * as React from 'react';
import { Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export function SaveAction() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>저장</Button>
      <Toast open={open} onOpenChange={setOpen} variant="success" duration={3000}>
        <div className="grid gap-1">
          <ToastTitle>저장되었습니다</ToastTitle>
          <ToastDescription>변경사항이 프로필에 반영됐어요.</ToastDescription>
        </div>
        <ToastAction altText="되돌리기" asChild>
          <Button variant="ghost" size="sm">되돌리기</Button>
        </ToastAction>
        <ToastClose />
      </Toast>
    </>
  );
}
```

### 5.3 Tabs (underline variant)

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function BotDetailTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="underline">
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="chats">대화 이력</TabsTrigger>
        <TabsTrigger value="settings">설정</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">프로필·통계가 이곳에 표시됩니다.</TabsContent>
      <TabsContent value="chats">최근 7일 대화 이력.</TabsContent>
      <TabsContent value="settings">챗봇 기본 설정.</TabsContent>
    </Tabs>
  );
}
```

### 5.4 Accordion (FAQ, single type)

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export function FaqSection() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="q1">
        <AccordionTrigger>코코봇은 어떻게 만드나요?</AccordionTrigger>
        <AccordionContent>
          메인 화면의 "새 코코봇 만들기" 버튼을 누르면 8단계 위저드가 안내합니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="q2">
        <AccordionTrigger>크레딧은 어디서 확인하나요?</AccordionTrigger>
        <AccordionContent>
          마이페이지 → 크레딧 탭에서 잔액과 이력을 확인할 수 있습니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### 5.5 Tooltip + Popover 조합

```tsx
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function InfoIcon() {
  return (
    <TooltipProvider>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="도움말">
                ?
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>자세한 설명 보기</TooltipContent>
        </Tooltip>
        <PopoverContent align="end">
          <p className="text-sm text-text-primary">
            이 항목은 결제에 필요한 최소 크레딧입니다. 부족 시 자동충전이 설정된 경우에만 진행됩니다.
          </p>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
```

---

## 6. 하위호환

### 6.1 기존 `components/ui/` 상태

| 파일 | 기존 여부 | 조치 |
|------|:---------:|------|
| button, input, select, checkbox, radio-group, switch, slider, textarea, label, field | S7FE2 신규 | **보존** (overlay들이 import로 재사용) |
| theme-toggle | 기존 존재 | **보존** (이름 충돌 없음) |
| card / dialog / drawer / toast / tooltip / popover / tabs / accordion | **신규 (본 Task)** | — |

기존에 `components/ui/` 에 overlay 계열 프리미티브가 **전무**했으므로 하위호환 리스크 없음. 본 Task는 "신규 도입(Greenfield)".

### 6.2 기존 Dialog-like 패턴 마이그레이션

레거시 페이지들(`css/create.css`, `app/jobs/search/page-client.tsx`, `components/mypage/*` 등)이 사용하던 `window.alert` / `window.confirm` / 인라인 모달 div는 **이번 Task에서 교체하지 않는다**. S7FE5~S7FE7 리디자인 Task에서 점진 교체된다.

### 6.3 import 경로

```ts
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastAction, ToastClose } from '@/components/ui/toast';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
```

---

## 7. 설치 필요 패키지 (PO 실행)

```bash
npm install @radix-ui/react-dialog @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-accordion && npm install -D tailwindcss-animate
```

그리고 `tailwind.config.ts`에 플러그인 등록:

```ts
// tailwind.config.ts
plugins: [require('tailwindcss-animate')],
```

| 패키지 | 사용처 | 타입 |
|--------|--------|:----:|
| `@radix-ui/react-dialog` | Dialog / Drawer | dep |
| `@radix-ui/react-toast` | Toast | dep |
| `@radix-ui/react-tooltip` | Tooltip | dep |
| `@radix-ui/react-popover` | Popover | dep |
| `@radix-ui/react-tabs` | Tabs | dep |
| `@radix-ui/react-accordion` | Accordion | dep |
| `tailwindcss-animate` | data-state 애니메이션 유틸리티 | devDep |

> ℹ️ `class-variance-authority`, `clsx`, `tailwind-merge`는 S7FE2에서 이미 설치 요청 완료.

> ℹ️ `vaul`(모바일 drag-to-close 향상 패키지)은 **채택하지 않음**. Radix Dialog 기반 Drawer로 충분. 추후 모바일 UX 고도화 시 S7FE8에서 재검토.

---

## 8. 접근성 체크리스트

| 항목 | 적용 | 구현 |
|------|:----:|------|
| focus trap (Dialog/Drawer) | ✅ | Radix Portal 내장 — 모달 외부 tab 불가 |
| ESC 닫기 | ✅ | Radix 기본. `onEscapeKeyDown` prop으로 제어 가능 |
| 포커스 복원 | ✅ | Radix가 Trigger로 자동 복원 |
| aria-labelledby / aria-describedby | ✅ | DialogTitle / DialogDescription 자동 연결 |
| Close 버튼 aria-label | ✅ | ToastClose `aria-label="닫기"` |
| keyboard nav (Tabs 좌/우 화살표) | ✅ | Radix Tabs 내장 |
| keyboard nav (Accordion 위/아래 + Enter) | ✅ | Radix Accordion 내장 |
| hover/focus 구분 (Tooltip) | ✅ | Radix Tooltip은 pointer-hover + keyboard-focus 양쪽 대응 |
| Portal z-order 일관성 | ✅ | §3 z-index 체계 준수 |
| Reduced Motion | ✅ | `motion-reduce:animate-none` / `transition-none` 전 컴포넌트 |
| 한국어 줄바꿈 | ✅ | `[word-break:keep-all]` Title/Description/AccordionContent 전수 |
| Light/Dark 대칭 | ✅ | surface/state/border/text 전부 Semantic 토큰 참조 → `.dark` 자동 대응 |

남은 검증: S7TS1 A11y 감사 Task에서 axe-core 자동 스캔·WCAG AA 대비율·실제 스크린리더 확인 예정.

---

## 9. S7FE4 Composite 인계

본 8종 Primitive는 S7FE4 Composite 9종의 내부 구성 요소로 재사용된다.

| S7FE4 Composite | 내부 재사용 Primitive |
|-----------------|----------------------|
| **Command Palette (⌘K)** | `Dialog` + `Input`(S7FE2) + 커스텀 리스트 |
| **Data Table** | `Card` + `Tabs`(필터/탭) + `Popover`(컬럼 설정) |
| **Empty State** | `Card` + `Button`(S7FE2) |
| **Notification Center** | `Popover` + `Tabs` + `Card` 반복 |
| **Combobox / Multi-Select** | `Popover` + `Input` + `Checkbox` |
| **Date/Time Picker** | `Popover` + 커스텀 캘린더 |
| **File Uploader (drop zone)** | `Card`(outlined variant) + progress |
| **Confirm Dialog (alert)** | `Dialog` + `Button` |
| **Sheet (대형 Drawer)** | `Drawer`(side=right) + 복합 레이아웃 |

### 9.1 Toast Trigger 헬퍼 (S7FE4에서 추가 예정)

현재는 Radix Toast의 `open`/`onOpenChange`를 직접 제어하는 저수준 API만 제공한다. S7FE4에서 다음과 같은 전역 헬퍼를 추가한다:

```ts
// useToast() hook + toast() 함수 — S7FE4 Composite
const { toast } = useToast();
toast({ variant: 'success', title: '저장되었습니다', description: '...' });
```

### 9.2 Drawer + vaul 향후 검토

현재 Drawer는 Radix Dialog 기반(drag-to-close 미지원). 모바일 UX 고도화 시 S7FE8에서 `vaul` 패키지를 추가하여 `drawer.tsx`를 내부적으로 교체할 수 있다(외부 API 유지).

---

## 10. 파일 절대 경로

### 10.1 컴포넌트 8종

- `G:\내 드라이브\mychatbot-world\components\ui\card.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\dialog.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\drawer.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\toast.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\tooltip.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\popover.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\tabs.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\accordion.tsx`

### 10.2 보고서 (본 문서)

- `G:\내 드라이브\mychatbot-world\SAL_Grid_Dev_Suite\Process\S0_Project-SAL-Grid_생성\2.sal-grid\task-results\S7FE3_integration.md`

### 10.3 Grid JSON

- `G:\내 드라이브\mychatbot-world\SAL_Grid_Dev_Suite\Process\S0_Project-SAL-Grid_생성\3.method\json\data\grid_records\S7FE3.json` (`task_status`: Executed, `task_progress`: 100)

---

## 11. 다음 단계

1. **PO 실행**: §7 `npm install ...` 명령 + `tailwind.config.ts` 플러그인 등록.
2. **PO 빌드 검증**: `C:\mcw-build` 환경에서 `npm run build` 또는 `npx tsc --noEmit`.
3. **검증 에이전트**: `code-reviewer-core` 투입 → 토큰 사용 일관성, Radix 패턴 준수, z-index 체계, 접근성 체크리스트.
4. **S7FE4**: 본 Primitive 8종 + S7FE2 10종을 조합한 Composite 컴포넌트 9종 (Command Palette, Data Table, Combobox, Date Picker, Empty State, Notification Center, File Uploader, Confirm Dialog, Sheet).

---

*리포트 종료 — S7FE3 Overlay/Container Primitive 8종 구축 완료 (검증 대기).*
