/**
 * @task S3FE3
 * @description 채용 공고 등록 폼 (고용주용)
 *
 * Route: /jobs/create
 * API: POST /api/jobs
 *   요청: { title, description?, required_skills?, budget_min?, budget_max? }
 */
'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── 타입 ─────────────────────────────────────────────────────

interface FormValues {
  title: string;
  description: string;
  required_skills: string[];
  budget_min: number | null;
  budget_max: number | null;
}

interface FormErrors {
  title?: string;
  budget?: string;
  general?: string;
}

// ── 상수 ─────────────────────────────────────────────────────

const BUDGET_PRESETS = [
  { label: '~50만원',       min: 0,      max: 500_000 },
  { label: '50~100만원',    min: 500_000, max: 1_000_000 },
  { label: '100~300만원',   min: 1_000_000, max: 3_000_000 },
  { label: '300만원~',      min: 3_000_000, max: null },
];

const BUDGET_MAX_SOFT = 10_000_000; // 슬라이더 최대값 (1000만원)

// ── 스킬 태그 입력 ────────────────────────────────────────────

interface SkillTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

function SkillTagInput({ skills, onChange }: SkillTagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addSkill = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    onChange([...skills, trimmed]);
    setInput('');
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s: any) => s !== skill));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === 'Backspace' && !input && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div
      className="min-h-[44px] flex flex-wrap gap-2 px-3 py-2 bg-bg-base border border-border rounded-xl cursor-text focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm px-2.5 py-0.5 rounded-lg border border-primary/20"
        >
          {skill}
          <button
            type="button"
            onClick={(e: any) => { e.stopPropagation(); removeSkill(skill); }}
            className="text-primary/60 hover:text-primary leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e: any) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addSkill(input); }}
        placeholder={skills.length === 0 ? 'Enter/쉼표로 태그 추가 (예: React, TypeScript)' : ''}
        className="flex-1 min-w-[120px] bg-transparent text-text-primary text-sm outline-none placeholder-text-muted"
      />
    </div>
  );
}

// ── 예산 슬라이더 ─────────────────────────────────────────────

interface BudgetSliderProps {
  minVal: number | null;
  maxVal: number | null;
  onChange: (min: number | null, max: number | null) => void;
}

function BudgetSlider({ minVal, maxVal, onChange }: BudgetSliderProps) {
  const minDisplay = minVal !== null ? minVal : 0;
  const maxDisplay = maxVal !== null ? maxVal : BUDGET_MAX_SOFT;

  const handleMinChange = (v: number) => {
    const clamped = Math.min(v, maxDisplay - 1);
    onChange(clamped || null, maxVal);
  };

  const handleMaxChange = (v: number) => {
    const clamped = Math.max(v, minDisplay + 1);
    onChange(minVal, clamped === BUDGET_MAX_SOFT ? null : clamped);
  };

  const pct = (val: number) => Math.round((val / BUDGET_MAX_SOFT) * 100);

  return (
    <div className="space-y-3">
      {/* 프리셋 버튼 */}
      <div className="flex flex-wrap gap-2">
        {BUDGET_PRESETS.map((p: any) => {
          const active =
            (minVal ?? 0) === p.min &&
            (maxVal === null ? p.max === null : maxVal === p.max);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.min || null, p.max)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-text-secondary hover:border-primary hover:text-primary'
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            minVal === null && maxVal === null
              ? 'bg-primary text-white border-primary'
              : 'border-border text-text-secondary hover:border-primary hover:text-primary'
          }`}
        >
          협의 가능
        </button>
      </div>

      {/* 슬라이더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted w-10 shrink-0">최소</span>
          <input
            type="range"
            min={0}
            max={BUDGET_MAX_SOFT}
            step={100_000}
            value={minDisplay}
            onChange={(e: any) => handleMinChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-text-secondary w-24 text-right shrink-0">
            {minVal !== null ? `${minVal.toLocaleString('ko-KR')}원` : '제한 없음'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted w-10 shrink-0">최대</span>
          <input
            type="range"
            min={0}
            max={BUDGET_MAX_SOFT}
            step={100_000}
            value={maxDisplay}
            onChange={(e: any) => handleMaxChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-text-secondary w-24 text-right shrink-0">
            {maxVal !== null ? `${maxVal.toLocaleString('ko-KR')}원` : `${BUDGET_MAX_SOFT.toLocaleString('ko-KR')}원+`}
          </span>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="text-sm text-primary font-medium">
        {minVal === null && maxVal === null
          ? '예산: 협의 가능'
          : minVal !== null && maxVal !== null
          ? `예산: ${minVal.toLocaleString('ko-KR')}원 ~ ${maxVal.toLocaleString('ko-KR')}원`
          : minVal !== null
          ? `예산: ${minVal.toLocaleString('ko-KR')}원 이상`
          : `예산: ${maxVal!.toLocaleString('ko-KR')}원 이하`}
      </div>
    </div>
  );
}

// ── 메인 폼 ──────────────────────────────────────────────────

const INITIAL_FORM: FormValues = {
  title: '',
  description: '',
  required_skills: [],
  budget_min: null,
  budget_max: null,
};

export default function JobCreatePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormValues>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (form.title.length > 200) {
      newErrors.title = '제목은 200자를 초과할 수 없습니다.';
    }
    if (
      form.budget_min !== null &&
      form.budget_max !== null &&
      form.budget_min > form.budget_max
    ) {
      newErrors.budget = '최소 예산이 최대 예산보다 클 수 없습니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('sb-access-token') ?? '';
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          required_skills: form.required_skills.length > 0 ? form.required_skills : undefined,
          budget_min: form.budget_min ?? undefined,
          budget_max: form.budget_max ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '채용 공고 등록에 실패했습니다.');
      }

      const data = await res.json();
      setSuccess(true);
      // 등록 완료 후 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/jobs/${data.job.id}`);
      }, 1500);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : '오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-4xl mb-4">✅</p>
        <p className="text-xl font-semibold text-text-primary mb-2">채용 공고가 등록되었습니다!</p>
        <p className="text-text-secondary text-sm">상세 페이지로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/jobs"
          className="text-text-secondary hover:text-primary text-sm transition-colors"
        >
          ← 목록
        </Link>
        <h1 className="text-xl font-bold text-text-primary">채용 공고 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 일반 에러 */}
        {errors.general && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
            {errors.general}
          </div>
        )}

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            공고 제목 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e: any) => setForm((f: any) => ({ ...f, title: e.target.value }))}
            placeholder="예: React/Next.js 코코봇 UI 개발자 모집"
            maxLength={200}
            className={`w-full px-4 py-2.5 bg-bg-base border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-sm ${
              errors.title ? 'border-error' : 'border-border focus:border-primary'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.title ? (
              <p className="text-error text-xs">{errors.title}</p>
            ) : (
              <span />
            )}
            <span className="text-text-muted text-xs">{form.title.length}/200</span>
          </div>
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            공고 설명
          </label>
          <textarea
            value={form.description}
            onChange={(e: any) => setForm((f: any) => ({ ...f, description: e.target.value }))}
            placeholder="채용 공고에 대한 상세 내용을 입력해주세요. 업무 범위, 조건, 우대사항 등을 포함하면 좋습니다."
            rows={5}
            className="w-full px-4 py-2.5 bg-bg-base border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm resize-y"
          />
        </div>

        {/* 필요 스킬 */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            필요 스킬
          </label>
          <SkillTagInput
            skills={form.required_skills}
            onChange={(skills) => setForm((f: any) => ({ ...f, required_skills: skills }))}
          />
          <p className="text-text-muted text-xs mt-1">
            Enter 또는 쉼표로 태그를 추가합니다. Backspace로 마지막 태그를 삭제합니다.
          </p>
        </div>

        {/* 예산 */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            예산 범위
          </label>
          {errors.budget && (
            <p className="text-error text-xs mb-2">{errors.budget}</p>
          )}
          <div className="bg-bg-subtle border border-border rounded-xl p-4">
            <BudgetSlider
              minVal={form.budget_min}
              maxVal={form.budget_max}
              onChange={(min: any, max: any) => setForm((f: any) => ({ ...f, budget_min: min, budget_max: max }))}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="flex-1 sm:flex-none px-6 py-2.5 border border-border text-text-secondary rounded-xl hover:bg-surface-hover transition-colors text-sm"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-none px-8 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-60 transition-colors text-sm"
          >
            {submitting ? '등록 중...' : '공고 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
