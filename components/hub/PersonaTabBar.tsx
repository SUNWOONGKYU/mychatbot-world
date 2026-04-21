/**
 * @task S12FE2
 * @description 페르소나 포털 탭바 — 최대 10탭 + 오버플로우 드롭다운 + `+` 탭
 *
 * 접근성:
 * - role="tablist"
 * - 각 탭 role="tab", aria-selected, tabIndex 관리
 * - 좌/우 arrow key 로 탭 이동
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import clsx from 'clsx';

export interface BotListItem {
  id: string;
  bot_name: string;
  emoji: string | null;
  unread_count: number;
}

interface Props {
  bots: BotListItem[];
  activeId: string | null;
  onSelect: (botId: string) => void;
  onAdd: () => void;
}

const VISIBLE_MAX = 10;
const NAME_MAX = 12;

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function PersonaTabBar({ bots, activeId, onSelect, onAdd }: Props) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visible = useMemo(() => bots.slice(0, VISIBLE_MAX), [bots]);
  const overflow = useMemo(() => bots.slice(VISIBLE_MAX), [bots]);
  const atLimit = bots.length >= VISIBLE_MAX;

  // 모바일: 활성 탭 자동 scrollIntoView
  useEffect(() => {
    if (!activeId) return;
    const idx = visible.findIndex((b) => b.id === activeId);
    if (idx < 0) return;
    const btn = tabRefs.current[idx];
    btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeId, visible]);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + visible.length) % visible.length;
      const btn = tabRefs.current[next];
      if (btn) {
        btn.focus();
        onSelect(visible[next].id);
      }
    },
    [visible, onSelect],
  );

  return (
    <div
      role="tablist"
      aria-label="페르소나 탭"
      className="sticky top-0 z-20 flex items-center gap-1 px-3 py-2 border-b border-border-default bg-surface-1/95 backdrop-blur-md overflow-x-auto snap-x snap-mandatory scroll-smooth"
    >
      {visible.map((bot, idx) => {
        const selected = bot.id === activeId;
        return (
          <button
            key={bot.id}
            ref={(el) => { tabRefs.current[idx] = el; }}
            role="tab"
            aria-selected={selected}
            aria-controls="hub-tabpanel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(bot.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={clsx(
              'snap-start flex-shrink-0 inline-flex items-center gap-1.5 h-11 min-w-[44px] px-3 rounded-md text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
              selected
                ? 'bg-surface-2 text-text-primary border-b-2 border-interactive-primary'
                : 'text-text-secondary hover:bg-surface-2/60',
            )}
            title={bot.bot_name}
          >
            <span aria-hidden>{bot.emoji || '🤖'}</span>
            <span>{truncate(bot.bot_name, NAME_MAX)}</span>
            {bot.unread_count > 0 && (
              <span
                aria-label={`읽지 않은 메시지 ${bot.unread_count}개`}
                className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-state-danger-bg text-state-danger-fg"
              >
                {bot.unread_count > 99 ? '99+' : bot.unread_count}
              </span>
            )}
          </button>
        );
      })}

      {overflow.length > 0 && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={overflowOpen}
            className="h-11 px-3 rounded-md text-sm text-text-secondary hover:bg-surface-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
          >
            …▼ <span className="ml-1 text-xs text-text-tertiary">({overflow.length})</span>
          </button>
          {overflowOpen && (
            <ul
              role="listbox"
              className="absolute right-0 top-full mt-1 min-w-[200px] max-h-[320px] overflow-y-auto rounded-lg border border-border-default bg-surface-0 shadow-[var(--shadow-lg)] z-50"
            >
              {overflow.map((bot) => (
                <li key={bot.id} role="option" aria-selected={bot.id === activeId}>
                  <button
                    onClick={() => {
                      onSelect(bot.id);
                      setOverflowOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-2"
                  >
                    <span aria-hidden>{bot.emoji || '🤖'}</span>
                    <span className="truncate">{bot.bot_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={atLimit}
        title={atLimit ? '최대 10개까지 추가 가능' : '새 페르소나 추가'}
        aria-label="새 페르소나 추가"
        className={clsx(
          'flex-shrink-0 ml-1 inline-flex items-center justify-center w-11 h-11 rounded-md text-lg transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus',
          atLimit
            ? 'text-text-tertiary cursor-not-allowed opacity-50'
            : 'text-text-secondary hover:bg-surface-2/60 hover:text-text-primary',
        )}
      >
        +
      </button>
    </div>
  );
}
