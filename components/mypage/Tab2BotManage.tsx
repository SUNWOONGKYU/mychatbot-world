/**
 * @task S7FE7
 * @description 마이페이지 탭2 — 코코봇 관리 (S7 리디자인)
 * Semantic 토큰 전용, EmptyState + Card + Badge + 반응형
 */
'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';
import QRImage from '@/components/common/qr-image';
import ChatLogPanel from '@/components/mypage/panels/ChatLogPanel';
import KbPanel from '@/components/mypage/panels/KbPanel';
import SkillsMountPanel from '@/components/mypage/panels/SkillsMountPanel';
import LearningPanel from '@/components/mypage/panels/LearningPanel';
import CommunityPanel from '@/components/mypage/panels/CommunityPanel';
import BotSettings from '@/components/mypage/panels/BotSettings';

// ── 타입 ─────────────────────────────────────────────────────────────────

interface Persona {
  id: string;
  name: string;
  description?: string;
}

interface BotItem {
  id: string;
  name: string;
  description: string | null;
  emoji?: string | null;
  deploy_url: string | null;
  created_at: string;
  status?: 'active' | 'draft' | 'paused';
  conversation_count?: number;
  personas?: Persona[];
}

type ToolId = 'chat-log' | 'kb' | 'skills' | 'chatbot-school' | 'community' | 'settings';

const TOOL_LIST: { id: ToolId; label: string; icon: string; desc: string }[] = [
  { id: 'chat-log',      label: '대화 로그',    icon: '💬', desc: '대화 기록 조회' },
  { id: 'kb',           label: 'KB 지식베이스', icon: '📚', desc: '지식 업로드/관리' },
  { id: 'skills',       label: '스킬 장착',     icon: '⚡', desc: '스킬 장착/해제' },
  { id: 'chatbot-school',label: '학습',         icon: '🎓', desc: '학습 현황 확인' },
  { id: 'community',    label: '커뮤니티',      icon: '🌐', desc: '커뮤니티 활동 내역' },
  { id: 'settings',     label: '코코봇 설정',   icon: '⚙️', desc: 'AI 모델/DM 보안 등' },
];

// ── 하위 컴포넌트: QR + URL 패널 ─────────────────────────────────────────

function UrlPanel({ url }: { url: string | null }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = url ? `https://${url}` : '';
  const handleCopy = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-1)] border border-[var(--border-default)] space-y-3">
      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">배포 URL</p>
      {url ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-link)] truncate flex-1">{fullUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? '복사됨' : 'URL 복사'}
              className={clsx(
                'text-xs px-3 py-1 rounded-[var(--radius-sm)] border transition-colors flex-shrink-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
                copied
                  ? 'border-[var(--state-success-border)] text-[var(--state-success-fg)] bg-[var(--state-success-bg)]'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
              )}
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <div
            className="w-24 h-24 rounded-[var(--radius-sm)] bg-white border border-[var(--border-subtle)] flex items-center justify-center p-1"
            aria-label="QR 코드"
          >
            <QRImage value={fullUrl} size={92} alt={`${fullUrl} QR 코드`} className="w-full h-full object-contain" />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-tertiary)]">배포 URL이 없습니다. 코코봇을 배포해주세요.</p>
      )}
    </div>
  );
}

// ── 하위 컴포넌트: AI 인사말 자동생성 ────────────────────────────────────

function GreetingAutoGen({ botId, botName, botDesc }: { botId: string; botName: string; botDesc: string | null }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/create-bot/analyze', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: botName,
          description: [botDesc ?? '', hint.trim()].filter(Boolean).join(' / '),
        }),
      });
      const d = await res.json();
      const greeting =
        d?.data?.suggestedGreeting ??
        d?.suggestedGreeting ??
        d?.data?.greeting ??
        '';
      if (greeting) setResult(greeting);
      else setMsg('생성 실패 — 직접 입력해주세요');
    } catch {
      setMsg('생성 실패 — 직접 입력해주세요');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!result.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ greeting: result.trim() }),
      });
      setMsg(res.ok ? '인사말 저장 완료' : '저장 실패');
    } catch {
      setMsg('저장 실패');
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          'px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--interactive-primary)]',
          'text-[var(--interactive-primary)] hover:bg-[var(--surface-2)] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
        )}
      >
        AI 인사말 자동생성
      </button>
    );
  }

  return (
    <div className="w-full p-4 rounded-[var(--radius-md)] bg-[var(--surface-1)] border border-[var(--border-default)] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">AI 인사말 자동생성</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-[var(--text-tertiary)] hover:underline">닫기</button>
      </div>
      <input
        type="text"
        value={hint}
        onChange={e => setHint(e.target.value)}
        placeholder="힌트 (선택) — 예: 친근하게, 격식있게, 타겟 연령대 등"
        maxLength={200}
        className={clsx(
          'w-full px-3 py-2 text-sm rounded-[var(--radius-sm)]',
          'border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]',
          'focus:outline-none focus:border-[var(--interactive-primary)]',
        )}
      />
      <textarea
        value={result}
        onChange={e => setResult(e.target.value)}
        placeholder="AI 생성 버튼을 누르거나 직접 입력하세요"
        rows={3}
        maxLength={500}
        className={clsx(
          'w-full px-3 py-2 text-sm rounded-[var(--radius-sm)]',
          'border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]',
          'focus:outline-none focus:border-[var(--interactive-primary)]',
        )}
      />
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--interactive-primary)] text-[var(--interactive-primary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        >
          {loading ? '생성중...' : 'AI 생성'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !result.trim()}
          className="px-3 py-1.5 text-sm rounded-[var(--radius-md)] bg-[var(--interactive-primary)] text-[var(--text-inverted)] hover:bg-[var(--interactive-primary-hover)] disabled:opacity-50"
        >
          저장
        </button>
        {msg && <span className="text-xs text-[var(--text-tertiary)]">{msg}</span>}
      </div>
    </div>
  );
}

// ── 하위 컴포넌트: AI FAQ 자동생성 ────────────────────────────────────────

interface GenFaqItem { question: string; answer: string; selected: boolean }

function FaqAutoGen({ botId, botName, botDesc }: { botId: string; botName: string; botDesc: string | null }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState('');
  const [items, setItems] = useState<GenFaqItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/create-bot/faq', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: botName,
          description: [botDesc ?? '', hint.trim()].filter(Boolean).join(' / '),
          keywords: hint.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const d = await res.json();
      const faqs = d?.data?.faqs as Array<{ question: string; answer: string }> | undefined;
      if (faqs && faqs.length > 0) {
        setItems(faqs.map(f => ({ ...f, selected: true })));
      } else {
        setMsg('생성 실패');
      }
    } catch {
      setMsg('생성 실패');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const picks = items.filter(i => i.selected && i.question.trim() && i.answer.trim());
    if (picks.length === 0) return;
    setLoading(true);
    setMsg(null);
    let ok = 0;
    for (let i = 0; i < picks.length; i++) {
      try {
        const res = await fetch('/api/faq', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            chatbot_id: botId,
            question: picks[i].question.trim(),
            answer: picks[i].answer.trim(),
            order_index: i,
          }),
        });
        if (res.ok) ok++;
      } catch { /* continue */ }
    }
    setMsg(`${ok}/${picks.length}개 FAQ 저장됨`);
    setLoading(false);
  };

  const update = (idx: number, patch: Partial<GenFaqItem>) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          'px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--interactive-primary)]',
          'text-[var(--interactive-primary)] hover:bg-[var(--surface-2)] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
        )}
      >
        FAQ 자동생성
      </button>
    );
  }

  return (
    <div className="w-full p-4 rounded-[var(--radius-md)] bg-[var(--surface-1)] border border-[var(--border-default)] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">FAQ 자동생성</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-[var(--text-tertiary)] hover:underline">닫기</button>
      </div>
      <input
        type="text"
        value={hint}
        onChange={e => setHint(e.target.value)}
        placeholder="키워드 (쉼표 구분, 선택) — 예: 가격, 배송, 환불"
        maxLength={200}
        className={clsx(
          'w-full px-3 py-2 text-sm rounded-[var(--radius-sm)]',
          'border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]',
          'focus:outline-none focus:border-[var(--interactive-primary)]',
        )}
      />
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--interactive-primary)] text-[var(--interactive-primary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        >
          {loading ? '생성중...' : 'AI 생성'}
        </button>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-[var(--radius-md)] bg-[var(--interactive-primary)] text-[var(--text-inverted)] hover:bg-[var(--interactive-primary-hover)] disabled:opacity-50"
          >
            선택 항목 저장
          </button>
        )}
        {msg && <span className="text-xs text-[var(--text-tertiary)]">{msg}</span>}
      </div>

      {items.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {items.map((it, idx) => (
            <div key={idx} className="p-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={it.selected}
                  onChange={e => update(idx, { selected: e.target.checked })}
                  className="mt-1.5"
                  aria-label={`FAQ ${idx + 1} 선택`}
                />
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={it.question}
                    onChange={e => update(idx, { question: e.target.value })}
                    placeholder="질문"
                    className="w-full px-2 py-1 text-xs rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]"
                  />
                  <textarea
                    value={it.answer}
                    onChange={e => update(idx, { answer: e.target.value })}
                    placeholder="답변"
                    rows={2}
                    className="w-full px-2 py-1 text-xs rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 하위 컴포넌트: per-persona 툴 6종 패널 ──────────────────────────────

function ToolPanel({ activeTool, onSelect, botId, bot }: {
  activeTool: ToolId | null;
  onSelect: (t: ToolId | null) => void;
  botId: string;
  bot: BotItem;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">툴 (6종)</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="코코봇 툴 선택">
        {TOOL_LIST.map(tool => (
          <button
            key={tool.id}
            type="button"
            aria-pressed={activeTool === tool.id}
            onClick={() => onSelect(activeTool === tool.id ? null : tool.id)}
            className={clsx(
              'flex flex-col items-start px-3 py-2.5 rounded-[var(--radius-md)] border text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              activeTool === tool.id
                ? 'border-[var(--interactive-primary)] bg-[var(--surface-1)]'
                : 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--border-strong)]',
            )}
          >
            <span className="text-base mb-0.5" aria-hidden="true">{tool.icon}</span>
            <span className={clsx(
              'text-xs font-semibold',
              activeTool === tool.id ? 'text-[var(--interactive-primary)]' : 'text-[var(--text-primary)]',
            )}>
              {tool.label}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] leading-tight [word-break:keep-all]">{tool.desc}</span>
          </button>
        ))}
      </div>

      {/* 툴 패널 콘텐츠 — S10 6도구 연동 */}
      {activeTool && (
        <div className="mt-3 p-4 rounded-[var(--radius-md)] bg-[var(--surface-1)] border border-[var(--border-default)]">
          {activeTool === 'chat-log' && <ChatLogPanel botId={botId} />}
          {activeTool === 'kb' && <KbPanel botId={botId} />}
          {activeTool === 'skills' && <SkillsMountPanel botId={botId} />}
          {activeTool === 'chatbot-school' && <LearningPanel botId={botId} />}
          {activeTool === 'community' && <CommunityPanel botId={botId} />}
          {activeTool === 'settings' && (
            <BotSettings
              botId={botId}
              initial={{
                tone: (bot as BotItem & { tone?: string | null }).tone ?? null,
                model: (bot as BotItem & { model?: string | null }).model ?? null,
                greeting: (bot as BotItem & { greeting?: string | null }).greeting ?? null,
                persona_traits: (bot as BotItem & { persona_traits?: Record<string, unknown> | null }).persona_traits ?? null,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── 봇 카드 컴포넌트 ─────────────────────────────────────────────────────

function BotStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string; dot: string }> = {
    active: {
      label: '활성',
      bg: 'bg-[var(--state-success-bg)]',
      fg: 'text-[var(--state-success-fg)]',
      border: 'border-[var(--state-success-border)]',
      dot: 'bg-[var(--state-success-fg)]',
    },
    draft: {
      label: '초안',
      bg: 'bg-[var(--state-warning-bg)]',
      fg: 'text-[var(--state-warning-fg)]',
      border: 'border-[var(--state-warning-border)]',
      dot: 'bg-[var(--state-warning-fg)]',
    },
    paused: {
      label: '정지',
      bg: 'bg-[var(--surface-2)]',
      fg: 'text-[var(--text-tertiary)]',
      border: 'border-[var(--border-default)]',
      dot: 'bg-[var(--text-tertiary)]',
    },
  };
  const s = map[status ?? 'draft'] ?? map.draft;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold border',
        s.bg, s.fg, s.border,
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  );
}

function BotCard({ bot, onDelete, onClone }: {
  bot: BotItem;
  onDelete: (id: string) => void;
  onClone: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [delConfirm, setDelConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/bots/${bot.id}/export`, { headers: authHeaders() });
      if (!res.ok) throw new Error('내보내기 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bot-${bot.name}-backup.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    setExporting(false);
  };

  return (
    <article
      className={clsx(
        'rounded-[var(--radius-xl)] border transition-all',
        bot.status === 'draft'
          ? 'border-dashed border-[var(--border-strong)] bg-[var(--surface-1)]'
          : 'border-[var(--border-default)] bg-[var(--surface-1)]',
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
      aria-label={`${bot.name} 코코봇`}
    >
      {/* 카드 헤더 */}
      <div
        className="p-4 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={`bot-detail-${bot.id}`}
        onClick={() => setExpanded(v => !v)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); }}}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--surface-2)] flex items-center justify-center text-xl flex-shrink-0"
            aria-hidden="true"
          >
            {bot.emoji ?? '🤖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[var(--text-primary)] truncate">{bot.name}</span>
              <BotStatusBadge status={bot.status} />
            </div>
            {bot.description && (
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate [word-break:keep-all]">{bot.description}</p>
            )}
            <div className="flex gap-4 mt-1.5">
              <span className="text-xs text-[var(--text-tertiary)]">
                대화 <span className="text-[var(--text-secondary)] font-medium">{(bot.conversation_count ?? 0).toLocaleString()}</span>
              </span>
            </div>
          </div>
          <span
            className={clsx('text-[var(--text-tertiary)] transition-transform flex-shrink-0 text-sm', expanded && 'rotate-180')}
            aria-hidden="true"
          >
            ▾
          </span>
        </div>
      </div>

      {/* 카드 확장 콘텐츠 */}
      {expanded && (
        <div
          id={`bot-detail-${bot.id}`}
          className="px-4 pb-4 space-y-4 border-t border-[var(--border-default)] pt-4"
        >
          <UrlPanel url={bot.deploy_url} />

          {/* AI 자동생성 — 인사말 / FAQ (입력 + 생성 + 편집 + 저장) */}
          <div className="flex gap-2 flex-wrap">
            <GreetingAutoGen botId={bot.id} botName={bot.name} botDesc={bot.description} />
            <FaqAutoGen botId={bot.id} botName={bot.name} botDesc={bot.description} />
          </div>

          <ToolPanel activeTool={activeTool} onSelect={setActiveTool} botId={bot.id} bot={bot} />

          {/* 액션 버튼: 복제/내보내기/삭제 */}
          <div className="flex gap-2 flex-wrap pt-1 border-t border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => onClone(bot.id)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)]',
                'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              )}
            >
              복제
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)]',
                'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]',
                'transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              )}
            >
              {exporting ? '내보내는 중...' : '내보내기'}
            </button>
            {delConfirm ? (
              <>
                <button
                  type="button"
                  onClick={() => { onDelete(bot.id); setDelConfirm(false); }}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border',
                    'border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] text-[var(--state-danger-fg)]',
                    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
                  )}
                >
                  확인 삭제
                </button>
                <button
                  type="button"
                  onClick={() => setDelConfirm(false)}
                  className="px-3 py-1.5 text-sm text-[var(--text-tertiary)] hover:underline"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setDelConfirm(true)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border',
                  'border-[var(--state-danger-border)] text-[var(--state-danger-fg)]',
                  'hover:bg-[var(--state-danger-bg)] transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
                )}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────

interface Tab2BotManageProps {
  bots: BotItem[];
  onBotsChange: (bots: BotItem[]) => void;
}

export default function Tab2BotManage({ bots, onBotsChange }: Tab2BotManageProps) {
  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/bots/${id}`, { method: 'DELETE', headers: authHeaders() });
      onBotsChange(bots.filter(b => b.id !== id));
    } catch { /* silent */ }
  }, [bots, onBotsChange]);

  const handleClone = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/bots/${id}/clone`, { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error();
      const newBot: BotItem = await res.json();
      onBotsChange([...bots, newBot]);
    } catch { /* silent */ }
  }, [bots, onBotsChange]);

  return (
    <div className="space-y-4">
      {/* 페르소나 포털 진입 배너 — 봇 1개 이상일 때만 */}
      {bots.length > 0 && (
        <a
          href="/hub"
          className={clsx(
            'flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius-lg)]',
            'bg-[var(--interactive-primary)]/10 border border-[var(--interactive-primary)]/30',
            'hover:bg-[var(--interactive-primary)]/20 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
          )}
          aria-label="페르소나 포털 — 내 코코봇과 대화하기"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl" aria-hidden="true">💬</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                페르소나 포털로 이동
              </div>
              <div className="text-xs text-[var(--text-secondary)] [word-break:keep-all]">
                내 코코봇 {bots.length}개를 탭 하나로 오가며 대화하세요
              </div>
            </div>
          </div>
          <span
            aria-hidden="true"
            className="flex-shrink-0 text-[var(--interactive-primary)] text-lg"
          >
            →
          </span>
        </a>
      )}

      {/* PageToolbar 패턴 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          내 코코봇 ({bots.length})
        </h2>
        <a
          href="/create"
          className={clsx(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold',
            'bg-[var(--interactive-primary)] text-[var(--text-inverted)]',
            'hover:bg-[var(--interactive-primary-hover)] transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
          )}
        >
          + 새 코코봇 페르소나
        </a>
      </div>

      {/* 봇 카드 목록 — EmptyState */}
      {bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <span className="text-4xl" aria-hidden="true">🤖</span>
          <p className="font-semibold text-[var(--text-secondary)] [word-break:keep-all]">
            아직 코코봇이 없습니다.
          </p>
          <p className="text-sm text-[var(--text-tertiary)] [word-break:keep-all]">
            새 코코봇을 만들어보세요!
          </p>
          <a
            href="/create"
            className={clsx(
              'mt-2 px-5 py-2 rounded-[var(--radius-lg)] text-sm font-semibold',
              'bg-[var(--interactive-primary)] text-[var(--text-inverted)]',
              'hover:bg-[var(--interactive-primary-hover)] transition-colors',
            )}
          >
            코코봇 만들기
          </a>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {bots.map(bot => (
            <BotCard
              key={bot.id}
              bot={bot}
              onDelete={handleDelete}
              onClone={handleClone}
            />
          ))}
        </div>
      )}

      {/* 가져오기 */}
      <div className="pt-2 border-t border-[var(--border-default)]">
        <label className={clsx(
          'inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-[var(--radius-md)]',
          'text-sm text-[var(--text-secondary)] border border-dashed border-[var(--border-default)]',
          'hover:border-[var(--border-strong)] transition-colors',
        )}>
          <span>JSON에서 코코봇 가져오기</span>
          <input type="file" accept=".json" className="hidden" aria-label="JSON 파일로 코코봇 가져오기" />
        </label>
      </div>
    </div>
  );
}
