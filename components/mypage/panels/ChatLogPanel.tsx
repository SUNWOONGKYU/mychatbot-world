/**
 * @task S10FE2
 * @description Tab2 "대화로그" 패널 — /api/bots/[id]/chat-logs 리스트/삭제
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

interface ConversationRow {
  id: string;
  user_id: string;
  created_at: string;
}

export default function ChatLogPanel({ botId }: { botId: string }) {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const LIMIT = 10;

  const load = useCallback(async (resetOffset = false) => {
    setLoading(true);
    setError(null);
    try {
      const o = resetOffset ? 0 : offset;
      const res = await fetch(`/api/bots/${botId}/chat-logs?limit=${LIMIT}&offset=${o}`, {
        headers: authHeaders(),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? '조회 실패');
      if (resetOffset) {
        setRows(d.conversations ?? []);
        setOffset(0);
      } else {
        setRows(prev => (o === 0 ? d.conversations ?? [] : [...prev, ...(d.conversations ?? [])]));
      }
      setTotal(d.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    }
    setLoading(false);
  }, [botId, offset]);

  useEffect(() => { load(true); }, [botId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteOne = async (id: string) => {
    const res = await fetch(`/api/bots/${botId}/chat-logs?conversationId=${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (res.ok) {
      setRows(prev => prev.filter(r => r.id !== id));
      setTotal(t => Math.max(0, t - 1));
    }
  };

  const handleDeleteAll = async () => {
    const res = await fetch(`/api/bots/${botId}/chat-logs`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (res.ok) {
      setRows([]);
      setTotal(0);
      setConfirmAll(false);
    }
  };

  const loadMore = () => {
    setOffset(o => o + LIMIT);
    setTimeout(() => load(false), 0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">대화 로그 ({total.toLocaleString()})</p>
        {rows.length > 0 && (
          confirmAll ? (
            <div className="flex gap-1">
              <button type="button" onClick={handleDeleteAll}
                className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--state-danger-border)] text-[var(--state-danger-fg)] bg-[var(--state-danger-bg)]">
                전체 삭제 확인
              </button>
              <button type="button" onClick={() => setConfirmAll(false)}
                className="text-xs px-2 py-1 text-[var(--text-tertiary)]">취소</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmAll(true)}
              className="text-xs text-[var(--state-danger-fg)] hover:underline">전체 삭제</button>
          )
        )}
      </div>

      {error && <p className="text-sm text-[var(--state-danger-fg)]">{error}</p>}

      {rows.length === 0 && !loading ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-4">대화 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-1.5" aria-label="대화 목록">
          {rows.map(r => (
            <li key={r.id}
              className={clsx('flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)]',
                'bg-[var(--surface-2)] border border-[var(--border-subtle)]')}>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--text-secondary)] truncate">{r.id}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{new Date(r.created_at).toLocaleString('ko-KR')}</p>
              </div>
              <button type="button" onClick={() => handleDeleteOne(r.id)}
                aria-label={`${r.id} 대화 삭제`}
                className="text-xs text-[var(--state-danger-fg)] hover:underline ml-2">삭제</button>
            </li>
          ))}
        </ul>
      )}

      {rows.length < total && (
        <button type="button" onClick={loadMore} disabled={loading}
          className={clsx('w-full text-xs py-1.5 rounded-[var(--radius-sm)]',
            'border border-[var(--border-default)] text-[var(--text-secondary)]',
            'hover:border-[var(--border-strong)] disabled:opacity-50')}>
          {loading ? '불러오는 중...' : `더 보기 (${rows.length}/${total})`}
        </button>
      )}
    </div>
  );
}
