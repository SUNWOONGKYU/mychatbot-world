/**
 * @task S2FE6 - Guest 모드 React 전환
 * @description 게스트 채팅 UI — 메시지 버블 + 입력창
 *
 * 책임:
 * - 대화 메시지 버블 렌더링 (user / bot 구분)
 * - 텍스트 입력창 + 전송 버튼
 * - /api/chat 호출 (Authorization 헤더 없이)
 * - localStorage에 대화 로그 저장
 * - 10회 초과 시 onLimitReached 콜백 호출
 * - 로딩 중 스켈레톤 버블
 * - 반응형 레이아웃, 디자인 토큰 사용
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';

/* ── 타입 정의 ──────────────────────────────────────────────── */

/** 단일 메시지 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  /** ISO 타임스탬프 */
  createdAt: string;
}

/** localStorage 저장 키 */
const LS_KEY = 'mcw_guest_chat';

/** 무료 체험 최대 횟수 */
const MAX_TURNS = 10;

/* ── GuestChat Props ─────────────────────────────────────────── */

interface GuestChatProps {
  /** 데모 챗봇 ID (없으면 기본 데모봇) */
  botId?: string;
  /** 10회 한도 초과 시 콜백 */
  onLimitReached: () => void;
}

/* ── 헬퍼: 고유 ID ───────────────────────────────────────────── */

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── 헬퍼: localStorage R/W ──────────────────────────────────── */

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(msgs));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

/* ── 컴포넌트 ────────────────────────────────────────────────── */

/**
 * GuestChat — 게스트 채팅 UI
 *
 * @example
 * <GuestChat botId="demo-1" onLimitReached={() => setShowPrompt(true)} />
 */
export function GuestChat({ botId, onLimitReached }: GuestChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  /** user 발화 횟수 (bot 응답은 카운트 안 함) */
  const [turnCount, setTurnCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ── localStorage에서 복원 ──────────────────────────────── */
  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
      // user 발화 횟수 복원
      const userCount = stored.filter((m) => m.role === 'user').length;
      setTurnCount(userCount);
    } else {
      // 웰컴 메시지
      const welcome: ChatMessage = {
        id: genId(),
        role: 'bot',
        content: '안녕하세요! 저는 My Chatbot World 데모 챗봇이에요. 무엇이든 물어보세요. 회원가입 없이 10회까지 무료로 체험할 수 있어요.',
        createdAt: new Date().toISOString(),
      };
      setMessages([welcome]);
    }
  }, []);

  /* ── 새 메시지 올 때마다 스크롤 ──────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ── 전송 로직 ──────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // 한도 초과 체크
    if (turnCount >= MAX_TURNS) {
      onLimitReached();
      return;
    }

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    saveMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);

    // 한도 도달 시 봇 응답 전에 모달 표시
    if (nextTurn >= MAX_TURNS) {
      // 마지막 봇 응답은 보여주고 모달 열기
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Authorization 헤더 없음 — 게스트 모드
        body: JSON.stringify({
          message: text,
          botId: botId ?? 'demo',
          history: nextMessages.slice(-10).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      let botContent = '죄송해요, 잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
      if (res.ok) {
        const data = await res.json() as { reply?: string; message?: string };
        botContent = data.reply ?? data.message ?? botContent;
      }

      const botMsg: ChatMessage = {
        id: genId(),
        role: 'bot',
        content: botContent,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...nextMessages, botMsg];
      setMessages(finalMessages);
      saveMessages(finalMessages);

      // 10회 도달 후 모달
      if (nextTurn >= MAX_TURNS) {
        setTimeout(onLimitReached, 600);
      }
    } catch {
      const errMsg: ChatMessage = {
        id: genId(),
        role: 'bot',
        content: '네트워크 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
        createdAt: new Date().toISOString(),
      };
      const errMessages = [...nextMessages, errMsg];
      setMessages(errMessages);
      saveMessages(errMessages);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, turnCount, botId, onLimitReached]);

  /* ── Enter 키 전송 (Shift+Enter: 줄바꿈) ─────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── textarea 자동 높이 ──────────────────────────────────── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // 높이 자동 조절
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const isAtLimit = turnCount >= MAX_TURNS;
  const remaining = Math.max(0, MAX_TURNS - turnCount);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── 메시지 리스트 ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* 로딩 스켈레톤 */}
        {isLoading && <TypingBubble />}

        {/* 스크롤 앵커 */}
        <div ref={bottomRef} />
      </div>

      {/* ── 입력 영역 ─────────────────────────────────────── */}
      <div
        className={clsx(
          'shrink-0 border-t border-border',
          'bg-surface px-4 py-3',
        )}
      >
        {/* 남은 횟수 표시 */}
        {!isAtLimit && turnCount > 0 && (
          <p className="text-xs text-text-muted text-right mb-1.5">
            남은 무료 체험{' '}
            <span
              className={clsx(
                'font-semibold',
                remaining <= 3 ? 'text-error' : 'text-primary',
              )}
            >
              {remaining}회
            </span>
          </p>
        )}

        {isAtLimit ? (
          /* 한도 초과 — 가입 유도 인라인 배너 */
          <div
            className={clsx(
              'flex items-center justify-between gap-3',
              'rounded-xl border border-primary/30 bg-primary/5',
              'px-4 py-3',
            )}
          >
            <p className="text-sm text-text-secondary">
              무료 체험 10회를 모두 사용했어요.
            </p>
            <button
              type="button"
              onClick={onLimitReached}
              className={clsx(
                'shrink-0 px-3 py-1.5 rounded-lg',
                'bg-primary text-white text-xs font-semibold',
                'hover:bg-primary-hover transition-colors',
              )}
            >
              가입하기
            </button>
          </div>
        ) : (
          /* 정상 입력창 */
          <div
            className={clsx(
              'flex items-end gap-2',
              'rounded-xl border border-border bg-bg-base',
              'px-3 py-2',
              'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
              'transition-all duration-150',
            )}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
              rows={1}
              disabled={isLoading}
              className={clsx(
                'flex-1 resize-none bg-transparent',
                'text-sm text-text-primary placeholder:text-text-muted',
                'focus:outline-none',
                'disabled:opacity-50',
                'max-h-[120px] overflow-y-auto leading-relaxed',
              )}
              aria-label="메시지 입력"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={clsx(
                'flex items-center justify-center',
                'w-8 h-8 rounded-lg shrink-0',
                'bg-primary text-white',
                'hover:bg-primary-hover transition-colors duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              )}
              aria-label="전송"
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MessageBubble ───────────────────────────────────────────── */

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex gap-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* 아바타 */}
      {!isUser && (
        <div
          className={clsx(
            'flex items-center justify-center',
            'w-7 h-7 rounded-full shrink-0 mt-0.5',
            'bg-primary/15 text-primary text-xs font-bold select-none',
          )}
          aria-hidden="true"
        >
          AI
        </div>
      )}

      {/* 버블 */}
      <div
        className={clsx(
          'max-w-[75%] sm:max-w-[65%]',
          'px-3.5 py-2.5 rounded-2xl',
          'text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-chat-user text-chat-user-text rounded-tr-sm'
            : 'bg-chat-bot text-chat-bot-text rounded-tl-sm border border-border',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

/* ── TypingBubble (로딩 스켈레톤) ───────────────────────────── */

function TypingBubble() {
  return (
    <div className="flex gap-2">
      <div
        className={clsx(
          'flex items-center justify-center',
          'w-7 h-7 rounded-full shrink-0 mt-0.5',
          'bg-primary/15 text-primary text-xs font-bold select-none',
        )}
        aria-hidden="true"
      >
        AI
      </div>
      <div
        className={clsx(
          'flex items-center gap-1.5',
          'px-4 py-3 rounded-2xl rounded-tl-sm',
          'bg-chat-bot border border-border',
        )}
        aria-label="답변 생성 중"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 아이콘 컴포넌트 ─────────────────────────────────────────── */

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.5 7L2 2l2.5 5L2 12l10.5-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
