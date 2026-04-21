/**
 * Step 3: 인터뷰 — 음성/텍스트 입력 모드 전환
 * 음성: 녹음 서클 + 타이머 + 스크립트 표시
 * 텍스트: 2000자 카운터
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { WizardData } from '../CreateWizard';
import { stepTitle, stepDesc, StepActions } from '../ui';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

type InputMode = 'voice' | 'text';

export default function Step3Interview({ data, onBack, onNext }: Props) {
  const [mode, setMode] = useState<InputMode>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(data.interviewText || '');
  const [textContent, setTextContent] = useState(data.interviewText || '');
  const [remainingTime, setRemainingTime] = useState(180);
  const [voiceError, setVoiceError] = useState<string>('');

  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setVoiceError('');
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome/Edge 권장). 텍스트 입력을 이용해주세요.');
      setMode('text');
      return;
    }

    // 마이크 권한을 먼저 명시적으로 요청 — Permissions-Policy/권한 거부 시 즉시 사유 표시
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotAllowedError') {
        setVoiceError('마이크 권한이 거부되었습니다. 브라우저 주소창의 자물쇠 아이콘에서 마이크를 허용해주세요.');
      } else if (name === 'NotFoundError') {
        setVoiceError('연결된 마이크를 찾을 수 없습니다.');
      } else {
        setVoiceError('마이크에 접근할 수 없습니다: ' + (err?.message || name || '알 수 없는 오류'));
      }
      return;
    }

    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) setTranscript(prev => prev + final + ' ');
    };

    rec.onerror = (e: any) => {
      const errType = e?.error || 'unknown';
      const map: Record<string, string> = {
        'not-allowed': '마이크 권한이 차단되었습니다.',
        'no-speech': '음성이 감지되지 않았습니다. 다시 시도해주세요.',
        'audio-capture': '마이크에 접근할 수 없습니다.',
        'network': '네트워크 오류로 음성 인식이 중단되었습니다.',
        'aborted': '',
      };
      const msg = map[errType] ?? `음성 인식 오류: ${errType}`;
      if (msg) setVoiceError(msg);
      stopRecording();
    };

    rec.onend = () => {
      // 사용자가 정지하지 않은 경우에만 자동 재시작 (continuous 유지)
      if (isRecordingRef.current && recRef.current) {
        try { recRef.current.start(); } catch {}
      }
    };

    recRef.current = rec;
    isRecordingRef.current = true;
    try {
      rec.start();
    } catch (err: any) {
      setVoiceError('녹음을 시작할 수 없습니다: ' + (err?.message || '알 수 없는 오류'));
      isRecordingRef.current = false;
      return;
    }
    setIsRecording(true);
    setRemainingTime(180);

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) { stopRecording(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (recRef.current) { try { recRef.current.stop(); } catch {} }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnalyze = () => {
    const inputText = mode === 'voice' ? transcript.trim() : textContent.trim();
    if (!inputText || inputText.length < 10) {
      alert('음성 또는 텍스트로 최소 10자 이상 입력해주세요.');
      return;
    }
    if (isRecording) stopRecording();
    onNext({ interviewText: inputText });
  };

  const min = Math.floor(remainingTime / 60);
  const sec = String(remainingTime % 60).padStart(2, '0');

  return (
    <div>
      <h2 style={stepTitle}>AI에게 당신을 소개해주세요</h2>
      <p style={stepDesc}>3분간 자유롭게 말하거나 텍스트로 입력해주세요</p>

      {/* 입력 모드 탭 */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem' }}>
        {(['voice', 'text'] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); if (isRecording) stopRecording(); }}
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
              border: `1px solid ${mode === m ? '#6366f1' : 'var(--border-default)'}`,
              background: mode === m ? '#6366f1' : 'var(--surface-1)',
              color: mode === m ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {m === 'voice' ? '🎤 음성 입력' : '⌨️ 텍스트 입력'}
          </button>
        ))}
      </div>

      {/* 음성 입력 영역 */}
      {mode === 'voice' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          {/* 마이크 서클 */}
          <div
            onClick={toggleRecording}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: isRecording
                ? 'linear-gradient(135deg, #ef4444, #f97316)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              cursor: 'pointer',
              boxShadow: isRecording
                ? '0 0 60px rgba(239,68,68,0.5)'
                : '0 0 20px rgba(99,102,241,0.3)',
              animation: isRecording ? 'pulse-record 1.5s ease-in-out infinite' : 'none',
              transition: 'all 0.3s',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>{isRecording ? '⏹' : '🎤'}</span>
          </div>

          {/* 타이머 */}
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {min}:{sec}
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            {isRecording
              ? '녹음 중... 탭하여 정지'
              : transcript
              ? '녹음 완료! 아래에서 AI 분석을 시작하세요.'
              : '마이크를 탭하여 녹음을 시작하세요'}
          </p>

          {voiceError && (
            <div role="alert" style={{
              maxWidth: '480px',
              margin: '0 auto 1.25rem',
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              textAlign: 'left',
            }}>
              {voiceError}
            </div>
          )}

          {/* 가이드 */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'left',
          }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>이런 내용을 말해주세요:</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['자기소개와 업무 소개', '고객이 자주 묻는 질문과 답변', '전문 분야와 강점', '원하는 대화 스타일'].map(item => (
                <li key={item} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 녹음 전사 */}
          {transcript && (
            <div style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginTop: '1rem',
              textAlign: 'left',
            }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>녹음 내용:</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* 텍스트 입력 영역 */}
      {mode === 'text' && (
        <div style={{ padding: '1rem 0' }}>
          <textarea
            style={{
              width: '100%',
              minHeight: '200px',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: '14px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            value={textContent}
            onChange={e => setTextContent(e.target.value.slice(0, 2000))}
            placeholder="자기소개, 주요 업무, 자주 받는 질문과 답변을 자유롭게 작성해주세요..."
            rows={10}
          />
          <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {textContent.length}/2000
          </p>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        style={{
          width: '100%',
          marginTop: '1.5rem',
          padding: '14px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        AI 분석 시작 →
      </button>

      <style>{`
        @keyframes pulse-record {
          0%, 100% { box-shadow: 0 0 30px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 60px rgba(239,68,68,0.6); }
        }
      `}</style>
    </div>
  );
}
