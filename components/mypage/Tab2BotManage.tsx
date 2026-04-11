/**
 * @task S5FE6
 * @description 마이페이지 탭2 — 챗봇 관리
 * 내 챗봇 목록(카드뷰), 페르소나 관리, per-persona 툴 6종, 복제/내보내기/삭제
 */
'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';

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
  { id: 'chatbot-school',label: '챗봇스쿨',     icon: '🎓', desc: '학습 현황 확인' },
  { id: 'community',    label: '커뮤니티',      icon: '🌐', desc: '커뮤니티 활동 내역' },
  { id: 'settings',     label: '챗봇 설정',     icon: '⚙️', desc: 'AI 모델/DM 보안 등' },
];

const DM_SECURITY_LEVELS = [
  { level: 1, label: '공개', desc: '누구나 DM 가능' },
  { level: 2, label: '팔로워', desc: '팔로워만 DM 가능' },
  { level: 3, label: '비공개', desc: 'DM 수신 차단' },
];

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('mcw_access_token') || sessionStorage.getItem('mcw_access_token') || '';
}
function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

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
    <div className="p-4 rounded-[var(--radius-md)] bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--border))] space-y-3">
      <p className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">배포 URL</p>
      {url ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[rgb(var(--color-primary))] truncate flex-1">{fullUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className={clsx(
                'text-xs px-3 py-1 rounded-[var(--radius-sm)] border transition-colors flex-shrink-0',
                copied
                  ? 'border-[rgb(var(--color-success))] text-[rgb(var(--color-success))]'
                  : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-strong))]',
              )}
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          {/* QR 코드 자리 (실제 QR 라이브러리 연동 예정) */}
          <div className="w-24 h-24 rounded-[var(--radius-sm)] bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border))] flex items-center justify-center">
            <span className="text-xs text-[rgb(var(--text-muted))]">QR 코드</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-[rgb(var(--text-muted))]">배포 URL이 없습니다. 챗봇을 배포해주세요.</p>
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
    <div className="p-4 rounded-[var(--radius-md)] bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--border))] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">
          페르소나 ({list.length}/10)
        </p>
        {list.length < 10 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs text-[rgb(var(--color-primary))] hover:underline"
          >
            + 추가
          </button>
        )}
      </div>

      <div className="space-y-2">
        {list.map(p => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))]"
          >
            <span className="text-sm text-[rgb(var(--text-primary))]">{p.name}</span>
            <button
              type="button"
              onClick={() => handleDelete(p.id)}
              className="text-xs text-[rgb(var(--color-error))] hover:underline"
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
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            className={clsx(
              'flex-1 px-3 py-1.5 text-sm rounded-[var(--radius-sm)] border border-[rgb(var(--border))]',
              'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))]',
              'focus:outline-none focus:border-[rgb(var(--color-primary))]',
            )}
          />
          <button type="button" onClick={handleAdd} className="text-sm text-[rgb(var(--color-primary))]">확인</button>
          <button type="button" onClick={() => setAdding(false)} className="text-sm text-[rgb(var(--text-muted))]">취소</button>
        </div>
      )}
    </div>
  );
}

// ── 하위 컴포넌트: per-persona 툴 6종 패널 ──────────────────────────────

function ToolPanel({ activeTool, onSelect }: { activeTool: ToolId | null; onSelect: (t: ToolId | null) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">툴 (6종)</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TOOL_LIST.map(tool => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(activeTool === tool.id ? null : tool.id)}
            className={clsx(
              'flex flex-col items-start px-3 py-2.5 rounded-[var(--radius-md)] border text-left transition-colors',
              activeTool === tool.id
                ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-muted))]'
                : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] hover:border-[rgb(var(--border-strong))]',
            )}
          >
            <span className="text-base mb-0.5">{tool.icon}</span>
            <span className={clsx(
              'text-xs font-semibold',
              activeTool === tool.id ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--text-primary))]',
            )}>
              {tool.label}
            </span>
            <span className="text-[10px] text-[rgb(var(--text-muted))] leading-tight">{tool.desc}</span>
          </button>
        ))}
      </div>

      {/* 툴 패널 콘텐츠 */}
      {activeTool && (
        <div className="mt-3 p-4 rounded-[var(--radius-md)] bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border))]">
          {activeTool === 'settings' ? (
            <BotSettingsPanel />
          ) : (
            <div className="text-sm text-[rgb(var(--text-secondary))] text-center py-4">
              <span className="text-2xl block mb-2">
                {TOOL_LIST.find(t => t.id === activeTool)?.icon}
              </span>
              {TOOL_LIST.find(t => t.id === activeTool)?.label} 패널 — 추후 연동 예정
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 하위 컴포넌트: 챗봇 설정 (DM 보안 + AI 모델) ───────────────────────

function BotSettingsPanel() {
  const [dmLevel, setDmLevel] = useState(1);
  const [model, setModel] = useState('gpt-4o-mini');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-2">DM 보안 정책</p>
        <div className="flex gap-2 flex-wrap">
          {DM_SECURITY_LEVELS.map(s => (
            <button
              key={s.level}
              type="button"
              onClick={() => setDmLevel(s.level)}
              className={clsx(
                'px-3 py-1.5 rounded-[var(--radius-md)] text-sm border transition-colors',
                dmLevel === s.level
                  ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-muted))] text-[rgb(var(--color-primary))]'
                  : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-strong))]',
              )}
            >
              {s.label}
              <span className="block text-[10px] opacity-70">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-2">AI 모델</p>
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          className={clsx(
            'px-3 py-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
            'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))] text-sm',
            'focus:outline-none focus:border-[rgb(var(--color-primary))]',
          )}
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </select>
      </div>
    </div>
  );
}

// ── 봇 카드 컴포넌트 ─────────────────────────────────────────────────────

function BotStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    active: { label: '활성', cls: 'bg-[rgb(var(--color-success)/0.15)] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]', dot: 'bg-[rgb(var(--color-success))]' },
    draft:  { label: '초안', cls: 'bg-[rgb(var(--color-warning)/0.15)] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]', dot: 'bg-[rgb(var(--color-warning))]' },
    paused: { label: '정지', cls: 'bg-[rgb(var(--bg-surface-hover))] text-[rgb(var(--text-muted))] border-border', dot: 'bg-[rgb(var(--text-muted))]' },
  };
  const s = map[status ?? 'draft'] ?? map.draft;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border', s.cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', s.dot)} />
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
    <div
      className={clsx(
        'rounded-[var(--radius-xl)] border transition-all',
        bot.status === 'draft'
          ? 'border-dashed border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-subtle))]'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]',
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* 카드 헤더 */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[rgb(var(--color-primary-muted))] flex items-center justify-center text-xl flex-shrink-0">
            {bot.emoji ?? '🤖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[rgb(var(--text-primary))] truncate">{bot.name}</span>
              <BotStatusBadge status={bot.status} />
            </div>
            {bot.description && (
              <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 truncate">{bot.description}</p>
            )}
            <div className="flex gap-4 mt-1.5">
              <span className="text-xs text-[rgb(var(--text-muted))]">
                대화 <span className="text-[rgb(var(--text-secondary))] font-medium">{(bot.conversation_count ?? 0).toLocaleString()}</span>
              </span>
              <span className="text-xs text-[rgb(var(--text-muted))]">
                페르소나 <span className="text-[rgb(var(--text-secondary))] font-medium">{bot.personas?.length ?? 0}</span>/10
              </span>
            </div>
          </div>
          <span className={clsx('text-[rgb(var(--text-muted))] transition-transform flex-shrink-0', expanded && 'rotate-180')}>
            ▾
          </span>
        </div>
      </div>

      {/* 카드 확장 콘텐츠 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[rgb(var(--border))] pt-4">
          {/* URL 패널 */}
          <UrlPanel url={bot.deploy_url} />

          {/* 페르소나 관리 */}
          <PersonaPanel personas={bot.personas ?? []} botId={bot.id} />

          {/* AI 인사말/FAQ 자동생성 */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={clsx(
                'px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--color-primary))]',
                'text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-muted))] transition-colors',
              )}
            >
              AI 인사말 자동생성
            </button>
            <button
              type="button"
              className={clsx(
                'px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--color-primary))]',
                'text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-muted))] transition-colors',
              )}
            >
              FAQ 자동생성
            </button>
          </div>

          {/* 툴 6종 패널 */}
          <ToolPanel activeTool={activeTool} onSelect={setActiveTool} />

          {/* 액션 버튼: 복제/내보내기/삭제 */}
          <div className="flex gap-2 flex-wrap pt-1 border-t border-[rgb(var(--border))]">
            <button
              type="button"
              onClick={() => onClone(bot.id)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-strong))]',
                'transition-colors',
              )}
            >
              복제
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-strong))]',
                'transition-colors disabled:opacity-50',
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
                    'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--color-error)/0.5)]',
                    'bg-[rgb(var(--color-error)/0.1)] text-[rgb(var(--color-error))] transition-colors',
                  )}
                >
                  확인 삭제
                </button>
                <button
                  type="button"
                  onClick={() => setDelConfirm(false)}
                  className="px-3 py-1.5 text-sm text-[rgb(var(--text-muted))]"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setDelConfirm(true)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--color-error)/0.3)]',
                  'text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error)/0.1)] transition-colors',
                )}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
          내 챗봇 ({bots.length})
        </h2>
        <a
          href="/birth"
          className={clsx(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold',
            'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
            'hover:bg-[rgb(var(--color-primary-hover))] transition-colors',
          )}
        >
          + 새 챗봇
        </a>
      </div>

      {/* 봇 카드 목록 */}
      {bots.length === 0 ? (
        <div className="text-center py-16 text-[rgb(var(--text-muted))]">
          <p className="text-4xl mb-3">🤖</p>
          <p className="font-medium">아직 챗봇이 없습니다.</p>
          <p className="text-sm mt-1">새 챗봇을 만들어보세요!</p>
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
      <div className="pt-2 border-t border-[rgb(var(--border))]">
        <label className={clsx(
          'inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-[var(--radius-md)]',
          'text-sm text-[rgb(var(--text-secondary))] border border-dashed border-[rgb(var(--border))]',
          'hover:border-[rgb(var(--border-strong))] transition-colors',
        )}>
          <span>JSON에서 챗봇 가져오기</span>
          <input type="file" accept=".json" className="hidden" />
        </label>
      </div>
    </div>
  );
}
