/**
 * @task S3FE2
 * @description 스킬 리뷰/평점 작성 컴포넌트
 * 별점 UI (1~5), 리뷰 텍스트 입력, POST /api/skills/review
 */
'use client';

import { useState } from 'react';
import clsx from 'clsx';

// ── 타입 ────────────────────────────────────────────────────────

interface ReviewFormProps {
  skillId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ── 서브 컴포넌트: 별점 인풋 ─────────────────────────────────────

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  const LABELS: Record<number, string> = {
    1: '별로예요',
    2: '그저 그래요',
    3: '보통이에요',
    4: '좋아요',
    5: '최고예요',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange(star)}
              className={clsx(
                'text-3xl transition-all duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded',
                'hover:scale-110',
                active ? 'text-warning' : 'text-bg-muted hover:text-warning/60',
              )}
              aria-label={`${star}점`}
              aria-pressed={value === star}
            >
              ★
            </button>
          );
        })}
      </div>
      {(hovered > 0 || value > 0) && (
        <p className="text-xs text-text-secondary font-medium">
          {LABELS[hovered || value]}
        </p>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────

export function ReviewForm({ skillId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (rating === 0) return '별점을 선택해주세요.';
    if (comment.trim().length < 10) return '리뷰는 최소 10자 이상 작성해주세요.';
    if (comment.trim().length > 500) return '리뷰는 500자 이내로 작성해주세요.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/skills/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_id: skillId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      setSuccess(true);
      // 0.8초 후 콜백 호출
      setTimeout(() => onSuccess?.(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '리뷰 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 성공 상태
  if (success) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
        <span className="text-3xl">🎉</span>
        <p className="text-sm font-medium text-success mt-2">리뷰가 등록되었습니다!</p>
      </div>
    );
  }

  // ── 렌더 ────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-5 space-y-4"
      noValidate
    >
      <h3 className="text-sm font-semibold text-text-primary">리뷰 작성</h3>

      {/* 별점 */}
      <div className="space-y-1.5">
        <label className="block text-sm text-text-secondary">
          평점 <span className="text-error text-xs">*</span>
        </label>
        <StarInput value={rating} onChange={setRating} />
      </div>

      {/* 리뷰 텍스트 */}
      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="block text-sm text-text-secondary">
          리뷰 내용 <span className="text-error text-xs">*</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="이 스킬에 대한 솔직한 리뷰를 남겨주세요. (10자 이상)"
          rows={4}
          maxLength={500}
          className={clsx(
            'w-full px-3 py-2.5 rounded-lg text-sm resize-y',
            'border border-border bg-bg-base text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'transition-colors',
          )}
        />
        <div className="flex items-center justify-between">
          <span
            className={clsx(
              'text-xs',
              comment.length > 450 ? 'text-warning' : 'text-text-muted',
            )}
          >
            {comment.length} / 500
          </span>
          {comment.length > 0 && comment.trim().length < 10 && (
            <span className="text-xs text-text-muted">
              {10 - comment.trim().length}자 더 입력해주세요
            </span>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex items-center justify-end gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'border border-border text-text-secondary',
              'hover:bg-surface-hover transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0 || comment.trim().length < 10}
          className={clsx(
            'px-5 py-2 rounded-lg text-sm font-semibold',
            'bg-primary text-white',
            'hover:bg-primary-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin text-xs">⟳</span>
              등록 중...
            </span>
          ) : (
            '리뷰 등록'
          )}
        </button>
      </div>
    </form>
  );
}
