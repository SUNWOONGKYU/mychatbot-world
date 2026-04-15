/**
 * @task S3F10 (React 전환)
 * @description 구봇구직 고용 요청 폼 — validate 로직 단위 테스트
 *
 * 대상: HirePageInner의 validate() 함수 (폼 유효성 검증)
 * 순수 함수로 추출하여 테스트
 */

import { describe, it, expect } from 'vitest';

// ── FormState 타입 (인라인 복제) ─────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  duration: string;
  category: string;
  budget_min: string;
  budget_max: string;
  requirements: string;
  agree: boolean;
}

// ── validate 함수 (인라인 복제 — 동일 로직) ─────────────────────────────────

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (!form.title.trim())       e.title       = '필수 항목입니다.';
  if (!form.description.trim()) e.description = '필수 항목입니다.';
  if (!form.duration)           e.duration    = '기간을 선택해주세요.';
  if (!form.category)           e.category    = '카테고리를 선택해주세요.';
  if (!form.agree)              e.agree       = '이용약관에 동의해주세요.';
  if (form.budget_min && isNaN(Number(form.budget_min))) e.budget_min = '숫자만 입력해주세요.';
  if (form.budget_max && isNaN(Number(form.budget_max))) e.budget_max = '숫자만 입력해주세요.';
  if (
    form.budget_min && form.budget_max &&
    !isNaN(Number(form.budget_min)) && !isNaN(Number(form.budget_max)) &&
    Number(form.budget_min) > Number(form.budget_max)
  ) {
    e.budget_min = '최소 예산은 최대 예산보다 클 수 없습니다.';
  }
  return e;
}

const validForm: FormState = {
  title: '쇼핑몰 챗봇 개발',
  description: '자세한 설명입니다.',
  duration: '1week',
  category: 'development',
  budget_min: '',
  budget_max: '',
  requirements: '',
  agree: true,
};

// ── 기본 필수 필드 ────────────────────────────────────────────────────────────

describe('validate — 필수 필드', () => {
  it('모든 필수 필드가 있으면 에러 없음', () => {
    expect(Object.keys(validate(validForm)).length).toBe(0);
  });

  it('title이 비어있으면 에러', () => {
    const errors = validate({ ...validForm, title: '' });
    expect(errors.title).toBeDefined();
  });

  it('title이 공백만이면 에러', () => {
    const errors = validate({ ...validForm, title: '   ' });
    expect(errors.title).toBeDefined();
  });

  it('description이 비어있으면 에러', () => {
    const errors = validate({ ...validForm, description: '' });
    expect(errors.description).toBeDefined();
  });

  it('duration이 미선택이면 에러', () => {
    const errors = validate({ ...validForm, duration: '' });
    expect(errors.duration).toBeDefined();
  });

  it('category가 미선택이면 에러', () => {
    const errors = validate({ ...validForm, category: '' });
    expect(errors.category).toBeDefined();
  });

  it('agree가 false이면 에러', () => {
    const errors = validate({ ...validForm, agree: false });
    expect(errors.agree).toBeDefined();
  });
});

// ── 예산 검증 ─────────────────────────────────────────────────────────────────

describe('validate — 예산 범위', () => {
  it('예산 비어있으면 오류 없음 (협의)', () => {
    const errors = validate({ ...validForm, budget_min: '', budget_max: '' });
    expect(errors.budget_min).toBeUndefined();
    expect(errors.budget_max).toBeUndefined();
  });

  it('budget_min에 숫자 아닌 값 → 에러', () => {
    const errors = validate({ ...validForm, budget_min: 'abc' });
    expect(errors.budget_min).toMatch('숫자만');
  });

  it('budget_max에 숫자 아닌 값 → 에러', () => {
    const errors = validate({ ...validForm, budget_max: 'xyz' });
    expect(errors.budget_max).toMatch('숫자만');
  });

  it('min > max이면 에러 (교차 검증)', () => {
    const errors = validate({ ...validForm, budget_min: '200000', budget_max: '50000' });
    expect(errors.budget_min).toMatch('최소 예산');
  });

  it('min <= max이면 에러 없음', () => {
    const errors = validate({ ...validForm, budget_min: '50000', budget_max: '200000' });
    expect(errors.budget_min).toBeUndefined();
    expect(errors.budget_max).toBeUndefined();
  });

  it('min == max이면 에러 없음 (동일 값)', () => {
    const errors = validate({ ...validForm, budget_min: '100000', budget_max: '100000' });
    expect(errors.budget_min).toBeUndefined();
  });

  it('한쪽만 입력해도 에러 없음', () => {
    const errors = validate({ ...validForm, budget_min: '50000', budget_max: '' });
    expect(errors.budget_min).toBeUndefined();
  });
});

// ── 복합 오류 ─────────────────────────────────────────────────────────────────

describe('validate — 복합 오류', () => {
  it('빈 폼 제출 시 5개 오류 (title/description/duration/category/agree)', () => {
    const errors = validate({
      title: '', description: '', duration: '', category: '',
      budget_min: '', budget_max: '', requirements: '', agree: false,
    });
    expect(Object.keys(errors).length).toBe(5);
  });

  it('requirements는 선택 항목 — 비어있어도 에러 없음', () => {
    const errors = validate({ ...validForm, requirements: '' });
    expect(errors.requirements).toBeUndefined();
  });
});
