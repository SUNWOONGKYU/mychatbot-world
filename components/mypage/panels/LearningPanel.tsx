/**
 * @task S10FE5
 * @description Tab2 "학습 진도" 패널 — /api/bots/[id]/growth 재사용
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from '@/lib/auth-client';

interface GrowthData {
  level: number;
  experience: number;
  nextLevelExp: number;
  stats: {
    conversations?: number;
    faq_count?: number;
    positive_feedback?: number;
  };
}

export default function LearningPanel({ botId }: { botId: string }) {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bots/${botId}/growth`, { headers: authHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? '조회 실패');
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    }
    setLoading(false);
  }, [botId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-sm text-[var(--text-tertiary)] text-center py-4">불러오는 중...</p>;
  if (error) return <p className="text-sm text-[var(--state-danger-fg)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--text-tertiary)] text-center py-4">학습 데이터가 없습니다.</p>;

  const pct = Math.min(100, Math.round((data.experience / Math.max(1, data.nextLevelExp)) * 100));

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--text-primary)]">학습 진도</p>

      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-[var(--interactive-primary)]">Lv.{data.level}</span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {data.experience} / {data.nextLevelExp} exp
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--surface-1)] overflow-hidden" role="progressbar"
          aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-[var(--interactive-primary)] transition-all"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-center">
          <dt className="text-[10px] text-[var(--text-tertiary)]">대화</dt>
          <dd className="text-sm font-semibold text-[var(--text-primary)]">
            {(data.stats?.conversations ?? 0).toLocaleString()}
          </dd>
        </div>
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-center">
          <dt className="text-[10px] text-[var(--text-tertiary)]">FAQ</dt>
          <dd className="text-sm font-semibold text-[var(--text-primary)]">
            {(data.stats?.faq_count ?? 0).toLocaleString()}
          </dd>
        </div>
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-center">
          <dt className="text-[10px] text-[var(--text-tertiary)]">호감도</dt>
          <dd className="text-sm font-semibold text-[var(--text-primary)]">
            {(data.stats?.positive_feedback ?? 0).toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
