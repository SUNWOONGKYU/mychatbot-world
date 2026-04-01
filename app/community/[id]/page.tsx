/**
 * @task S3FE4
 * @description 커뮤니티 게시글 상세 페이지
 * Route: /community/[id]
 * - 게시글 내용, 작성자, 좋아요 수 표시
 * - 댓글 목록 (대댓글 스레딩 — 시각적 들여쓰기)
 * - Supabase Realtime 구독 (새 댓글/대댓글 실시간 수신)
 */
'use client';

import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToPost } from '@/lib/realtime-client';
import type { BroadcastPayload } from '@/lib/realtime-client';

// ── 타입 ────────────────────────────────────────────────────

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  created_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// ── 유틸 ────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return '방금 전';
  if (hours < 1)   return `${mins}분 전`;
  if (days  < 1)   return `${hours}시간 전`;
  if (days  < 30)  return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

/** 플랫 댓글 배열을 트리 구조로 변환 */
function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

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
  onReply,
}: {
  comment: Comment;
  depth?: number;
  onReply?: (parentId: string, parentAuthor: string) => void;
}) {
  const MAX_DEPTH = 3;
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 6, 18)}` : '';

  return (
    <div className={`${indentClass} ${depth > 0 ? 'border-l-2 border-border pl-4' : ''}`}>
      {/* 댓글 본문 */}
      <div className="flex gap-3 py-3">
        {/* 아바타 */}
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center
                          justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary">
              {(comment.author?.name ?? 'U')[0].toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* 작성자 + 시간 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary">
              {comment.author?.name ?? '익명'}
            </span>
            <span className="text-xs text-text-muted">{timeAgo(comment.created_at)}</span>
          </div>

          {/* 내용 */}
          <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* 액션: 좋아요 + 대댓글 */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-text-muted">좋아요 {comment.like_count}</span>
            {depth < MAX_DEPTH && onReply && (
              <button
                onClick={() => onReply(comment.id, comment.author?.name ?? '익명')}
                className="text-xs text-text-muted hover:text-primary transition-colors"
              >
                답글
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 대댓글 재귀 렌더 */}
      {(comment.replies ?? []).map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
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

  const [post,     setPost]     = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [liked,    setLiked]    = useState(false);

  // 댓글 입력
  const [commentText,  setCommentText]  = useState('');
  const [replyTo,      setReplyTo]      = useState<{ id: string; author: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // ── 데이터 fetch ────────────────────────────────────────

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/${id}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setPost(data.post ?? data);
    } catch {
      setError('게시글을 불러올 수 없습니다.');
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/${id}/comments`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setComments(buildCommentTree(data.comments ?? []));
    } catch {
      // 댓글 fetch 실패는 non-fatal
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetchPost(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchPost, fetchComments]);

  // ── Realtime 구독 ────────────────────────────────────────

  useEffect(() => {
    const channel = subscribeToPost(id, (payload: BroadcastPayload) => {
      if (payload.event === 'new_comment' || payload.event === 'new_reply') {
        // 새 댓글/대댓글 → 댓글 목록 리프레시
        fetchComments();
        // 카운터 업데이트
        setPost(prev => prev
          ? { ...prev, comment_count: prev.comment_count + 1 }
          : prev
        );
      }
      if (payload.event === 'new_like') {
        setPost(prev => prev
          ? { ...prev, like_count: (payload.payload as { like_count?: number }).like_count ?? prev.like_count + 1 }
          : prev
        );
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [id, fetchComments]);

  // ── 좋아요 ───────────────────────────────────────────────

  async function handleLike() {
    if (!post || liked) return;
    try {
      await fetch(`/api/community/${id}/like`, { method: 'POST' });
      setLiked(true);
      setPost(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : prev);
    } catch {
      // ignore
    }
  }

  // ── 댓글 제출 ────────────────────────────────────────────

  async function handleCommentSubmit(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/community/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:   commentText.trim(),
          parent_id: replyTo?.id ?? null,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setCommentText('');
      setReplyTo(null);
      fetchComments();
    } catch {
      // error handling — silently fail for MVP
    } finally {
      setSubmittingComment(false);
    }
  }

  // ── 로딩 ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8  bg-surface rounded-xl w-2/3" />
        <div className="h-48 bg-surface rounded-xl" />
        <div className="h-32 bg-surface rounded-xl" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-text-muted">
        <p className="text-4xl mb-3">😕</p>
        <p>{error ?? '게시글을 찾을 수 없습니다.'}</p>
        <button
          onClick={() => router.push('/community')}
          className="mt-4 text-sm text-primary hover:underline"
        >
          목록으로
        </button>
      </div>
    );
  }

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* 뒤로가기 */}
      <button
        onClick={() => router.back()}
        className="mb-5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        ← 목록
      </button>

      {/* 게시글 */}
      <article className="bg-surface border border-border rounded-xl p-6 mb-6">
        {/* 카테고리 + 날짜 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {post.category}
          </span>
          <span className="text-xs text-text-muted">{timeAgo(post.created_at)}</span>
        </div>

        {/* 제목 */}
        <h1 className="text-xl font-bold text-text-primary mb-4">{post.title}</h1>

        {/* 작성자 */}
        <div className="flex items-center gap-2 mb-5 pb-5 border-b border-border">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={post.author.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {(post.author?.name ?? 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-text-primary">
            {post.author?.name ?? '익명'}
          </span>
        </div>

        {/* 본문 */}
        <p className="text-text-secondary whitespace-pre-wrap leading-relaxed mb-5">
          {post.content}
        </p>

        {/* 이미지 */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt="게시글 이미지"
            className="w-full rounded-lg border border-border mb-5 object-contain max-h-96"
          />
        )}

        {/* 좋아요 */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`flex items-center gap-1.5 text-sm transition-colors
              ${liked
                ? 'text-error cursor-default'
                : 'text-text-muted hover:text-error'
              }`}
          >
            <span>{liked ? '♥' : '♡'}</span>
            <span>{post.like_count}</span>
          </button>
          <span className="text-sm text-text-muted">댓글 {post.comment_count}</span>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-4">
          댓글 {post.comment_count}
        </h2>

        {/* 댓글 목록 */}
        <div className="bg-surface border border-border rounded-xl px-5 divide-y divide-border mb-5">
          {comments.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">
              첫 댓글을 남겨보세요.
            </p>
          ) : (
            comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                onReply={(parentId: any, parentAuthor: any) =>
                  setReplyTo({ id: parentId, author: parentAuthor })
                }
              />
            ))
          )}
        </div>

        {/* 댓글 입력 폼 */}
        <form
          onSubmit={handleCommentSubmit}
          className="bg-surface border border-border rounded-xl p-4"
        >
          {/* 대댓글 대상 표시 */}
          {replyTo && (
            <div className="flex items-center justify-between mb-3 text-xs
                            bg-primary/10 text-primary rounded-lg px-3 py-2">
              <span>@{replyTo.author}에게 답글</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="hover:text-error transition-colors"
              >
                취소
              </button>
            </div>
          )}

          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요…"
            rows={3}
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-border bg-bg-base
                       text-text-primary placeholder:text-text-muted resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg
                         bg-primary text-white hover:bg-primary-hover
                         disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submittingComment ? '등록 중…' : '댓글 등록'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
