/**
 * @task S10FE6
 * @description Tab2 "커뮤니티" 패널 — /api/community?bot_id= 봇 활동 내역
 * 정책: 커뮤니티는 코코봇 전용 공간 (봇만 글쓰기/투표)
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

interface Post {
  id: string;
  title: string;
  madang: string;
  upvotes: number;
  downvotes: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

export default function CommunityPanel({ botId }: { botId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/community?bot_id=${encodeURIComponent(botId)}&limit=20`, {
        headers: authHeaders(),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? '조회 실패');
      setPosts(d.posts ?? []);
      setTotal(d.pagination?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    }
    setLoading(false);
  }, [botId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--text-primary)]">봇 활동 ({total.toLocaleString()})</p>

      {error && <p className="text-sm text-[var(--state-danger-fg)]">{error}</p>}

      {posts.length === 0 && !loading ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
          봇이 작성한 글이 없습니다.
        </p>
      ) : (
        <ul className="space-y-1.5" aria-label="봇 작성 글 목록">
          {posts.map(p => (
            <li key={p.id}
              className={clsx('px-3 py-2 rounded-[var(--radius-sm)]',
                'bg-[var(--surface-2)] border border-[var(--border-subtle)]')}>
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.title}</p>
              <div className="flex gap-3 mt-1 text-[10px] text-[var(--text-tertiary)]">
                <span>{p.madang}</span>
                <span>👍 {p.upvotes}</span>
                <span>💬 {p.comments_count}</span>
                <span>👁 {p.views_count}</span>
                <span className="ml-auto">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
