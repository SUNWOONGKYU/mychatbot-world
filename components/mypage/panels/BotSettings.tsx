/**
 * @task S10FE7
 * @description Tab2 "설정" 패널 — PATCH /api/bots/[id] 라운드트립
 * tone/persona_traits(JSON)/model/greeting 수정 + dirty 검출 + 토스트
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

interface BotSettingsValue {
  tone?: string | null;
  model?: string | null;
  greeting?: string | null;
  persona_traits?: Record<string, unknown> | null;
}

const MODEL_OPTIONS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];
const TONE_OPTIONS = ['친근함', '정중함', '유머러스', '논리적', '공감적'];

export default function BotSettings({ botId, initial }: { botId: string; initial?: BotSettingsValue }) {
  const [tone, setTone] = useState<string>(initial?.tone ?? '');
  const [model, setModel] = useState<string>(initial?.model ?? 'gpt-4o-mini');
  const [greeting, setGreeting] = useState<string>(initial?.greeting ?? '');
  const [traitsJson, setTraitsJson] = useState<string>(
    initial?.persona_traits ? JSON.stringify(initial.persona_traits, null, 2) : '{}'
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const baselineRef = useRef({ tone: initial?.tone ?? '', model: initial?.model ?? 'gpt-4o-mini',
    greeting: initial?.greeting ?? '',
    traitsJson: initial?.persona_traits ? JSON.stringify(initial.persona_traits, null, 2) : '{}' });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const dirty = tone !== baselineRef.current.tone
    || model !== baselineRef.current.model
    || greeting !== baselineRef.current.greeting
    || traitsJson !== baselineRef.current.traitsJson;

  const save = useCallback(async () => {
    setSaving(true);
    try {
      let traits: Record<string, unknown> = {};
      try { traits = JSON.parse(traitsJson || '{}'); }
      catch { throw new Error('persona_traits JSON 형식이 올바르지 않습니다.'); }

      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ tone, model, greeting, persona_traits: traits }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? '저장 실패');
      baselineRef.current = { tone, model, greeting, traitsJson };
      setToast({ kind: 'ok', msg: '저장되었습니다.' });
    } catch (e) {
      setToast({ kind: 'err', msg: e instanceof Error ? e.message : '오류' });
    }
    setSaving(false);
  }, [botId, tone, model, greeting, traitsJson]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`bot-greeting-${botId}`} className="text-sm font-semibold text-[var(--text-primary)] mb-1 block">인사말</label>
        <textarea id={`bot-greeting-${botId}`} value={greeting} onChange={e => setGreeting(e.target.value)}
          rows={2} maxLength={300}
          className="w-full px-2 py-1.5 text-sm rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]" />
      </div>

      <div>
        <label className="text-sm font-semibold text-[var(--text-primary)] mb-1 block">말투 (tone)</label>
        <div className="flex gap-1 flex-wrap">
          {TONE_OPTIONS.map(t => (
            <button key={t} type="button" aria-pressed={tone === t}
              onClick={() => setTone(tone === t ? '' : t)}
              className={clsx('px-2 py-1 rounded-[var(--radius-sm)] text-xs border transition-colors',
                tone === t
                  ? 'border-[var(--interactive-primary)] bg-[var(--surface-2)] text-[var(--interactive-primary)]'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`bot-model-${botId}`} className="text-sm font-semibold text-[var(--text-primary)] mb-1 block">AI 모델</label>
        <select id={`bot-model-${botId}`} value={model} onChange={e => setModel(e.target.value)}
          className="px-2 py-1.5 text-sm rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]">
          {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor={`bot-traits-${botId}`} className="text-sm font-semibold text-[var(--text-primary)] mb-1 block">
          페르소나 속성 (JSON)
        </label>
        <textarea id={`bot-traits-${botId}`} value={traitsJson} onChange={e => setTraitsJson(e.target.value)}
          rows={4} spellCheck={false}
          className="w-full px-2 py-1.5 text-xs font-mono rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]" />
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={!dirty || saving}
          className={clsx('px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold',
            'bg-[var(--interactive-primary)] text-[var(--text-inverted)]',
            'hover:bg-[var(--interactive-primary-hover)] transition-colors disabled:opacity-50')}>
          {saving ? '저장 중...' : '저장'}
        </button>
        {dirty && <span className="text-xs text-[var(--state-warning-fg)]">변경사항이 있습니다</span>}
        {toast && (
          <span role="status" className={clsx('text-xs',
            toast.kind === 'ok' ? 'text-[var(--state-success-fg)]' : 'text-[var(--state-danger-fg)]')}>
            {toast.msg}
          </span>
        )}
      </div>
    </div>
  );
}
