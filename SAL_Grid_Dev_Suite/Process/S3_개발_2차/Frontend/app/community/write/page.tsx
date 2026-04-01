/**
 * @task S3FE4
 * @description 커뮤니티 글쓰기 페이지
 * Route: /community/write
 * - 제목, 카테고리, 본문 입력
 * - 이미지 첨부 (optional)
 * - POST /api/community 호출 → 작성 완료 시 상세 페이지로 이동
 */
'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// ── 타입 ────────────────────────────────────────────────────

type Category = 'general' | 'qna' | 'showcase' | 'feedback';

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'general',  label: '자유' },
  { value: 'qna',      label: 'Q&A' },
  { value: 'showcase', label: '쇼케이스' },
  { value: 'feedback', label: '피드백' },
];

// ── 컴포넌트 ─────────────────────────────────────────────────

export default function CommunityWritePage() {
  const router = useRouter();

  const [title,      setTitle]      = useState('');
  const [category,   setCategory]   = useState<Category>('general');
  const [content,    setContent]    = useState('');
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 이미지 선택 ──────────────────────────────────────────

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── 제출 ─────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim())   { setError('제목을 입력하세요.'); return; }
    if (!content.trim()) { setError('본문을 입력하세요.'); return; }

    setSubmitting(true);
    setError(null);

    try {
      // 이미지가 있으면 FormData, 없으면 JSON
      let body: FormData | string;
      let headers: Record<string, string> = {};

      if (imageFile) {
        const fd = new FormData();
        fd.append('title',    title.trim());
        fd.append('category', category);
        fd.append('content',  content.trim());
        fd.append('image',    imageFile);
        body = fd;
      } else {
        body = JSON.stringify({ title: title.trim(), category, content: content.trim() });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch('/api/community', {
        method: 'POST',
        headers,
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `서버 오류 (${res.status})`);
      }

      const data = await res.json();
      const newId = data.post?.id ?? data.id;
      router.push(newId ? `/community/${newId}` : '/community');
    } catch (err) {
      setError(err instanceof Error ? err.message : '작성 실패');
      setSubmitting(false);
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-text-muted hover:text-text-primary transition-colors"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-text-primary">글쓰기</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            카테고리
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors
                  ${category === opt.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">
            제목 <span className="text-error">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface
                       text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition"
          />
          <p className="mt-1 text-xs text-right text-text-muted">{title.length}/200</p>
        </div>

        {/* 본문 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-text-secondary mb-2">
            본문 <span className="text-error">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={12}
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface
                       text-text-primary placeholder:text-text-muted resize-y
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition"
          />
        </div>

        {/* 이미지 첨부 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            이미지 첨부 <span className="text-text-muted">(선택)</span>
          </label>

          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="첨부 이미지 미리보기"
                className="max-h-48 rounded-lg border border-border object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full
                           bg-error text-white text-xs flex items-center justify-center
                           hover:bg-error/80 transition-colors"
                aria-label="이미지 제거"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed
                         border-border text-text-muted hover:border-primary hover:text-primary
                         transition-colors text-sm"
            >
              <span>이미지 선택</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-error bg-error/10 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        {/* 제출 버튼 */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm rounded-lg border border-border
                       text-text-secondary hover:bg-surface-hover transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-medium rounded-lg
                       bg-primary text-white hover:bg-primary-hover
                       disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '등록 중…' : '게시하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
