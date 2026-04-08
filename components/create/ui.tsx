/**
 * Create 위저드 공통 UI 유틸리티
 */
'use client';

import { useState, useCallback, useRef } from 'react';

// ── 공통 인라인 스타일 ─────────────────────────────────────────────────────────

export const stepTitle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'white',
  marginBottom: '0.75rem',
  textAlign: 'center',
};

export const stepDesc: React.CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  textAlign: 'center',
  marginBottom: '2rem',
  fontSize: '0.9rem',
  lineHeight: 1.6,
};

export const formCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '2rem',
};

export const formGroup: React.CSSProperties = {
  marginBottom: '1.25rem',
};

export const formLabel: React.CSSProperties = {
  display: 'block',
  color: 'white',
  fontWeight: 600,
  marginBottom: '0.5rem',
  fontSize: '0.9rem',
};

export const formInput: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding: '12px 14px',
  color: 'white',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const btnPrimary: React.CSSProperties = {
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  borderRadius: '10px',
  color: 'white',
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
};

export const btnSecondary: React.CSSProperties = {
  padding: '12px 24px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '10px',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};

export const stepActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  marginTop: '1.5rem',
};

// ── 마이크 버튼 ───────────────────────────────────────────────────────────────

interface MicButtonProps {
  onResult: (text: string) => void;
  convertToUrl?: boolean;
}

export function MicButton({ onResult }: MicButtonProps) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop();
      recRef.current = null;
      setRecording(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('이 브라우저는 음성 입력을 지원하지 않습니다. Chrome을 사용해주세요.');
      return;
    }

    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text) onResult(text);
    };

    rec.onend = () => { setRecording(false); recRef.current = null; };
    rec.onerror = () => { setRecording(false); recRef.current = null; };

    recRef.current = rec;
    rec.start();
    setRecording(true);
  }, [onResult]);

  return (
    <button
      type="button"
      onClick={toggle}
      title="음성 입력"
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        border: `1px solid ${recording ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
        background: recording ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)',
        cursor: 'pointer',
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        animation: recording ? 'mic-pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      {recording ? '🔴' : '🎤'}
    </button>
  );
}

// ── 이전/다음 버튼 행 ──────────────────────────────────────────────────────────

export function StepActions({
  onBack,
  onNext,
  nextLabel = '다음 →',
  nextDisabled = false,
  nextStyle,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextStyle?: React.CSSProperties;
}) {
  return (
    <div style={stepActions}>
      {onBack ? (
        <button onClick={onBack} style={btnSecondary}>← 이전</button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          style={{ ...btnPrimary, ...nextStyle, opacity: nextDisabled ? 0.5 : 1 }}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
