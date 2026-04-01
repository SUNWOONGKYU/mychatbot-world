/**
 * @task S4FE3
 * @description Marketplace 페이지 — 목록, 상세, 업로드
 * Route: /marketplace/upload
 * API: POST /api/Backend_APIs/marketplace?action=publish
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 ──────────────────────────────────────────────────────────

interface FormData {
  skillName: string;
  description: string;
  longDescription: string;
  category: string;
  tags: string;
  price: string;
  botId: string;
}

interface FieldError {
  skillName?: string;
  description?: string;
  category?: string;
  price?: string;
  botId?: string;
}

// ── 상수 ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '', label: '카테고리 선택' },
  { value: 'productivity', label: '생산성' },
  { value: 'communication', label: '커뮤니케이션' },
  { value: 'analysis', label: '분석' },
  { value: 'education', label: '교육' },
  { value: 'entertainment', label: '엔터테인먼트' },
  { value: 'utility', label: '유틸리티' },
  { value: 'business', label: '비즈니스' },
  { value: 'other', label: '기타' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter((c) => c.value).map((c) => [c.value, c.label]),
);

const API_BASE = '/api/Backend_APIs/marketplace';

// ── 서브 컴포넌트 ──────────────────────────────────────────────────

function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-text-primary">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

function PreviewCard({ data }: { data: FormData }) {
  const categoryLabel = CATEGORY_LABELS[data.category] ?? '';
  const isFree = !data.price || Number(data.price) === 0;
  const parsedTags = data.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      {/* 미리보기 헤더 */}
      <p className="text-xs font-bold text-text-muted uppercase tracking-wider">미리보기</p>

      {/* 카드 */}
      <div className="bg-bg-subtle border border-border rounded-xl p-4 space-y-3">
        {/* 아이콘 + 가격 */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center text-2xl flex-shrink-0">
            🤖
          </div>
          <span
            className={clsx(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0',
              isFree ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
            )}
          >
            {isFree ? '무료' : `${Number(data.price || 0).toLocaleString()} 크레딧`}
          </span>
        </div>

        {/* 이름 */}
        <p className="text-base font-bold text-text-primary leading-tight">
          {data.skillName || <span className="text-text-muted italic">스킬 이름</span>}
        </p>

        {/* 한 줄 소개 */}
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
          {data.description || <span className="text-text-muted italic">한 줄 소개</span>}
        </p>

        {/* 카테고리 + 태그 */}
        <div className="flex flex-wrap gap-1.5">
          {categoryLabel && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary/80">
              {categoryLabel}
            </span>
          )}
          {parsedTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-muted border border-border text-text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────

export default function MarketplaceUploadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    skillName: '',
    description: '',
    longDescription: '',
    category: '',
    tags: '',
    price: '0',
    botId: '',
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // 미리보기 상태 (실시간 반영)
  const [preview, setPreview] = useState<FormData>(formData);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 폼 데이터 변경 시 미리보기 디바운스 업데이트
  useEffect(() => {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreview(formData);
    }, 150);
    return () => clearTimeout(previewTimer.current);
  }, [formData]);

  function updateField(key: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  // ── 유효성 검사 ────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: FieldError = {};

    if (!formData.skillName.trim()) {
      newErrors.skillName = '스킬 이름을 입력해주세요.';
    }
    if (!formData.description.trim()) {
      newErrors.description = '한 줄 소개를 입력해주세요.';
    } else if (formData.description.trim().length > 100) {
      newErrors.description = '한 줄 소개는 최대 100자입니다.';
    }
    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.';
    }
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = '올바른 가격을 입력해주세요 (0 이상).';
    }
    if (!formData.botId.trim()) {
      newErrors.botId = '챗봇 ID를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── 폼 제출 (게시) ─────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent, isDraft = false) {
    e.preventDefault();
    if (!isDraft && !validate()) return;

    setIsSubmitting(true);
    setAlertState({ type: null, message: '' });

    const authToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('sb-hlpovizxnrnspobddxmq-auth-token')
        : null;

    if (!authToken) {
      router.push('/login?redirect=/marketplace/upload');
      return;
    }

    try {
      const parsed = JSON.parse(authToken);
      const token = parsed?.access_token ?? parsed?.session?.access_token ?? null;

      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);

      const res = await fetch(`${API_BASE}?action=${isDraft ? 'draft' : 'publish'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          skillName: formData.skillName.trim(),
          description: formData.description.trim(),
          long_description: formData.longDescription.trim(),
          category: formData.category,
          tags,
          price: Number(formData.price),
          botId: formData.botId.trim(),
          is_draft: isDraft,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      if (isDraft) {
        setAlertState({ type: 'success', message: '임시 저장되었습니다.' });
      } else {
        setAlertState({
          type: 'success',
          message: '스킬이 성공적으로 업로드되었습니다!',
        });
        setTimeout(() => router.push('/marketplace'), 2000);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '업로드에 실패했습니다.';
      setAlertState({ type: 'error', message: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── 렌더 ──────────────────────────────────────────────────────

  const inputClass = (hasError?: string) =>
    clsx(
      'w-full px-3 py-2.5 rounded-lg text-sm',
      'border bg-surface text-text-primary',
      'placeholder:text-text-muted',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
      'transition-colors',
      hasError ? 'border-error' : 'border-border',
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3 pb-5 border-b border-border">
        <Link
          href="/marketplace"
          className={clsx(
            'w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0',
            'border border-border text-text-secondary',
            'hover:border-primary/40 hover:text-text-primary transition-colors',
          )}
          title="마켓플레이스로 돌아가기"
        >
          &larr;
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">스킬 업로드</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            마켓플레이스에 나만의 스킬을 공개하세요.
          </p>
        </div>
      </div>

      {/* 알림 배너 */}
      {alertState.type && (
        <div
          className={clsx(
            'flex items-center gap-2 p-3.5 rounded-lg text-sm font-medium',
            alertState.type === 'success'
              ? 'bg-success/10 border border-success/25 text-success'
              : 'bg-error/10 border border-error/20 text-error',
          )}
        >
          <span>{alertState.type === 'success' ? '✓' : '⚠'}</span>
          <span>{alertState.message}</span>
        </div>
      )}

      {/* 챗봇 ID 안내 */}
      <div className="flex items-start gap-2 p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary/80">
        <span className="flex-shrink-0 mt-0.5">ℹ</span>
        <span>
          스킬은 특정 챗봇과 연결됩니다. 마이페이지에서 봇 ID를 확인하세요.
        </span>
      </div>

      {/* 2컬럼 레이아웃: 폼 + 미리보기 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 폼 (2/3) */}
        <form
          className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 space-y-5"
          onSubmit={(e) => handleSubmit(e, false)}
          noValidate
        >
          {/* 스킬 이름 */}
          <FormField label="스킬 이름" required error={errors.skillName}>
            <input
              type="text"
              className={inputClass(errors.skillName)}
              placeholder="예: 이메일 요약 스킬"
              maxLength={80}
              value={formData.skillName}
              onChange={(e) => updateField('skillName', e.target.value)}
              autoComplete="off"
            />
          </FormField>

          {/* 한 줄 소개 */}
          <FormField
            label="한 줄 소개"
            required
            hint={`${formData.description.length}/100자`}
            error={errors.description}
          >
            <input
              type="text"
              className={inputClass(errors.description)}
              placeholder="이 스킬이 무엇을 하는지 간단히 설명해주세요."
              maxLength={100}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </FormField>

          {/* 상세 설명 */}
          <FormField
            label="상세 설명"
            hint="스킬의 상세 기능과 사용 방법을 설명하세요."
          >
            <textarea
              className={clsx(inputClass(), 'min-h-[140px] resize-y leading-relaxed')}
              placeholder="이 스킬이 무엇을 하는지 자세히 설명해주세요.&#10;&#10;예) 이 스킬은 이메일 내용을 분석하여 핵심 요약과 할 일 목록을 자동으로 생성합니다."
              maxLength={2000}
              value={formData.longDescription}
              onChange={(e) => updateField('longDescription', e.target.value)}
            />
          </FormField>

          {/* 카테고리 */}
          <FormField label="카테고리" required error={errors.category}>
            <select
              className={inputClass(errors.category)}
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* 태그 */}
          <FormField
            label="태그"
            hint="쉼표(,)로 구분하여 최대 5개까지 입력하세요."
          >
            <input
              type="text"
              className={inputClass()}
              placeholder="예: 이메일, 요약, 생산성"
              value={formData.tags}
              onChange={(e) => updateField('tags', e.target.value)}
            />
          </FormField>

          {/* 가격 */}
          <FormField
            label="구독 가격"
            hint="0을 입력하면 무료로 제공됩니다."
            error={errors.price}
          >
            <div className="relative">
              <input
                type="number"
                className={clsx(inputClass(errors.price), 'pr-24')}
                placeholder="0"
                min={0}
                max={99999}
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                크레딧 (0=무료)
              </span>
            </div>
          </FormField>

          {/* 구분선 */}
          <hr className="border-border" />

          {/* 챗봇 ID */}
          <FormField
            label="챗봇 ID"
            required
            hint="연결할 챗봇의 ID를 입력하세요. 마이페이지에서 확인할 수 있습니다."
            error={errors.botId}
          >
            <input
              type="text"
              className={inputClass(errors.botId)}
              placeholder="예: bot_abc123"
              value={formData.botId}
              onChange={(e) => updateField('botId', e.target.value)}
              autoComplete="off"
            />
          </FormField>

          {/* 액션 버튼 */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <Link
              href="/marketplace"
              className={clsx(
                'text-center px-5 py-2.5 rounded-lg text-sm font-semibold',
                'border border-border text-text-secondary',
                'hover:border-border-strong hover:text-text-primary transition-colors',
              )}
            >
              취소
            </Link>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
              className={clsx(
                'px-5 py-2.5 rounded-lg text-sm font-semibold',
                'border border-border text-text-secondary',
                'hover:border-border-strong hover:text-text-primary transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? '저장 중...' : '임시 저장'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                'inline-flex items-center justify-center gap-2',
                'px-6 py-2.5 rounded-lg text-sm font-bold',
                'bg-primary text-white hover:bg-primary-hover transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSubmitting ? '업로드 중...' : '게시하기'}
            </button>
          </div>
        </form>

        {/* 미리보기 (1/3) */}
        <div className="space-y-3">
          <PreviewCard data={preview} />
          <p className="text-xs text-center text-text-muted">
            입력값이 실시간으로 반영됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
