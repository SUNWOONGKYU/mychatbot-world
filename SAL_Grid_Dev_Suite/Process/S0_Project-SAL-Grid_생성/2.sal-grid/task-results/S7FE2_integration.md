# S7FE2 — Primitive 컴포넌트 10종 (Form Fields) 통합 보고서

- **Task ID**: S7FE2
- **Stage/Area**: S7 / FE
- **Dependencies**: S7FE1 (Tailwind + globals.css)
- **Agent**: frontend-developer-core
- **실행일**: 2026-04-20
- **Status**: Executed (검증 대기)

---

## 1. Executive Summary

S7FE1에서 주입한 Semantic 토큰(Surface/Text/Border/Ring/Interactive/State)을 소비하는 **shadcn/ui + Radix 기반 폼 Primitive 10종**을 `components/ui/` 경로에 신규 구축했다.

| 항목 | 수치 |
|------|------|
| 신규 컴포넌트 파일 | **10개** (button/input/select/checkbox/radio-group/switch/slider/textarea/label/field) |
| 기존 파일 덮어쓰기 | **0건** (`theme-toggle.tsx`는 별도, 신규 10종과 충돌 없음) |
| CVA 사용 컴포넌트 | **4종** (Button/Input/Textarea/Label) — 명시적 variant/size 노출 |
| Radix Primitive 래핑 | **7종** (Select/Checkbox/RadioGroup/Switch/Slider/Label/Field는 내부적으로 Label 래핑) |
| 공통 base | focus-visible 링 토큰(`ring-ring-focus` + `ring-offset-surface-0`), `motion-reduce:transition-none`, `disabled:opacity-50` |
| 토큰 소스 | S7FE1 Semantic 전용 (`surface-*`, `text-text-*`, `border-border-*`, `ring-ring-*`, `bg-interactive-*`, `bg-state-*-bg/border`) |
| **설치 필요 npm 패키지** | **7개** (`@radix-ui/react-slot`, `@radix-ui/react-select`, `@radix-ui/react-checkbox`, `@radix-ui/react-radio-group`, `@radix-ui/react-switch`, `@radix-ui/react-slider`, `@radix-ui/react-label`, `class-variance-authority`) |

> **중요**: `package.json`에 위 Radix/CVA 패키지가 아직 없다. 각 소스 파일 상단에 `/* TODO: npm install ... */` 주석을 남겼으며, §5에 PO가 실행할 설치 명령어 단일 라인을 명시한다.

---

## 2. 컴포넌트 목록 (10종)

| # | 컴포넌트 | 경로 | Radix 의존성 | variants | sizes | 주요 ARIA |
|---|----------|------|--------------|----------|-------|-----------|
| 1 | **Button** | `components/ui/button.tsx` | `react-slot` | default / primary / secondary / destructive / outline / ghost / link | sm / md / lg / icon | focus-visible ring, disabled, asChild |
| 2 | **Input** | `components/ui/input.tsx` | — | default / error / success | sm / md / lg | aria-invalid, focus-visible ring |
| 3 | **Select** | `components/ui/select.tsx` | `react-select` | — (Radix 기반 구조) | — | data-state open/close 애니메이션, keyboard nav |
| 4 | **Checkbox** | `components/ui/checkbox.tsx` | `react-checkbox` | — | — | data-state checked/unchecked/indeterminate |
| 5 | **RadioGroup** | `components/ui/radio-group.tsx` | `react-radio-group` | — | — | radiogroup role, data-state checked |
| 6 | **Switch** | `components/ui/switch.tsx` | `react-switch` | — | — | data-state transition, `switch` role |
| 7 | **Slider** | `components/ui/slider.tsx` | `react-slider` | — (range 자동 지원) | — | focus-visible on Thumb, aria-valuenow |
| 8 | **Textarea** | `components/ui/textarea.tsx` | — | default / error / success | — | min-h 80px, resize-y, word-break keep-all |
| 9 | **Label** | `components/ui/label.tsx` | `react-label` | — | — | peer-disabled 스타일, htmlFor 자동 연결 |
| 10 | **Field** | `components/ui/field.tsx` | (내부: Label 래핑) | — | — | aria-describedby/-invalid/-required 자동 |

### 2.1 파일 크기 (근사)

| 파일 | Lines (approx) |
|------|----------------|
| button.tsx | ~95 |
| input.tsx | ~75 |
| select.tsx | ~170 |
| checkbox.tsx | ~75 |
| radio-group.tsx | ~55 |
| switch.tsx | ~45 |
| slider.tsx | ~65 |
| textarea.tsx | ~60 |
| label.tsx | ~30 |
| field.tsx | ~115 |

---

## 3. 사용 예시

### 3.1 기본 버튼 3종

```tsx
import { Button } from '@/components/ui/button';

export function Example() {
  return (
    <div className="flex gap-2">
      <Button>기본 (primary)</Button>
      <Button variant="secondary" size="sm">보조</Button>
      <Button variant="destructive">삭제</Button>
      <Button variant="outline" size="lg">윤곽선</Button>
      <Button variant="ghost">고스트</Button>
      <Button variant="link">링크</Button>
    </div>
  );
}
```

### 3.2 Field + Input + 에러 처리

```tsx
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function EmailField({ error }: { error?: string }) {
  return (
    <Field
      label="이메일"
      helperText="로그인에 사용할 이메일을 입력하세요."
      error={error}
      required
    >
      <Input type="email" placeholder="you@example.com" />
    </Field>
  );
}
```

→ `<Input>`에 `id`, `aria-describedby`, `aria-invalid`, `aria-required`가 자동 주입된다.
→ `error` 존재 시 helperText는 감춰지고 에러 메시지가 `role="alert"`로 표시된다.

### 3.3 Field 렌더 프롭 패턴 (Select 등 복합 컴포넌트)

```tsx
import { Field } from '@/components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function CategoryField() {
  return (
    <Field label="카테고리" required>
      {(ctl) => (
        <Select>
          <SelectTrigger id={ctl.id} aria-describedby={ctl['aria-describedby']}>
            <SelectValue placeholder="선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ai">AI</SelectItem>
            <SelectItem value="finance">금융</SelectItem>
            <SelectItem value="health">건강</SelectItem>
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}
```

### 3.4 Checkbox + Label

```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function Terms() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">이용약관에 동의합니다</Label>
    </div>
  );
}
```

### 3.5 Switch / Slider / RadioGroup

```tsx
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export function Preferences() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch id="notif" />
        <Label htmlFor="notif">알림 받기</Label>
      </div>

      <Slider defaultValue={[30]} max={100} step={1} />
      <Slider defaultValue={[20, 80]} max={100} step={1} />{/* range */}

      <RadioGroup defaultValue="card">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="card" id="pm-card" />
          <Label htmlFor="pm-card">카드</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="bank" id="pm-bank" />
          <Label htmlFor="pm-bank">무통장 입금</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

---

## 4. 하위호환 변경사항

### 4.1 기존 `components/ui/` 디렉토리 상태

| 파일 | 상태 | 조치 |
|------|:----:|------|
| `theme-toggle.tsx` | 기존 존재 | **보존** — S7FE2 10종과 이름 충돌 없음, 그대로 유지 |
| `desktop.ini` | 시스템 파일 | 무시 |

### 4.2 기존 Button/Input/Select 등 export 시그니처

기존에는 **`components/ui/` 내에 Button/Input/Select 등이 존재하지 않았다** (shadcn 프리미티브 부재 = S7DS1 진단 #8).
따라서 하위호환 리스크는 없으며, 본 Task가 "신규 도입(Greenfield)"이다.

프로젝트 다른 곳의 기존 `<button>` / `<input>` 태그 직접 사용은 그대로 작동한다 (컴포넌트 교체는 S7FE5~S7FE7 리디자인 Task에서 점진 진행).

### 4.3 import 경로

```ts
// 신규 권장
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
```

`@/*` alias는 `tsconfig.json`의 `paths` 설정에 의존한다 (기존 설정 유지 가정).

---

## 5. 설치 필요 패키지

`package.json`에 **아직 추가되지 않은** 패키지 목록이다. PO가 아래 단일 라인을 실행해야 빌드가 통과한다.

```bash
npm install @radix-ui/react-slot @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-switch @radix-ui/react-slider @radix-ui/react-label class-variance-authority
```

| 패키지 | 사용처 |
|--------|--------|
| `@radix-ui/react-slot` | Button `asChild` |
| `@radix-ui/react-select` | Select |
| `@radix-ui/react-checkbox` | Checkbox |
| `@radix-ui/react-radio-group` | RadioGroup |
| `@radix-ui/react-switch` | Switch |
| `@radix-ui/react-slider` | Slider |
| `@radix-ui/react-label` | Label / Field |
| `class-variance-authority` | Button / Input / Textarea / Label CVA |

> ℹ️ `clsx` + `tailwind-merge`는 **이미** 설치됨 (`lib/utils.ts`의 `cn()` 유틸에서 사용 중, package.json dependencies 확인 완료).

### 5.1 Tailwind 애니메이션 플러그인 (선택)

`Select` 컴포넌트의 `data-[state=open]:animate-in` 등의 유틸리티는 `tailwindcss-animate` 플러그인을 사용한다. 현재 `tailwind.config.ts`에 미등록일 수 있다. 필요 시 추가:

```bash
npm install -D tailwindcss-animate
```
```ts
// tailwind.config.ts
plugins: [require('tailwindcss-animate')],
```

없을 경우 Select 드롭다운은 **정상 작동하되 등장 애니메이션만** 적용되지 않는다(기능적 영향 없음).

---

## 6. 접근성 체크리스트

| 항목 | 적용 여부 | 구현 방식 |
|------|:---------:|-----------|
| focus-visible 링 (2px + offset 2px) | ✅ 전 컴포넌트 | `focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0` |
| disabled 상태 시각/동작 처리 | ✅ 전 컴포넌트 | `disabled:pointer-events-none disabled:opacity-50` (Button) / 각 Radix Root의 `disabled` prop |
| aria-invalid 자동 연결 | ✅ Input/Textarea/Select/Checkbox/Radio + Field | 토큰 `state-danger-border`로 시각 표현 |
| aria-describedby (helper/error) | ✅ Field | `useId()` 기반 `field-N-helper`, `field-N-error` 자동 생성 |
| aria-required | ✅ Field | `required` prop → `aria-required` 자동 전파 + 시각적 `*` 마커 |
| role="alert" on error | ✅ Field | 에러 메시지는 즉시 스크린리더 낭독 |
| 키보드 네비게이션 (Tab/Space/Enter/Arrow) | ✅ 전 Radix 컴포넌트 | Radix가 WAI-ARIA Authoring Practices 준수 |
| indeterminate 지원 (Checkbox) | ✅ Checkbox | `checked="indeterminate"` 상태 + 가로 막대 아이콘 |
| range 슬라이더 (multi thumb) | ✅ Slider | `defaultValue={[20, 80]}` 배열 길이에 따라 Thumb 자동 렌더 |
| Light/Dark 대칭 | ✅ 전 컴포넌트 | 모든 색상이 `var(--surface-*)`, `var(--text-*)`, `var(--border-*)` 등 S7FE1 Semantic 토큰 참조 — `.dark` 자동 대응 |
| Reduced Motion | ✅ 전 컴포넌트 | `motion-reduce:transition-none` + `motion-reduce:animate-none` (Select) |
| 한국어 줄바꿈 | ✅ Textarea / Field 메시지 | `[word-break:keep-all]` |

### 6.1 남은 검증 (S7TS1 A11y 감사 Task에서 수행)

- [ ] axe-core 자동 스캔 (모든 variant 렌더 후)
- [ ] WCAG AA 대비율 검증 (`text-state-danger-fg` vs `bg-surface-1` 등)
- [ ] 스크린리더 실제 낭독 확인 (NVDA / VoiceOver)

---

## 7. S7FE3 Overlay 인계

본 10종 Primitive는 S7FE3(Overlay: Dialog/Popover/Tooltip/Toast/Sheet/DropdownMenu)에서 **재사용**된다. 주요 인계 사항:

### 7.1 Dialog/Sheet 내부에서 바로 사용 가능

```tsx
<Dialog>
  <DialogContent>
    <Field label="이름" required><Input /></Field>
    <Field label="설명"><Textarea /></Field>
    <div className="flex justify-end gap-2">
      <Button variant="ghost">취소</Button>
      <Button>저장</Button>
    </div>
  </DialogContent>
</Dialog>
```

### 7.2 Popover 내부의 복합 폼

`Popover` 콘텐츠 안에서 `Checkbox` + `RadioGroup` + `Slider` 조합이 필터 UI의 표준 패턴으로 사용될 것이다.

### 7.3 Toast의 `Action` 버튼

`<ToastAction asChild><Button variant="ghost" size="sm">되돌리기</Button></ToastAction>` 패턴으로 `asChild`가 쓰인다.

### 7.4 공통 Focus-ring 토큰

S7FE3의 Overlay 컴포넌트들도 **동일한 `ring-ring-focus` 토큰**을 사용해 시각 일관성을 유지할 것.

### 7.5 Motion 연동

- Select 드롭다운은 이미 `data-[state=open]:animate-in ... zoom-in-95` 패턴을 사용하고 있어, S7FE3의 Dialog/Popover도 **동일 키프레임 규약** (S7DS5의 5단 duration + spring easing)으로 통일한다.

---

## 8. 파일 절대 경로 (완료 산출물)

### 8.1 컴포넌트 10종

- `G:\내 드라이브\mychatbot-world\components\ui\button.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\input.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\select.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\checkbox.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\radio-group.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\switch.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\slider.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\textarea.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\label.tsx`
- `G:\내 드라이브\mychatbot-world\components\ui\field.tsx`

### 8.2 보고서 (본 문서)

- `G:\내 드라이브\mychatbot-world\SAL_Grid_Dev_Suite\Process\S0_Project-SAL-Grid_생성\2.sal-grid\task-results\S7FE2_integration.md`

### 8.3 Grid JSON

- `G:\내 드라이브\mychatbot-world\SAL_Grid_Dev_Suite\Process\S0_Project-SAL-Grid_생성\3.method\json\data\grid_records\S7FE2.json` (`task_status`: Executed, `task_progress`: 100)

---

## 9. 다음 단계

1. **PO 실행**: §5의 `npm install ...` 단일 라인 실행.
2. **PO 빌드 검증**: `C:\mcw-build` 환경에서 `npm run build` 또는 `npx tsc --noEmit` (한글 경로 회피).
3. **검증 에이전트**: `code-reviewer-core` 투입 → 토큰 사용 일관성, 접근성 체크리스트, Radix 패턴 준수 검증.
4. **S7FE3**: 본 Primitive들을 사용하는 Overlay 10종 (Dialog/AlertDialog/Popover/HoverCard/Tooltip/DropdownMenu/ContextMenu/Sheet/Drawer/Toast) 구축.

---

*리포트 종료 — S7FE2 Form Primitive 10종 구축 완료 (검증 대기).*
