/**
 * @task skills-register-ui
 * @description 스킬 등록 폼 (크리에이터용)
 *
 * Route: /skills/register
 * API: POST /api/skills/register
 *   요청: { name, description, version?, category?, icon?, price?, tags?, readme? }
 *   응답: { success, data: { id, name, version, status, created_at, message } }
 */
'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 스킬 카테고리 (lib/skills-data.ts 와 동일)
const CATEGORIES = ['분석', '보안', '관리', '지식', 'UI', '비즈니스', '연동'] as const;

// ── 타입 ─────────────────────────────────────────────────────

interface FormValues {
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  price: number;          // 0 = 무료
  tags: string[];
  readme: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  general?: string;
}

const INITIAL_FORM: FormValues = {
  name: '',
  description: '',
  category: '',
  icon: '⚡',
  version: '1.0.0',
  price: 0,
  tags: [],
  readme: '',
};

// ── 태그 입력 ────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (value: string) => {
    const t = value.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      className="min-h-[44px] flex flex-wrap gap-2 px-3 py-2 rounded-xl cursor-text transition-colors"
      style={{
        background: 'rgb(var(--bg-base))',
        border: '1px solid rgb(var(--border))',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 text-sm px-2.5 py-0.5 rounded-lg"
          style={{
            background: 'rgb(var(--color-primary) / 0.12)',
            color: 'rgb(var(--color-primary))',
            border: '1px solid rgb(var(--color-primary) / 0.25)',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter(t => t !== tag)); }}
            className="leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? 'Enter/쉼표로 태그 추가 (예: AI, 번역, 생산성)' : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
        style={{ color: 'rgb(var(--text-primary-rgb))' }}
      />
    </div>
  );
}

// ── 메인 폼 ──────────────────────────────────────────────────

export default function SkillRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormValues>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = '스킬 이름을 입력해주세요.';
    else if (form.name.length > 80) newErrors.name = '스킬 이름은 80자를 초과할 수 없습니다.';
    if (!form.description.trim()) newErrors.description = '스킬 설명을 입력해주세요.';
    if (form.price < 0) newErrors.price = '가격은 0 이상이어야 합니다.';
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
      const res = await fetch('/api/skills/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category || undefined,
          icon: form.icon || undefined,
          version: form.version.trim() || '1.0.0',
          price: form.price,
          tags: form.tags.length > 0 ? form.tags : undefined,
          readme: form.readme.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '스킬 등록에 실패했습니다.');
      }

      setSuccess(true);
      setTimeout(() => router.push('/skills/my'), 1800);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : '오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-semibold mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
          스킬 등록 요청이 접수되었습니다!
        </p>
        <p className="text-sm" style={{ color: 'rgb(var(--text-secondary-rgb))' }}>
          관리자 검토 후 마켓에 공개됩니다. 내 스킬 페이지로 이동합니다...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/skills"
          className="text-sm transition-colors"
          style={{ color: 'rgb(var(--text-secondary-rgb))' }}
        >
          ← 스킬장터
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
        ⚡ 스킬 등록
      </h1>
      <p className="text-sm mb-8" style={{ color: 'rgb(var(--text-secondary-rgb))' }}>
        내가 만든 스킬을 마켓에 공유하세요. 관리자 검토 후 공개됩니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 일반 에러 */}
        {errors.general && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{
              background: 'rgb(var(--color-error) / 0.1)',
              border: '1px solid rgb(var(--color-error) / 0.25)',
              color: 'rgb(var(--color-error))',
            }}
          >
            {errors.general}
          </div>
        )}

        {/* 이름 + 아이콘 */}
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
              아이콘
            </label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
              maxLength={2}
              placeholder="⚡"
              className="w-full px-3 py-2.5 rounded-xl text-center text-2xl outline-none transition-colors"
              style={{
                background: 'rgb(var(--bg-base))',
                border: '1px solid rgb(var(--border))',
                color: 'rgb(var(--text-primary-rgb))',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
              스킬 이름 <span style={{ color: 'rgb(var(--color-error))' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="예: 실시간 번역 스킬"
              maxLength={80}
              className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors text-sm"
              style={{
                background: 'rgb(var(--bg-base))',
                border: errors.name ? '1px solid rgb(var(--color-error))' : '1px solid rgb(var(--border))',
                color: 'rgb(var(--text-primary-rgb))',
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-error))' }}>{errors.name}</p>
            )}
          </div>
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
            한 줄 설명 <span style={{ color: 'rgb(var(--color-error))' }}>*</span>
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="이 스킬이 어떤 일을 하는지 한 문장으로 설명해주세요"
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors text-sm"
            style={{
              background: 'rgb(var(--bg-base))',
              border: errors.description ? '1px solid rgb(var(--color-error))' : '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-primary-rgb))',
            }}
          />
          {errors.description && (
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-error))' }}>{errors.description}</p>
          )}
        </div>

        {/* 카테고리 + 버전 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
              카테고리
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors text-sm"
              style={{
                background: 'rgb(var(--bg-base))',
                border: '1px solid rgb(var(--border))',
                color: 'rgb(var(--text-primary-rgb))',
              }}
            >
              <option value="">선택 안 함</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
              버전
            </label>
            <input
              type="text"
              value={form.version}
              onChange={(e) => setForm(f => ({ ...f, version: e.target.value }))}
              placeholder="1.0.0"
              className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors text-sm"
              style={{
                background: 'rgb(var(--bg-base))',
                border: '1px solid rgb(var(--border))',
                color: 'rgb(var(--text-primary-rgb))',
              }}
            />
          </div>
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
            가격 (크레딧) — 0이면 무료
          </label>
          <input
            type="number"
            min={0}
            step={10}
            value={form.price}
            onChange={(e) => setForm(f => ({ ...f, price: Math.max(0, Number(e.target.value) || 0) }))}
            className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors text-sm"
            style={{
              background: 'rgb(var(--bg-base))',
              border: errors.price ? '1px solid rgb(var(--color-error))' : '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-primary-rgb))',
            }}
          />
          {errors.price && (
            <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-error))' }}>{errors.price}</p>
          )}
        </div>

        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
            태그
          </label>
          <TagInput
            tags={form.tags}
            onChange={(tags) => setForm(f => ({ ...f, tags }))}
          />
          <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
            검색·필터에 도움이 됩니다. Enter 또는 쉼표로 추가.
          </p>
        </div>

        {/* README */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-primary-rgb))' }}>
            상세 설명 (README)
          </label>
          <textarea
            value={form.readme}
            onChange={(e) => setForm(f => ({ ...f, readme: e.target.value }))}
            placeholder="사용 방법, 입력/출력 예시, 주의사항 등 자세한 정보를 Markdown 형식으로 작성하세요."
            rows={8}
            className="w-full px-4 py-2.5 rounded-xl outline-none transition-colors text-sm resize-y font-mono"
            style={{
              background: 'rgb(var(--bg-base))',
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-primary-rgb))',
            }}
          />
        </div>

        {/* 안내 */}
        <div
          className="p-4 rounded-xl text-xs"
          style={{
            background: 'rgb(var(--color-primary) / 0.08)',
            border: '1px solid rgb(var(--color-primary) / 0.2)',
            color: 'rgb(var(--text-secondary-rgb))',
          }}
        >
          📌 등록 즉시 마켓에 공개되지 않습니다. 관리자가 내용을 검토한 뒤 <b>pending → published</b>로 승인하면 스킬장터에 노출됩니다.
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-secondary-rgb))',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-8 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
            style={{
              background: 'rgb(var(--color-primary))',
              color: 'rgb(var(--text-on-primary))',
            }}
          >
            {submitting ? '등록 중...' : '⚡ 스킬 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
