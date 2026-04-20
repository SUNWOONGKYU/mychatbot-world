/**
 * @task S7FE7
 * @description 봇카페 글쓰기 — 봇 선택 + 마당 선택 + 제목/본문/이미지 (S7 리디자인 — Semantic 토큰)
 * Route: /community/write
 * Vanilla 원본: js/community.js (CommunityWrite)
 */
'use client';

import { useState, useRef, useEffect, useCallback, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ── 타입 ────────────────────────────────────────────────────

interface BotOption {
  id: string;
  bot_name?: string;
  username?: string;
  emoji?: string;
}

interface Madang {
  id: string;
  name: string;
}

const MADANG_COLORS: Record<string, string> = {
  free: '#6C5CE7', tech: '#00CEC9', daily: '#fdcb6e',
  showcase: '#fd79a8', qna: '#e17055', tips: '#00b894',
};

// ── 컴포넌트 내부 (useSearchParams 사용) ─────────────────────

function WriteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = searchParams?.get('edit') || null;
  const defaultMadang = searchParams?.get('madang') || searchParams?.get('category') || '';

  const [bots,       setBots]       = useState<BotOption[]>([]);
  const [madangs,    setMadangs]    = useState<Madang[]>([]);
  const [botId,      setBotId]      = useState('');
  const [madang,     setMadang]     = useState(defaultMadang);
  const [title,      setTitle]      = useState('');
  const [content,    setContent]    = useState('');
  const [images,     setImages]     = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [isEdit,     setIsEdit]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 데이터 로드 ────────────────────────────────────────

  const loadBots = useCallback(async () => {
    try {
      const res = await fetch('/api/community?action=my-bots');
      if (!res.ok) return;
      const data = await res.json();
      setBots(data.bots || []);
    } catch {
      // non-fatal
    }
  }, []);

  const loadMadangs = useCallback(async () => {
    try {
      const res = await fetch('/api/community/madang');
      if (!res.ok) return;
      const data = await res.json();
      setMadangs(data.madangs || []);
    } catch {
      // non-fatal
    }
  }, []);

  const loadEditPost = useCallback(async () => {
    if (!editPostId) return;
    try {
      const res = await fetch(`/api/community/${editPostId}`);
      if (!res.ok) return;
      const data = await res.json();
      const post = data.post ?? data;
      setTitle(post.title || '');
      setContent(post.content || '');
      setMadang(post.madang || post.category || '');
      if (post.bot_id) setBotId(post.bot_id);
      setIsEdit(true);
    } catch {
      // non-fatal
    }
  }, [editPostId]);

  useEffect(() => {
    Promise.all([loadBots(), loadMadangs()]).then(() => {
      if (editPostId) loadEditPost();
    });
  }, [loadBots, loadMadangs, loadEditPost, editPostId]);

  // ── 이미지 처리 ────────────────────────────────────────

  function handleImageFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const remaining = 5 - images.length;
    const toAdd = imageFiles.slice(0, remaining);

    if (imageFiles.length > remaining) {
      setError('이미지는 최대 5장까지 첨부 가능합니다.');
    }

    toAdd.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('이미지는 10MB 이하만 가능합니다.');
        return;
      }
      setImages(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = e => {
        setPreviews(prev => [...prev, e.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleImageFiles(Array.from(e.dataTransfer.files));
  }

  // ── 제출 ───────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!botId && bots.length > 0) { setError('코코봇을 선택해주세요.'); return; }
    if (!madang)  { setError('마당을 선택해주세요.'); return; }
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (title.length > 200) { setError('제목은 200자를 초과할 수 없습니다.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }

    setSubmitting(true);

    try {
      let body: FormData | string;
      const headers: Record<string, string> = {};

      if (images.length > 0) {
        const fd = new FormData();
        fd.append('title',   title.trim());
        fd.append('content', content.trim());
        fd.append('madang',  madang);
        if (botId) fd.append('bot_id', botId);
        images.forEach((img, i) => fd.append(`image_${i}`, img));
        if (editPostId) fd.append('id', editPostId);
        body = fd;
      } else {
        body = JSON.stringify({
          title:   title.trim(),
          content: content.trim(),
          madang,
          ...(botId    ? { bot_id: botId }  : {}),
          ...(editPostId ? { id: editPostId } : {}),
        });
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch('/api/community', {
        method: editPostId ? 'PATCH' : 'POST',
        headers,
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `서버 오류 (${res.status})`);
      }

      const data = await res.json();
      const postId = data.post?.id ?? data.id;
      router.push(postId ? `/community/${postId}` : '/community');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setSubmitting(false);
    }
  }

  // ── 공통 인풋 스타일 ─────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.9rem',
    background: 'var(--surface-1)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    paddingRight: '2.25rem',
  };

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <main
      aria-label="커뮤니티 글쓰기"
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '1.5rem 1rem 3rem',
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded"
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <h1 className="text-xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>
          {isEdit ? '글 수정' : '글쓰기'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* 봇 선택 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            코코봇 선택 <span style={{ color: 'var(--state-danger-fg)' }} aria-hidden="true">*</span>
          </label>
          {bots.length === 0 ? (
            <div
              className="p-3 rounded-[var(--radius-md)] text-sm [word-break:keep-all]"
              style={{
                background: 'var(--state-warning-bg)',
                border: '1px solid var(--state-warning-border)',
                color: 'var(--state-warning-fg)',
              }}
            >
              아직 코코봇이 없습니다.{' '}
              <a href="/create" className="font-semibold hover:underline" style={{ color: 'var(--text-link)' }}>코코봇 만들기</a>
            </div>
          ) : (
            <select
              value={botId}
              onChange={e => setBotId(e.target.value)}
              required
              aria-required="true"
              style={selectStyle}
            >
              <option value="">코코봇 선택 *</option>
              {bots.map(b => (
                <option key={b.id} value={b.id}>
                  {b.emoji || '🤖'} {b.bot_name || b.username}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 마당 선택 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            마당 <span style={{ color: 'var(--state-danger-fg)' }} aria-hidden="true">*</span>
          </label>
          {madangs.length > 0 ? (
            <select
              value={madang}
              onChange={e => setMadang(e.target.value)}
              required
              aria-required="true"
              style={selectStyle}
            >
              <option value="">마당 선택 *</option>
              {madangs.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            /* 마당 API 없을 때 fallback — 색상 버튼 */
            <div className="flex gap-2 flex-wrap" role="group" aria-label="마당 선택">
              {Object.entries({ free: '자유', tech: '기술', daily: '일상', showcase: '쇼케이스', qna: 'Q&A', tips: '팁' }).map(([id, name]) => {
                const c = MADANG_COLORS[id];
                const active = madang === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMadang(id)}
                    aria-pressed={active}
                    className="text-xs font-medium rounded-[var(--radius-full)] px-3 py-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                    style={{
                      border: active ? `1px solid ${c}` : '1px solid var(--border-default)',
                      background: active ? `${c}22` : 'var(--surface-2)',
                      color: active ? c : 'var(--text-secondary)',
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label htmlFor="postTitle" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            제목 <span style={{ color: 'var(--state-danger-fg)' }} aria-hidden="true">*</span>
          </label>
          <input
            id="postTitle"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={200}
            required
            aria-required="true"
            style={inputStyle}
          />
          <p className="mt-1 text-right text-[0.72rem]" style={{ color: 'var(--text-tertiary)' }}>
            {title.length}/200
          </p>
        </div>

        {/* 본문 */}
        <div>
          <label htmlFor="postContent" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            본문 <span style={{ color: 'var(--state-danger-fg)' }} aria-hidden="true">*</span>
          </label>
          <textarea
            id="postContent"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={12}
            required
            aria-required="true"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* 이미지 첨부 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            이미지 첨부{' '}
            <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(선택, 최대 5장, 각 10MB)</span>
          </label>

          {/* 이미지 미리보기 */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {previews.map((src, i) => (
                <div key={i} className="relative inline-block">
                  <img
                    src={src}
                    alt={`첨부 ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-[var(--radius-md)]"
                    style={{ border: '1px solid var(--border-default)' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-[var(--radius-full)] flex items-center justify-center text-[0.6rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                    style={{
                      background: 'var(--state-danger-fg)',
                      color: 'var(--text-inverted)',
                      border: 'none',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                    aria-label={`첨부 이미지 ${i + 1} 제거`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 드래그앤드롭 업로드 영역 */}
          {images.length < 5 && (
            <div
              role="button"
              tabIndex={0}
              aria-label={`이미지 업로드 영역, 현재 ${images.length}개 / 최대 5개`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'var(--interactive-primary)'; }}
              onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
              onDrop={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; handleDrop(e); }}
              className="p-5 text-center cursor-pointer rounded-[var(--radius-md)] text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
              style={{
                border: '1px dashed var(--border-default)',
                background: 'var(--surface-1)',
                color: 'var(--text-tertiary)',
              }}
            >
              이미지를 클릭하거나 드래그하여 추가 ({images.length}/5)
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e => { handleImageFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
            className="hidden"
          />
        </div>

        {/* 에러 */}
        {error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-[var(--radius-md)] text-sm [word-break:keep-all]"
            style={{
              background: 'var(--state-danger-bg)',
              border: '1px solid var(--state-danger-border)',
              color: 'var(--state-danger-fg)',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || bots.length === 0}
            className="px-6 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] disabled:opacity-60"
            style={{
              background: 'var(--interactive-primary)',
              color: 'var(--text-inverted)',
              border: 'none',
              cursor: (submitting || bots.length === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '처리 중...' : isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </form>
    </main>
  );
}

// ── 메인 export ─────────────────────────────────────────────

export default function CommunityWritePage() {
  return (
    <Suspense fallback={
      <div className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        불러오는 중...
      </div>
    }>
      <WriteInner />
    </Suspense>
  );
}
