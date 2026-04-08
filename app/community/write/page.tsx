/**
 * @task S3FE4 (Vanilla→React 전환)
 * @description 봇카페 글쓰기 — 봇 선택 + 마당 선택 + 제목/본문/이미지
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

    if (!botId && bots.length > 0) { setError('챗봇을 선택해주세요.'); return; }
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

  // ── 렌더 ─────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.9rem',
    background: 'rgb(var(--bg-surface-hover) / 0.5)',
    border: '1px solid rgb(var(--border))',
    borderRadius: '8px', color: '#fff',
    fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
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

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none',
            color: 'rgb(var(--text-muted))', cursor: 'pointer',
            fontSize: '0.875rem', padding: 0, transition: 'color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-primary))'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-muted))'; }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(var(--text-primary))', margin: 0 }}>
          {isEdit ? '글 수정' : '글쓰기'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* 봇 선택 */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>
            챗봇 선택 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {bots.length === 0 ? (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: '8px', fontSize: '0.82rem', color: 'rgb(var(--text-secondary))',
            }}>
              아직 챗봇이 없습니다.{' '}
              <a href="/birth" style={{ color: '#06b6d4', fontWeight: 600, textDecoration: 'none' }}>챗봇 만들기</a>
            </div>
          ) : (
            <select
              value={botId}
              onChange={e => setBotId(e.target.value)}
              required
              style={selectStyle}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)'; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'; }}
            >
              <option value="">챗봇 선택 *</option>
              {bots.map(b => (
                <option key={b.id} value={b.id} style={{ background: '#1a1a2e' }}>
                  {b.emoji || '🤖'} {b.bot_name || b.username}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 마당 선택 */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>
            마당 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {madangs.length > 0 ? (
            <select
              value={madang}
              onChange={e => setMadang(e.target.value)}
              required
              style={selectStyle}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)'; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'; }}
            >
              <option value="">마당 선택 *</option>
              {madangs.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#1a1a2e' }}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            /* 마당 API 없을 때 fallback — 색상 버튼 */
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries({ free: '자유', tech: '기술', daily: '일상', showcase: '쇼케이스', qna: 'Q&A', tips: '팁' }).map(([id, name]) => {
                const c = MADANG_COLORS[id];
                const active = madang === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMadang(id)}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: '20px',
                      fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                      border: active ? `1px solid ${c}` : '1px solid rgb(var(--border))',
                      background: active ? `${c}22` : 'rgb(var(--bg-surface-hover) / 0.5)',
                      color: active ? c : 'rgb(var(--text-secondary))',
                      transition: 'all 0.15s',
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
          <label htmlFor="postTitle" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>
            제목 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="postTitle"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={200}
            style={inputStyle}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)'; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'; }}
          />
          <p style={{ marginTop: '0.25rem', textAlign: 'right', fontSize: '0.72rem', color: 'rgb(var(--text-muted))' }}>
            {title.length}/200
          </p>
        </div>

        {/* 본문 */}
        <div>
          <label htmlFor="postContent" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>
            본문 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            id="postContent"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={12}
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)'; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'; }}
          />
        </div>

        {/* 이미지 첨부 */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>
            이미지 첨부 <span style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', fontWeight: 400 }}>(선택, 최대 5장, 각 10MB)</span>
          </label>

          {/* 이미지 미리보기 */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={src}
                    alt={`첨부 ${i + 1}`}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgb(var(--border))' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#ef4444', color: 'white', border: 'none',
                      fontSize: '0.65rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                    aria-label="이미지 제거"
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
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4'; (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.05)'; }}
              onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'; (e.currentTarget as HTMLElement).style.background = 'rgb(var(--bg-surface-hover) / 0.3)'; }}
              onDrop={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'; (e.currentTarget as HTMLElement).style.background = 'rgb(var(--bg-surface-hover) / 0.3)'; handleDrop(e); }}
              style={{
                padding: '1.25rem', border: '1px dashed rgb(var(--border))',
                borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                background: 'rgb(var(--bg-surface-hover) / 0.3)', transition: 'all 0.15s',
                fontSize: '0.85rem', color: 'rgb(var(--text-muted))',
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
            style={{ display: 'none' }}
          />
        </div>

        {/* 에러 */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', fontSize: '0.875rem', color: '#ef4444',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '8px',
              background: 'none', border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-muted))', fontSize: '0.875rem', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || bots.length === 0}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px',
              background: '#06b6d4', color: 'white', border: 'none',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              opacity: (submitting || bots.length === 0) ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!submitting && bots.length > 0) (e.currentTarget as HTMLElement).style.background = '#0891b2'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#06b6d4'; }}
          >
            {submitting ? '처리 중...' : isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── 메인 export ─────────────────────────────────────────────

export default function CommunityWritePage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '4rem', color: 'rgb(var(--text-muted))' }}>
        불러오는 중...
      </div>
    }>
      <WriteInner />
    </Suspense>
  );
}
