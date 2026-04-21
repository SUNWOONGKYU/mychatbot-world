/**
 * @task S10FE4
 * @description Tab2 "스킬" 패널 — /api/bots/[id]/skills 장착/해제
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

interface BotSkill {
  id: string;
  skill_id: string;
  config: Record<string, unknown>;
  mounted_at: string;
}

export default function SkillsMountPanel({ botId }: { botId: string }) {
  const [mounted, setMounted] = useState<BotSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bots/${botId}/skills`, { headers: authHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? '조회 실패');
      setMounted(d.skills ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    }
    setLoading(false);
  }, [botId]);

  useEffect(() => { load(); }, [load]);

  const handleMount = async () => {
    const sid = skillInput.trim();
    if (!sid) return;
    try {
      const res = await fetch(`/api/bots/${botId}/skills`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ skill_id: sid }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? '장착 실패');
      setSkillInput(''); setAdding(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    }
  };

  const handleUnmount = async (skillId: string) => {
    const res = await fetch(`/api/bots/${botId}/skills?skill_id=${encodeURIComponent(skillId)}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (res.ok) setMounted(prev => prev.filter(s => s.skill_id !== skillId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">장착된 스킬 ({mounted.length})</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="text-xs font-medium text-[var(--interactive-primary)] hover:underline">+ 장착</button>
        )}
      </div>

      {error && <p className="text-sm text-[var(--state-danger-fg)]">{error}</p>}

      {adding && (
        <div className="flex gap-2 p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)]">
          <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
            placeholder="skill_id (예: web-search)" maxLength={50}
            onKeyDown={e => { if (e.key === 'Enter') handleMount(); }}
            className="flex-1 px-2 py-1.5 text-sm rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)]" />
          <button type="button" onClick={handleMount}
            className="text-sm font-medium text-[var(--interactive-primary)] hover:underline">장착</button>
          <button type="button" onClick={() => { setAdding(false); setSkillInput(''); }}
            className="text-sm text-[var(--text-tertiary)] hover:underline">취소</button>
        </div>
      )}

      {mounted.length === 0 && !loading ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
          장착된 스킬이 없습니다.<br />
          <a href="/skills" className="text-[var(--text-link)] underline text-xs">스킬마켓에서 찾아보기</a>
        </p>
      ) : (
        <ul className="space-y-1.5" aria-label="장착된 스킬">
          {mounted.map(s => (
            <li key={s.id}
              className={clsx('flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)]',
                'bg-[var(--surface-2)] border border-[var(--border-subtle)]')}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.skill_id}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  장착: {new Date(s.mounted_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <button type="button" onClick={() => handleUnmount(s.skill_id)}
                aria-label={`${s.skill_id} 해제`}
                className="text-xs text-[var(--state-danger-fg)] hover:underline ml-2">해제</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
