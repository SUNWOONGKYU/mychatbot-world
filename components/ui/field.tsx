// @task S7FE2 — Primitive (Composite): Field
// 기반: S7FE1 토큰 + S7DS3 원칙 (Accessible, Clarity, Korean First Citizen)
// Label + Control + Helper/Error 래퍼, ARIA(aria-describedby, aria-invalid, aria-required) 자동 연결

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

export interface FieldProps {
  /** 레이블 텍스트 — 생략 시 레이블 렌더링 안 함 */
  label?: React.ReactNode;
  /** 도움말 — 입력 아래 보조 텍스트 */
  helperText?: React.ReactNode;
  /** 에러 메시지 — 존재하면 helperText 대체, aria-invalid 자동 부여 */
  error?: React.ReactNode;
  /** 필수 표시 (*) */
  required?: boolean;
  /** 외부에서 id를 지정할 경우 사용. 미지정 시 useId로 자동 생성 */
  id?: string;
  /** 추가 className (wrapper) */
  className?: string;
  /**
   * 자식 요소 — 렌더 프롭 또는 단일 React element.
   *
   * - 렌더 프롭: `(controlProps) => <Input {...controlProps} />`
   * - 단일 element: cloneElement로 ARIA 속성을 자동 주입
   */
  children:
    | React.ReactElement
    | ((controlProps: FieldControlProps) => React.ReactNode);
}

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  required?: boolean;
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    { label, helperText, error, required, id: idProp, className, children },
    ref
  ) => {
    const autoId = React.useId();
    const id = idProp ?? `field-${autoId}`;
    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
      [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const isInvalid = Boolean(error);

    const controlProps: FieldControlProps = {
      id,
      'aria-describedby': describedBy,
      'aria-invalid': isInvalid || undefined,
      'aria-required': required || undefined,
      required,
    };

    let rendered: React.ReactNode;
    if (typeof children === 'function') {
      rendered = children(controlProps);
    } else if (React.isValidElement(children)) {
      rendered = React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        controlProps
      );
    } else {
      rendered = children;
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-1.5', className)}
      >
        {label ? (
          <Label htmlFor={id}>
            {label}
            {required ? (
              <span
                aria-hidden="true"
                className="ml-0.5 text-state-danger-fg"
              >
                *
              </span>
            ) : null}
          </Label>
        ) : null}

        {rendered}

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-sans text-state-danger-fg [word-break:keep-all]"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="text-xs font-sans text-text-tertiary [word-break:keep-all]"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Field.displayName = 'Field';

export { Field };
