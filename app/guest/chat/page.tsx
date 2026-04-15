/**
 * @task S3FE1 — 게스트 채팅 페이지
 * @description /guest/chat — 게스트 모드 AI 챗봇 대화 화면
 *
 * localStorage에서 botId / botName / category를 읽어 GuestChat 컴포넌트 렌더링
 * 10회 한도 초과 시 회원가입 유도 모달 표시
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GuestChat } from '@/components/guest/guest-chat';

const STORAGE_KEYS = {
  BOT_ID:   'mcw_guest_bot_id',
  BOT_NAME: 'mcw_guest_bot_name',
  CATEGORY: 'mcw_guest_category',
} as const;

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

export default function GuestChatPage() {
  const router = useRouter();
  const [botId, setBotId]     = useState<string | null>(null);
  const [botName, setBotName] = useState<string>('AI 코코봇');
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id   = lsGet(STORAGE_KEYS.BOT_ID);
    const name = lsGet(STORAGE_KEYS.BOT_NAME);
    if (!id) {
      router.replace('/guest');
      return;
    }
    setBotId(id);
    if (name) setBotName(name);
  }, [router]);

  if (!mounted || !botId) return null;

  return (
    <>
      <style>{`
        .gchat-page {
          display: flex;
          flex-direction: column;
          height: 100svh;
          background: rgb(var(--bg-base));
          color: rgb(var(--text-primary));
          font-family: var(--font-sans);
        }
        .gchat-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: rgb(var(--bg-surface));
          border-bottom: 1px solid rgb(var(--border));
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: var(--shadow-sm);
        }
        .gchat-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          border: 1px solid rgb(var(--border));
          background: transparent;
          color: rgb(var(--text-secondary));
          cursor: pointer;
          text-decoration: none;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .gchat-back-btn:hover {
          border-color: rgb(var(--color-primary));
          color: rgb(var(--color-primary));
        }
        .gchat-title {
          flex: 1;
          font-size: 0.9375rem;
          font-weight: var(--font-semibold);
          color: rgb(var(--text-primary));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gchat-badge {
          font-size: 0.6875rem;
          font-weight: var(--font-semibold);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: rgb(var(--color-primary-muted));
          color: rgb(var(--color-primary));
          flex-shrink: 0;
        }
        .gchat-body {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        /* 모달 오버레이 */
        .gchat-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgb(0 0 0 / 0.55);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }
        .gchat-modal {
          background: rgb(var(--bg-surface));
          border-radius: var(--radius-2xl);
          padding: var(--space-8) var(--space-6);
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: var(--shadow-xl);
          border: 1px solid rgb(var(--border));
        }
        .gchat-modal-emoji {
          font-size: 2.5rem;
          margin-bottom: var(--space-4);
          display: block;
        }
        .gchat-modal-title {
          font-size: 1.25rem;
          font-weight: var(--font-bold);
          color: rgb(var(--text-primary));
          margin-bottom: var(--space-2);
          letter-spacing: -0.02em;
        }
        .gchat-modal-desc {
          font-size: 0.875rem;
          color: rgb(var(--text-secondary));
          line-height: 1.65;
          margin-bottom: var(--space-6);
        }
        .gchat-modal-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .gchat-btn-primary {
          display: block;
          padding: var(--space-3) var(--space-6);
          background: var(--gradient-primary);
          color: rgb(var(--text-on-primary));
          border: none;
          border-radius: var(--radius-lg);
          font-size: 0.9375rem;
          font-weight: var(--font-semibold);
          font-family: var(--font-sans);
          cursor: pointer;
          text-decoration: none;
          text-align: center;
          transition: opacity var(--transition-fast);
        }
        .gchat-btn-primary:hover { opacity: 0.9; }
        .gchat-btn-secondary {
          display: block;
          padding: var(--space-2_5) var(--space-6);
          background: transparent;
          color: rgb(var(--text-secondary));
          border: 1px solid rgb(var(--border));
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: var(--font-medium);
          font-family: var(--font-sans);
          cursor: pointer;
          text-decoration: none;
          text-align: center;
          transition: all var(--transition-fast);
        }
        .gchat-btn-secondary:hover {
          border-color: rgb(var(--border-strong));
          color: rgb(var(--text-primary));
        }
      `}</style>

      <div className="gchat-page">
        {/* 헤더 */}
        <header className="gchat-header">
          <Link href="/guest" className="gchat-back-btn" aria-label="카테고리로 돌아가기">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="gchat-title">{botName}</span>
          <span className="gchat-badge">무료 체험</span>
        </header>

        {/* 채팅 영역 */}
        <div className="gchat-body">
          <GuestChat
            botId={botId}
            onLimitReached={() => setShowModal(true)}
          />
        </div>
      </div>

      {/* 한도 초과 모달 */}
      {showModal && (
        <div className="gchat-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="gchat-modal" onClick={(e) => e.stopPropagation()}>
            <span className="gchat-modal-emoji">🎉</span>
            <h2 className="gchat-modal-title">무료 체험 완료!</h2>
            <p className="gchat-modal-desc">
              10회 무료 체험을 모두 사용하셨어요.<br />
              회원가입하면 <strong>나만의 AI 코코봇</strong>을 만들고<br />
              무제한으로 대화할 수 있어요.
            </p>
            <div className="gchat-modal-actions">
              <Link href="/signup" className="gchat-btn-primary">
                무료 회원가입하기
              </Link>
              <Link href="/login" className="gchat-btn-secondary">
                이미 계정이 있어요
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
