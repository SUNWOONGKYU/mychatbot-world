/**
 * @task S10FE3
 * @description Tab2 "학습(KB)" 패널 — /api/kb 재사용, 텍스트 추가/삭제
 * 사용자 노출 라벨: "학습/Learning" 유지 (KB는 구현 용어)
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

interface KbItem {
  id: string;
  title: string;
  content: string;
  source_type: string;
  char_count: number;
  is_embedded: boolean;
  created_at: string;
}

export default function KbPanel({ botId }: { botId: string }) {
  const [items, setItems] = useState<KbItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kb?chatbot_id=${encodeURIComponent(botId)}&limit=50`, {
        headers: authHeaders(),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d?.error ?? '조회 실패');
      setItems(d.data?.items ?? []);
      setTotal(d.data?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    }
    setLoading(false);
  }, [botId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ chatbot_id: botId, title: title.trim(), content: content.trim() }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d?.error ?? '추가 실패');
      setTitle(''); setContent(''); setAdding(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/kb?id=${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
      setTotal(t => Math.max(0, t - 1));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">학습 자료 ({total.toLocaleString()})</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="text-xs font-medium text-[var(--interactive-primary)] hover:underline">+ 추가</button>
        )}
      </div>

      {error && <p className="text-sm text-[var(--state-danger-fg)]">{error}</p>}

      {adding && (
        <div className="space-y-2 p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)]">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="제목" maxLength={100}
            className="w-full px-2 py-1.5 text-sm rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)]" />
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="학습시킬 내용을 입력하세요 (텍스트)"
            rows={4} maxLength={10000}
            className="w-full px-2 py-1.5 text-sm rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)]" />
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd}
              className="text-sm font-medium text-[var(--interactive-primary)] hover:underline">저장</button>
            <button type="button" onClick={() => { setAdding(false); setTitle(''); setContent(''); }}
              className="text-sm text-[var(--text-tertiary)] hover:underline">취소</button>
          </div>
        </div>
      )}

      {items.length === 0 && !loading ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-4">학습 자료가 없습니다.</p>
      ) : (
        <ul className="space-y-1.5" aria-label="KB 목록">
          {items.map(it => (
            <li key={it.id}
              className={clsx('flex items-start justify-between px-3 py-2 rounded-[var(--radius-sm)]',
                'bg-[var(--surface-2)] border border-[var(--border-subtle)]')}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{it.title}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {it.char_count.toLocaleString()}자 · {it.source_type} · {it.is_embedded ? '학습완료' : '학습대기'}
                </p>
              </div>
              <button type="button" onClick={() => handleDelete(it.id)}
                aria-label={`${it.title} 삭제`}
                className="text-xs text-[var(--state-danger-fg)] hover:underline ml-2 flex-shrink-0">삭제</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
