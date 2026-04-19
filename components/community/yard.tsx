/**
 * @task S3FE4
 * @description 실시간 마당(Yard) 컴포넌트
 * - 채팅형 실시간 메시지 표시
 * - Supabase Realtime Presence (접속자 수 표시)
 * - 메시지 입력/전송
 * - 컴포넌트 언마운트 시 channel.unsubscribe() 필수
 */
'use client';

import {
  useState,
  useEffect,
  useRef,
  FormEvent,
  useCallback,
} from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { subscribeToYard } from '@/lib/realtime-client';
import type { YardMessage } from '@/lib/realtime-client';

// ── 유틸 ────────────────────────────────────────────────────

function timeShort(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── 서브 컴포넌트: MessageBubble ─────────────────────────────

function MessageBubble({
  message,
  isOwn,
}: {
  message: YardMessage;
  isOwn: boolean;
}) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* 아바타 */}
      {!isOwn && (
        message.author?.avatar_url ? (
          <Image
            src={message.author.avatar_url}
            alt={message.author.name}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center
                          justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-primary">
              {(message.author?.name ?? 'U')[0].toUpperCase()}
            </span>
          </div>
        )
      )}

      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* 작성자 이름 (타인 메시지만) */}
        {!isOwn && (
          <span className="text-xs text-text-muted px-1">
            {message.author?.name ?? '익명'}
          </span>
        )}

        {/* 말풍선 */}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-surface border border-border text-text-primary rounded-bl-sm'
            }`}
        >
          {message.content}
        </div>

        {/* 시간 */}
        <span className="text-[10px] text-text-muted px-1">
          {timeShort(message.created_at)}
        </span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

interface YardProps {
  /** 현재 로그인 사용자 ID (없으면 읽기 전용) */
  userId?: string;
  /** 최대 높이 (기본 400px) */
  maxHeight?: number;
}

export function Yard({ userId, maxHeight = 400 }: YardProps) {
  const [messages,     setMessages]     = useState<YardMessage[]>([]);
  const [onlineCount,  setOnlineCount]  = useState(0);
  const [inputText,    setInputText]    = useState('');
  const [sending,      setSending]      = useState(false);
  const [connected,    setConnected]    = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);

  // ── 히스토리 로드 ────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/community/yard?limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setMessages((data.messages ?? []).slice().reverse());
    } catch {
      // non-fatal
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Realtime 구독 ────────────────────────────────────────

  useEffect(() => {
    if (!userId || !historyLoaded) return;

    const channel = subscribeToYard(
      userId,
      (message) => {
        setMessages(prev => {
          // 중복 방지
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      },
      (onlineUsers) => {
        setOnlineCount(onlineUsers.size);
        setConnected(true);
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [userId, historyLoaded]);

  // ── 스크롤 to bottom ────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 메시지 전송 ─────────────────────────────────────────

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !userId || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/community/yard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setInputText('');
      inputRef.current?.focus();
    } catch {
      // silently fail — Realtime will deliver to others anyway
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col border border-border rounded-xl bg-bg-base overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-text-primary">마당 (Yard)</span>
          <span className="text-xs text-text-muted">실시간 채팅</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-success' : 'bg-border'
            }`}
          />
          {connected ? `${onlineCount}명 접속 중` : '연결 중…'}
        </div>
      </div>

      {/* 메시지 목록 */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ maxHeight }}
      >
        {!historyLoaded && (
          <div className="text-center text-xs text-text-muted py-4 animate-pulse">
            불러오는 중…
          </div>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="text-center text-xs text-text-muted py-8">
            아직 메시지가 없습니다. 첫 메시지를 남겨보세요!
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.user_id === userId}
          />
        ))}

        {/* 스크롤 앵커 */}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      {userId ? (
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 px-3 py-3 border-t border-border bg-surface"
        >
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력 (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            maxLength={500}
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-border bg-bg-base
                       text-text-primary placeholder:text-text-muted resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition max-h-24 overflow-y-auto"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="px-3 py-2 text-sm font-medium rounded-xl
                       bg-primary text-white hover:bg-primary-hover
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex-shrink-0"
            aria-label="전송"
          >
            {sending ? '…' : '전송'}
          </button>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-border text-xs text-center text-text-muted bg-surface">
          메시지를 보내려면 로그인이 필요합니다.
        </div>
      )}
    </div>
  );
}

export default Yard;
