/**
 * @task S2FE3
 * @description 설정 화면 컴포넌트
 *
 * - 선택된 챗봇의 설정 조회/수정 (GET/PATCH /api/settings)
 * - 설정 항목: 기본 감성 레벨(temperature), 기본 비용 레벨(model),
 *   언어(language), 인사말(greeting), 페르소나(persona)
 * - 자동 저장 (debounce 1초)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import type { Bot } from '@/types/bot';

// ── 타입 정의 ─────────────────────────────────────────────────

/** 챗봇 설정 */
interface BotSettings {
  id?: string;
  chatbot_id: string;
  persona: string;
  greeting: string;
  model: string;
  temperature: number;
  max_tokens: number;
  language: string;
  fallback_message: string;
  use_kb: boolean;
  kb_top_k: number;
}

type SettingsField = Omit<BotSettings, 'id' | 'chatbot_id'>;

/** 저장 상태 */
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** SettingsPanel Props */
interface SettingsPanelProps {
  botId: string | null;
  bots: Bot[];
  onSelectBot: (id: string) => void;
}

// ── 상수 ──────────────────────────────────────────────────────

/** 모델 옵션 (비용 레벨별) */
const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini — 저비용', level: 'low' },
  { value: 'gpt-4o',      label: 'GPT-4o — 표준',       level: 'standard' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo — 고성능', level: 'high' },
] as const;

/** 언어 옵션 */
const LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

/** 기본 설정값 (API 미응답 대비) */
const DEFAULT_SETTINGS: SettingsField = {
  persona: '당신은 도움이 되는 AI 어시스턴트입니다.',
  greeting: '안녕하세요! 무엇을 도와드릴까요?',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 2048,
  language: 'ko',
  fallback_message: '죄송합니다. 해당 내용에 대한 답변을 드리기 어렵습니다.',
  use_kb: true,
  kb_top_k: 5,
};

// ── 유틸 ──────────────────────────────────────────────────────

/**
 * temperature(0~2) → 감성 레벨 레이블
 * @param value - temperature 값
 * @returns 감성 레벨 레이블
 */
function tempLabel(value: number): string {
  if (value < 0.4) return '보수적';
  if (value < 0.8) return '균형적';
  if (value < 1.3) return '창의적';
  return '매우 창의적';
}

// ── SettingsPanel 컴포넌트 ────────────────────────────────────

/**
 * SettingsPanel — 챗봇 설정 수정 UI
 * - 봇 선택 → 설정 로드
 * - 각 항목 수정 → 1초 debounce → 자동 저장 (PATCH /api/settings)
 */
export function SettingsPanel({ botId, bots, onSelectBot }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SettingsField>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // ── 설정 로딩 ──────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    setError(null);
    isFirstLoad.current = true;
    try {
      const res = await fetch(`/api/settings?chatbot_id=${botId}`);
      if (res.ok) {
        const data = await res.json();
        const s: BotSettings = data?.data ?? data;
        setSettings({
          persona:          s.persona          ?? DEFAULT_SETTINGS.persona,
          greeting:         s.greeting         ?? DEFAULT_SETTINGS.greeting,
          model:            s.model            ?? DEFAULT_SETTINGS.model,
          temperature:      s.temperature      ?? DEFAULT_SETTINGS.temperature,
          max_tokens:       s.max_tokens       ?? DEFAULT_SETTINGS.max_tokens,
          language:         s.language         ?? DEFAULT_SETTINGS.language,
          fallback_message: s.fallback_message ?? DEFAULT_SETTINGS.fallback_message,
          use_kb:           s.use_kb           ?? DEFAULT_SETTINGS.use_kb,
          kb_top_k:         s.kb_top_k         ?? DEFAULT_SETTINGS.kb_top_k,
        });
      } else {
        // 설정 없으면 기본값 사용
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
      // 로딩 후 다음 변경부터 debounce 저장 허용
      setTimeout(() => { isFirstLoad.current = false; }, 100);
    }
  }, [botId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── 자동 저장 (debounce 1초) ──────────────────────────────

  /**
   * 설정 PATCH 요청
   * @param updated - 저장할 설정 객체
   */
  const saveSettings = useCallback(async (updated: SettingsField) => {
    if (!botId) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatbot_id: botId, ...updated }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? '설정 저장 실패');
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      setSaveState('error');
      setError(err instanceof Error ? err.message : '설정을 저장하지 못했습니다.');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  }, [botId]);

  /**
   * 설정 필드 업데이트 + debounce 저장
   * @param updates - 업데이트할 필드 (partial)
   */
  const handleChange = useCallback((updates: Partial<SettingsField>) => {
    if (isFirstLoad.current) return;
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      // debounce 1초
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        saveSettings(next);
      }, 1000);
      return next;
    });
  }, [saveSettings]);

  // ── 저장 상태 배지 ─────────────────────────────────────────

  const saveBadge = {
    idle:   null,
    saving: { text: '저장 중…', className: 'text-text-muted' },
    saved:  { text: '✓ 저장됨', className: 'text-success' },
    error:  { text: '저장 실패', className: 'text-error' },
  }[saveState];

  // ── 공통 입력 스타일 ──────────────────────────────────────

  const inputClass = clsx(
    'w-full px-3 py-2 rounded-lg text-sm',
    'bg-bg-subtle border border-border',
    'text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  );

  // ── 렌더 ──────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl">

      {/* 봇 선택 + 저장 상태 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <label htmlFor="settings-bot-select" className="text-sm font-medium text-text-secondary shrink-0">
            챗봇:
          </label>
          <select
            id="settings-bot-select"
            value={botId ?? ''}
            onChange={(e) => onSelectBot(e.target.value)}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm bg-surface border border-border',
              'text-text-primary focus:outline-none focus:ring-2 focus:ring-primary',
            )}
          >
            {bots.length === 0 && <option value="" disabled>챗봇 없음</option>}
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>{bot.name}</option>
            ))}
          </select>
        </div>

        {saveBadge && (
          <span className={clsx('text-xs font-medium', saveBadge.className)}>
            {saveBadge.text}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-error bg-error/5 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* 로딩 스켈레톤 */}
      {loading ? (
        <div className="space-y-4">
          {[80, 120, 60, 80].map((h, i) => (
            <div key={i} className={`h-${h === 120 ? 28 : 10} rounded-lg bg-bg-subtle animate-pulse`} />
          ))}
        </div>
      ) : !botId ? (
        <div className="flex items-center justify-center h-40 text-text-muted text-sm">
          챗봇을 선택하면 설정이 표시됩니다.
        </div>
      ) : (
        <div className="space-y-5">

          {/* ── 인사말 ────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              인사말
            </label>
            <p className="text-xs text-text-muted">챗봇이 대화를 시작할 때 표시하는 메시지</p>
            <input
              type="text"
              value={settings.greeting}
              onChange={(e) => handleChange({ greeting: e.target.value })}
              className={inputClass}
              placeholder="안녕하세요! 무엇을 도와드릴까요?"
              maxLength={500}
            />
          </div>

          {/* ── 페르소나 ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              페르소나 (시스템 프롬프트)
            </label>
            <p className="text-xs text-text-muted">챗봇의 역할, 성격, 전문 분야를 정의합니다</p>
            <textarea
              value={settings.persona}
              onChange={(e) => handleChange({ persona: e.target.value })}
              rows={4}
              className={clsx(inputClass, 'resize-none')}
              placeholder="당신은 도움이 되는 AI 어시스턴트입니다."
            />
          </div>

          {/* ── 감성 레벨 (temperature) ───────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text-primary">
                감성 레벨 (창의성)
              </label>
              <span className="text-xs font-medium text-primary">
                {settings.temperature.toFixed(1)} — {tempLabel(settings.temperature)}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              낮을수록 일관적, 높을수록 다양한 답변
            </p>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => handleChange({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>보수적 (0.0)</span>
              <span>균형 (0.7)</span>
              <span>창의적 (2.0)</span>
            </div>
          </div>

          {/* ── 비용 레벨 (model) ─────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              AI 모델 (비용 레벨)
            </label>
            <p className="text-xs text-text-muted">성능이 높을수록 비용이 증가합니다</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange({ model: opt.value })}
                  className={clsx(
                    'px-3 py-2.5 rounded-lg text-left text-xs transition-all',
                    'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    settings.model === opt.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border bg-surface text-text-secondary hover:border-border-strong',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 언어 ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              기본 응답 언어
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleChange({ language: e.target.value })}
              className={inputClass}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── KB 사용 ───────────────────────────────────────── */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle border border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">지식베이스(KB) 사용</p>
              <p className="text-xs text-text-muted mt-0.5">
                등록된 문서를 참고해 더 정확한 답변 제공
              </p>
            </div>
            <button
              role="switch"
              aria-checked={settings.use_kb}
              onClick={() => handleChange({ use_kb: !settings.use_kb })}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                settings.use_kb ? 'bg-primary' : 'bg-border-strong',
              )}
            >
              <span
                className={clsx(
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  settings.use_kb ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          {/* ── 답변 불가 메시지 ──────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              답변 불가 메시지
            </label>
            <p className="text-xs text-text-muted">챗봇이 답변하기 어려울 때 표시할 문구</p>
            <input
              type="text"
              value={settings.fallback_message}
              onChange={(e) => handleChange({ fallback_message: e.target.value })}
              className={inputClass}
              placeholder="죄송합니다. 해당 내용에 대한 답변을 드리기 어렵습니다."
              maxLength={500}
            />
          </div>

        </div>
      )}
    </div>
  );
}
