/**
 * Create 위저드 공통 UI 유틸리티
 */
'use client';

import { useState, useCallback, useRef } from 'react';

// ── 공통 인라인 스타일 ─────────────────────────────────────────────────────────

export const stepTitle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: '0.75rem',
  textAlign: 'center',
};

export const stepDesc: React.CSSProperties = {
  color: 'var(--text-secondary)',
  textAlign: 'center',
  marginBottom: '2rem',
  fontSize: '0.9rem',
  lineHeight: 1.6,
};

export const formCard: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border-default)',
  borderRadius: '16px',
  padding: '2rem',
};

export const formGroup: React.CSSProperties = {
  marginBottom: '1.25rem',
};

export const formLabel: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-primary)',
  fontWeight: 600,
  marginBottom: '0.5rem',
  fontSize: '0.9rem',
};

export const formInput: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-1)',        // was surface-0: 라이트에서 #F3F5F8 거의 백색 → surface-1(#E4E8ED)으로 대비 확보
  border: '1.5px solid var(--border-strong)', // was border-default: 라이트에서 #CCD2D8 희미 → border-strong(#B1B8BF) + 1.5px
  borderRadius: '10px',
  padding: '12px 14px',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const btnPrimary: React.CSSProperties = {
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
};

export const btnSecondary: React.CSSProperties = {
  padding: '12px 24px',
  background: 'var(--surface-1)',               // was surface-2(#FFFFFF): 흰 배경과 동일 → 안 보임
  border: '1.5px solid var(--border-strong)',   // was border-default: 강화
  borderRadius: '10px',
  color: 'var(--text-primary)',
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
  // rec.onresult가 start 시점에 고정되는 것을 막기 위해 ref로 최신 콜백을 항상 참조
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const toggle = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
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
      if (text) onResultRef.current(text);
    };

    rec.onend = () => { setRecording(false); recRef.current = null; };
    rec.onerror = () => { setRecording(false); recRef.current = null; };

    recRef.current = rec;
    rec.start();
    setRecording(true);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      title="음성 입력"
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        border: `1.5px solid ${recording ? '#ef4444' : 'var(--border-strong)'}`,   // 라이트 모드 대비 확보
        background: recording ? 'rgba(239,68,68,0.3)' : 'var(--surface-1)',          // was surface-2(흰색): 안 보임
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
