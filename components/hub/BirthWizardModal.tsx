/**
 * @task S12FE5
 * @description + 탭 → Birth 위저드 모달
 *
 * 정책:
 * - 모달 오픈 시 body 스크롤 락
 * - Step8 완료 → onCreated(botId) → hub 에서 refetch + setActive(newId)
 * - esc/배경클릭 시 진행 중이면 confirm
 * - CreateWizard 의 onComplete 콜백 재사용
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const CreateWizard = dynamic(() => import('@/components/create/CreateWizard'), { ssr: false });

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (botId: string) => void;
}

export default function BirthWizardModal({ open, onClose, onCreated }: Props) {
  const [started, setStarted] = useState(false);

  // 스크롤 락
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const confirmClose = useCallback(() => {
    if (started) {
      if (!window.confirm('위저드를 종료하면 입력한 내용이 사라집니다. 정말 나가시겠습니까?')) return;
    }
    setStarted(false);
    onClose();
  }, [started, onClose]);

  // esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') confirmClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, confirmClose]);

  if (!open) return null;

  const handleComplete = (botId: string) => {
    setStarted(false);
    onCreated(botId);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="새 페르소나 만들기"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) confirmClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-0 border border-border-default shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDownCapture={() => setStarted(true)}
        onInputCapture={() => setStarted(true)}
      >
        <button
          onClick={confirmClose}
          aria-label="닫기"
          className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full text-text-secondary hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
        >
          ✕
        </button>
        <div className="p-6">
          <CreateWizard onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
