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

// ── 하위 컴포넌트: 페르소나 관리 ──────────────────────────────────────────

function PersonaPanel({ personas, botId }: { personas: Persona[]; botId: string }) {
  const [list, setList] = useState<Persona[]>(personas);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim() || list.length >= 10) return;
    const name = newName.trim();
    setNewName('');
    setAdding(false);
    try {
      const res = await fetch(`/api/bots/${botId}/personas`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (res.ok && d.data) {
        setList(prev => [...prev, { id: d.data.id, name: d.data.name }]);
      } else {
        setList(prev => [...prev, { id: `temp-${Date.now()}`, name }]);
      }
    } catch {
      setList(prev => [...prev, { id: `temp-${Date.now()}`, name }]);
    }
  };

  const handleDelete = async (id: string) => {
    setList(prev => prev.filter(p => p.id !== id));
    if (id.startsWith('temp-')) return;
    try {
      await fetch(`/api/bots/${botId}/personas`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ personaId: id }),
      });
    } catch { /* silent */ }
  };

  return (
    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-1)] border border-[var(--border-default)] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
          페르소나 ({list.length}/10)
        </p>
        {list.length < 10 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={clsx(
              'text-xs font-medium text-[var(--interactive-primary)]',
              'hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring-focus)]',
            )}
          >
            + 추가
          </button>
        )}
      </div>

      <div className="space-y-2">
        {list.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border-subtle)]"
          >
            <span className="text-sm text-[var(--text-primary)]">{p.name}</span>
            <button
              type="button"
              aria-label={`${p.name} 페르소나 삭제`}
              onClick={() => handleDelete(p.id)}
              className="text-xs text-[var(--state-danger-fg)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring-focus)]"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="페르소나 이름"
            maxLength={30}
            autoFocus
            aria-label="새 페르소나 이름"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            className={clsx(
              'flex-1 px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
              'border border-[var(--border-default)] bg-[var(--surface-0)] text-[var(--text-primary)]',
              'focus:outline-none focus:border-[var(--interactive-primary)]',
              'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
            )}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="text-sm font-medium text-[var(--interactive-primary)] hover:underline"
          >
            확인
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="text-sm text-[var(--text-tertiary)] hover:underline"
          >
            취소
          </button>
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
              <span className="text-xs text-[var(--text-tertiary)]">
                페르소나 <span className="text-[var(--text-secondary)] font-medium">{bot.personas?.length ?? 0}</span>/10
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
          <PersonaPanel personas={bot.personas ?? []} botId={bot.id} />

          {/* AI 자동생성 버튼 */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={clsx(
                'px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--interactive-primary)]',
                'text-[var(--interactive-primary)] hover:bg-[var(--surface-2)] transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              )}
            >
              AI 인사말 자동생성
            </button>
            <button
              type="button"
              className={clsx(
                'px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--interactive-primary)]',
                'text-[var(--interactive-primary)] hover:bg-[var(--surface-2)] transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              )}
            >
              FAQ 자동생성
            </button>
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
          + 새 코코봇
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
