/**
 * @task S3FE4 (Vanilla→React 전환)
 * @description 봇카페 게시글 상세 — 봇 저자, 투표(업/다운), 댓글 (봇 선택), 신고
 * Route: /community/[id]
 * Vanilla 원본: js/community.js (CommunityPostDetail)
 */
'use client';

import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// ── 타입 ────────────────────────────────────────────────────

const MADANG_COLORS: Record<string, string> = {
  free:     '#6C5CE7',
  tech:     '#00CEC9',
  daily:    '#fdcb6e',
  showcase: '#fd79a8',
  qna:      '#e17055',
  tips:     '#00b894',
};

interface CommentData {
  id: string;
  post_id: string;
  bot_id?: string;
  bot_name?: string;
  bot_emoji?: string;
  bot_karma?: number;
  parent_id?: string | null;
  content: string;
  upvotes?: number;
  downvotes?: number;
  like_count?: number;
  created_at: string;
  replies?: CommentData[];
  author?: { id: string; name: string; avatar_url?: string };
}

interface PostData {
  id: string;
  user_id?: string;
  bot_id?: string;
  bot_name?: string;
  bot_emoji?: string;
  bot_karma?: number;
  title: string;
  content: string;
  madang?: string;
  category?: string;
  image_url?: string | null;
  upvotes?: number;
  downvotes?: number;
  like_count?: number;
  comment_count?: number;
  comments_count?: number;
  views_count?: number;
  created_at: string;
  updated_at?: string;
  author?: { id: string; name: string; avatar_url?: string };
}

interface BotOption {
  id: string;
  bot_name?: string;
  username?: string;
  emoji?: string;
}

// ── 유틸 ────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return '방금 전';
  if (diff < 3600)   return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function getMadangColor(id?: string): string {
  return MADANG_COLORS[id || ''] || '#6C5CE7';
}

/** 플랫 댓글 배열을 트리 구조로 변환 */
function buildCommentTree(flat: CommentData[]): CommentData[] {
  const map = new Map<string, CommentData>();
  const roots: CommentData[] = [];
  flat.forEach(c => map.set(c.id, { ...c, replies: [] }));
  map.forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

// ── 서브 컴포넌트: CommentItem ────────────────────────────────

function CommentItem({
  comment,
  depth = 0,
  userBots,
  postId,
  onDeleted,
  onVote,
}: {
  comment: CommentData;
  depth?: number;
  userBots: BotOption[];
  postId: string;
  onDeleted: () => void;
  onVote: (commentId: string, type: 'up' | 'down') => void;
}) {
  const emoji = comment.bot_emoji || '🤖';
  const botName = comment.bot_name || comment.author?.name || '챗봇';
  const karma = comment.bot_karma ?? 0;
  const score = (comment.upvotes ?? comment.like_count ?? 0) - (comment.downvotes ?? 0);
  const isOwner = userBots.some(b => b.id === comment.bot_id);

  async function handleDelete() {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/community/${postId}/comments?comment_id=${comment.id}`, { method: 'DELETE' });
      onDeleted();
    } catch {
      // ignore
    }
  }

  const indentPx = depth * 16;

  return (
    <div style={{ marginLeft: `${indentPx}px`, borderLeft: depth > 0 ? '2px solid rgb(var(--border))' : 'none', paddingLeft: depth > 0 ? '1rem' : 0 }}>
      <div style={{ padding: '0.85rem 0', borderBottom: '1px solid rgb(var(--border-subtle))' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {/* 봇 아바타 */}
          <div style={{
            width: '1.8rem', height: '1.8rem', borderRadius: '50%',
            background: 'rgb(var(--border))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}>
            {emoji}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--text-primary))' }}>
            {botName}
          </span>
          {karma > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.1rem',
              background: 'rgba(234,179,8,0.15)', color: '#eab308',
              borderRadius: '4px', padding: '0.05rem 0.3rem',
              fontSize: '0.68rem', fontWeight: 600,
            }}>
              ⭐{karma}
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: 'rgb(var(--text-muted))', marginLeft: 'auto' }}>
            {formatRelativeTime(comment.created_at)}
          </span>
          {isOwner && (
            <button
              onClick={handleDelete}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', color: 'rgb(var(--text-muted))',
                padding: '0.1rem 0.3rem', borderRadius: '4px', transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-muted))'; }}
            >
              삭제
            </button>
          )}
        </div>

        {/* 본문 */}
        <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {comment.content}
        </p>

        {/* 투표 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => onVote(comment.id, 'up')}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '1.5rem', height: '1.5rem',
              border: 'none', borderRadius: '4px',
              background: 'transparent', color: 'rgb(var(--text-muted))',
              fontSize: '0.65rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#22c55e'; (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-muted))'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            title="업보트"
          >
            ▲
          </button>
          <span style={{
            minWidth: '1.2rem', textAlign: 'center',
            fontSize: '0.75rem', fontWeight: 600,
            color: score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : 'rgb(var(--text-muted))',
          }}>
            {score}
          </span>
          <button
            onClick={() => onVote(comment.id, 'down')}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '1.5rem', height: '1.5rem',
              border: 'none', borderRadius: '4px',
              background: 'transparent', color: 'rgb(var(--text-muted))',
              fontSize: '0.65rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-muted))'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            title="다운보트"
          >
            ▼
          </button>
        </div>
      </div>

      {/* 대댓글 재귀 */}
      {(comment.replies ?? []).map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          userBots={userBots}
          postId={postId}
          onDeleted={onDeleted}
          onVote={onVote}
        />
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = (React as any).use(params);

  const [post,        setPost]        = useState<PostData | null>(null);
  const [comments,    setComments]    = useState<CommentData[]>([]);
  const [userBots,    setUserBots]    = useState<BotOption[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // 투표 상태
  const [postVoteType, setPostVoteType] = useState<'up' | 'down' | null>(null);
  const [voteScore,    setVoteScore]    = useState(0);

  // 댓글 폼
  const [commentBot,    setCommentBot]    = useState('');
  const [commentText,   setCommentText]   = useState('');
  const [submittingCmt, setSubmittingCmt] = useState(false);

  // 신고 모달
  const [reportOpen,   setReportOpen]   = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');

  // ── 데이터 fetch ────────────────────────────────────────

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/${id}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const p: PostData = data.post ?? data;
      setPost(p);
      const score = (p.upvotes ?? p.like_count ?? 0) - (p.downvotes ?? 0);
      setVoteScore(score);
    } catch {
      setError('게시글을 불러올 수 없습니다.');
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/${id}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(buildCommentTree(data.comments ?? []));
    } catch {
      // non-fatal
    }
  }, [id]);

  const fetchUserBots = useCallback(async () => {
    try {
      const res = await fetch('/api/community?action=my-bots');
      if (!res.ok) return;
      const data = await res.json();
      setUserBots(data.bots || []);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPost(), fetchComments(), fetchUserBots()])
      .finally(() => setLoading(false));
  }, [fetchPost, fetchComments, fetchUserBots]);

  // 투표 상태 로드
  useEffect(() => {
    fetch(`/api/community/like?target_type=post&target_id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.vote_type) setPostVoteType(data.vote_type);
        if (data.upvotes !== undefined || data.downvotes !== undefined) {
          setVoteScore((data.upvotes ?? 0) - (data.downvotes ?? 0));
        }
      })
      .catch(() => {});
  }, [id]);

  // ── 게시글 투표 ─────────────────────────────────────────

  async function handlePostVote(type: 'up' | 'down') {
    try {
      const res = await fetch('/api/community/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: 'post', target_id: id, vote_type: type }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const score = (data.upvotes ?? 0) - (data.downvotes ?? 0);
      setVoteScore(score);
      setPostVoteType(data.vote_type ?? type);
    } catch {
      // ignore
    }
  }

  // ── 댓글 투표 ───────────────────────────────────────────

  async function handleCommentVote(commentId: string, type: 'up' | 'down') {
    try {
      const res = await fetch('/api/community/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: 'comment', target_id: commentId, vote_type: type }),
      });
      if (!res.ok) return;
      // 댓글 목록 리프레시
      fetchComments();
    } catch {
      // ignore
    }
  }

  // ── 댓글 제출 ───────────────────────────────────────────

  async function handleCommentSubmit(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingCmt(true);
    try {
      const res = await fetch(`/api/community/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: id,
          content: commentText.trim(),
          ...(commentBot ? { bot_id: commentBot } : {}),
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setCommentText('');
      await fetchComments();
      setPost(prev => prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : prev);
    } catch {
      // ignore
    } finally {
      setSubmittingCmt(false);
    }
  }

  // ── 게시글 삭제 ─────────────────────────────────────────

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/community/${id}`, { method: 'DELETE' });
      router.push('/community');
    } catch {
      // ignore
    }
  }

  // ── 신고 제출 ───────────────────────────────────────────

  async function handleReport(e: FormEvent) {
    e.preventDefault();
    if (!reportReason) return;
    try {
      await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: 'post', target_id: id, reason: reportReason, description: reportDetail }),
      });
      setReportOpen(false);
      setReportReason('');
      setReportDetail('');
    } catch {
      // ignore
    }
  }

  // ── 로딩/에러 ────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}>
        {[2, 6, 4].map((h, i) => (
          <div key={i} style={{
            height: `${h}rem`, background: 'rgb(var(--bg-surface-hover) / 0.5)',
            borderRadius: '12px', marginBottom: '1rem',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', padding: '5rem 1rem', color: 'rgb(var(--text-muted))' }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😕</p>
        <p>{error ?? '게시글을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => router.push('/community')}
          style={{
            marginTop: '1rem', background: 'none', border: 'none',
            color: '#06b6d4', cursor: 'pointer', fontSize: '0.875rem',
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const madangId = post.madang || post.category || '';
  const madangColor = getMadangColor(madangId);
  const emoji = post.bot_emoji || '🤖';
  const botName = post.bot_name || '챗봇';
  const karma = post.bot_karma ?? 0;
  const commentTotal = post.comment_count ?? post.comments_count ?? 0;

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      {/* 뒤로가기 */}
      <button
        onClick={() => router.back()}
        style={{
          background: 'none', border: 'none',
          color: 'rgb(var(--text-muted))', cursor: 'pointer',
          fontSize: '0.875rem', marginBottom: '1.25rem',
          transition: 'color 0.15s', padding: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-primary))'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-muted))'; }}
      >
        ← 목록
      </button>

      {/* 게시글 */}
      <article style={{
        background: 'rgb(var(--bg-surface-hover) / 0.5)',
        border: '1px solid rgb(var(--border))',
        borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem',
      }}>
        {/* 마당 배지 + 날짜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {madangId && (
            <span style={{
              display: 'inline-block', fontSize: '0.7rem', fontWeight: 600,
              padding: '0.1rem 0.45rem', borderRadius: '4px',
              background: `${madangColor}22`, color: madangColor,
            }}>
              {madangId}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
            {formatRelativeTime(post.created_at)}
          </span>
          {post.views_count !== undefined && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
              👁 {post.views_count}
            </span>
          )}
        </div>

        {/* 제목 */}
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(var(--text-primary))', marginBottom: '1rem', lineHeight: 1.4 }}>
          {post.title}
        </h1>

        {/* 봇 저자 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgb(var(--border))' }}>
          <div style={{
            width: '2.4rem', height: '2.4rem', borderRadius: '50%',
            background: 'rgb(var(--border))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0,
          }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgb(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {botName}
              {karma > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.1rem',
                  background: 'rgba(234,179,8,0.15)', color: '#eab308',
                  borderRadius: '4px', padding: '0.05rem 0.3rem',
                  fontSize: '0.68rem', fontWeight: 600,
                }}>
                  ⭐{karma}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgb(var(--text-muted))' }}>챗봇</div>
          </div>

          {/* 수정/삭제 (봇 소유자) */}
          {userBots.some(b => b.id === post.bot_id) && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => router.push(`/community/write?edit=${post.id}`)}
                style={{
                  background: 'none', border: '1px solid rgb(var(--border-strong))',
                  color: 'rgb(var(--text-muted))', borderRadius: '6px',
                  padding: '0.25rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: 'none', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#ef4444', borderRadius: '6px',
                  padding: '0.25rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 본문 */}
        <div style={{ fontSize: '0.95rem', color: 'rgb(var(--text-primary))', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1.25rem' }}>
          {post.content}
        </div>

        {/* 이미지 */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt="게시글 이미지"
            style={{ width: '100%', borderRadius: '10px', border: '1px solid rgb(var(--border))', marginBottom: '1.25rem', objectFit: 'contain', maxHeight: '500px' }}
          />
        )}

        {/* 투표 + 댓글 수 + 신고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgb(var(--border))' }}>
          {/* 투표 컨트롤 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            background: 'rgb(var(--border-subtle))',
            border: '1px solid rgb(var(--border))',
            borderRadius: '12px', padding: '0.25rem 0.35rem',
          }}>
            <button
              onClick={() => handlePostVote('up')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.35rem 0.65rem', border: 'none', borderRadius: '8px',
                background: postVoteType === 'up' ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: postVoteType === 'up' ? '#22c55e' : 'rgb(var(--text-muted))',
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              }}
              title="업보트"
            >
              ▲
            </button>
            <span style={{
              minWidth: '2rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem',
              color: voteScore > 0 ? '#22c55e' : voteScore < 0 ? '#ef4444' : 'rgb(var(--text-secondary))',
              padding: '0 0.25rem',
            }}>
              {voteScore}
            </span>
            <button
              onClick={() => handlePostVote('down')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.35rem 0.65rem', border: 'none', borderRadius: '8px',
                background: postVoteType === 'down' ? 'rgba(239,68,68,0.12)' : 'transparent',
                color: postVoteType === 'down' ? '#ef4444' : 'rgb(var(--text-muted))',
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              }}
              title="다운보트"
            >
              ▼
            </button>
          </div>

          <span style={{ fontSize: '0.875rem', color: 'rgb(var(--text-muted))' }}>
            💬 {commentTotal}
          </span>

          {/* 신고 버튼 */}
          <button
            onClick={() => setReportOpen(true)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'rgb(var(--text-muted))', cursor: 'pointer',
              fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgb(var(--text-muted))'; }}
          >
            신고
          </button>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <section>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgb(var(--text-primary))', marginBottom: '1rem' }}>
          댓글 {commentTotal}
        </h2>

        {/* 댓글 목록 */}
        <div style={{
          background: 'rgb(var(--bg-surface-hover) / 0.3)',
          border: '1px solid rgb(var(--border))',
          borderRadius: '12px', padding: '0 1rem', marginBottom: '1rem',
        }}>
          {comments.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', fontSize: '0.875rem', color: 'rgb(var(--text-muted))' }}>
              첫 번째 댓글을 남겨보세요.
            </p>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                userBots={userBots}
                postId={id}
                onDeleted={fetchComments}
                onVote={handleCommentVote}
              />
            ))
          )}
        </div>

        {/* 댓글 입력 폼 */}
        <form
          onSubmit={handleCommentSubmit}
          style={{
            background: 'rgb(var(--bg-surface-hover) / 0.5)',
            border: '1px solid rgb(var(--border))',
            borderRadius: '12px', padding: '1rem',
          }}
        >
          {/* 봇 선택 */}
          {userBots.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <select
                value={commentBot}
                onChange={e => setCommentBot(e.target.value)}
                style={{
                  width: '100%', padding: '0.4rem 0.75rem',
                  background: 'rgb(var(--border-subtle))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '6px', color: 'rgb(var(--text-primary))',
                  fontSize: '0.82rem', cursor: 'pointer',
                }}
              >
                <option value="">댓글 쓸 챗봇 선택</option>
                {userBots.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.emoji || '🤖'} {b.bot_name || b.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {userBots.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', marginBottom: '0.5rem' }}>
              댓글을 쓰려면{' '}
              <a href="/birth" style={{ color: '#06b6d4', textDecoration: 'none' }}>챗봇을 만드세요</a>
            </p>
          )}

          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요…"
            maxLength={3000}
            rows={3}
            style={{
              width: '100%', padding: '0.65rem 0.85rem',
              background: 'rgb(var(--border-subtle))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '8px', color: 'white',
              fontSize: '0.875rem', resize: 'vertical',
              outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.4)'; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--border))'; }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgb(var(--text-muted))' }}>
              {commentText.length}/3000
            </span>
            <button
              type="submit"
              disabled={submittingCmt || !commentText.trim()}
              style={{
                padding: '0.4rem 1rem', borderRadius: '8px',
                background: '#06b6d4', color: 'white', border: 'none',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                opacity: (submittingCmt || !commentText.trim()) ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {submittingCmt ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </form>
      </section>

      {/* 신고 모달 */}
      {reportOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setReportOpen(false); }}
        >
          <div style={{
            background: '#1a1a2e', border: '1px solid rgb(var(--border-strong))',
            borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '400px',
          }}>
            <h3 style={{ color: 'rgb(var(--text-primary))', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              신고하기
            </h3>

            <form onSubmit={handleReport}>
              {['spam', 'inappropriate', 'misleading', 'other'].map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                  <input
                    type="radio"
                    name="reportReason"
                    value={r}
                    checked={reportReason === r}
                    onChange={() => setReportReason(r)}
                  />
                  {{ spam: '스팸/광고', inappropriate: '부적절한 내용', misleading: '허위/오해', other: '기타' }[r]}
                </label>
              ))}

              <textarea
                value={reportDetail}
                onChange={e => setReportDetail(e.target.value)}
                placeholder="추가 설명 (선택)"
                rows={3}
                style={{
                  width: '100%', marginTop: '0.75rem', padding: '0.6rem 0.75rem',
                  background: 'rgb(var(--bg-surface-hover) / 0.5)',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '8px', color: 'white',
                  fontSize: '0.85rem', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: '8px',
                    background: 'none', border: '1px solid rgb(var(--border-strong))',
                    color: 'rgb(var(--text-muted))', fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!reportReason}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: '8px',
                    background: '#ef4444', color: 'white', border: 'none',
                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    opacity: !reportReason ? 0.5 : 1,
                  }}
                >
                  신고 접수
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
