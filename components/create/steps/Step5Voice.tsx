/**
 * Step 5: 목소리 선택 (생성은 Step 8에서)
 * - 6가지 목소리 카드 (fable, nova, shimmer, alloy, echo, onyx)
 * - 미리듣기 버튼 → /api/tts 호출
 * - 다음: 아바타 →
 */
'use client';

import { useState, useRef } from 'react';
import type { WizardData } from '../CreateWizard';
import { stepTitle, stepDesc, StepActions } from '../ui';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

const VOICE_OPTIONS = [
  { value: 'fable', name: 'Fable', desc: '남성 · 부드러운' },
  { value: 'nova', name: 'Nova', desc: '여성 · 밝고 친근한' },
  { value: 'shimmer', name: 'Shimmer', desc: '여성 · 따뜻한' },
  { value: 'alloy', name: 'Alloy', desc: '중성 · 균형잡힌' },
  { value: 'echo', name: 'Echo', desc: '남성 · 차분한' },
  { value: 'onyx', name: 'Onyx', desc: '남성 · 깊고 낮은' },
];

export default function Step5Voice({ data, onNext, onBack }: Props) {
  const [selectedVoice, setSelectedVoice] = useState(data.voice || 'fable');
  const [previewLabel, setPreviewLabel] = useState('미리듣기');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = async () => {
    setPreviewLabel('재생 중...');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '안녕하세요, 반갑습니다! 무엇이든 물어보세요.', voice: selectedVoice }),
      });
      if (!res.ok) throw new Error('TTS ' + res.status);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('audio')) throw new Error('Not audio');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => { URL.revokeObjectURL(url); setPreviewLabel('미리듣기'); };
    } catch {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance('안녕하세요, 반갑습니다!');
        u.lang = 'ko-KR';
        window.speechSynthesis.speak(u);
      }
      setPreviewLabel('미리듣기');
    }
  };

  const handleNext = () => {
    onNext({ voice: selectedVoice });
  };

  return (
    <div>
      <h2 style={stepTitle}>목소리를 선택하세요</h2>
      <p style={stepDesc}>코코봇이 사용할 목소리를 골라보세요</p>

      {/* 목소리 선택 카드 영역 */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        background: 'var(--surface-1)',
        border: '1px solid var(--border-default)',
        borderRadius: '16px',
        textAlign: 'center',
      }}>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '1rem' }}>코코봇 목소리를 선택하세요</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '1rem',
        }}>
          {VOICE_OPTIONS.map(v => (
            <label
              key={v.value}
              onClick={() => setSelectedVoice(v.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '12px',
                background: selectedVoice === v.value ? 'rgba(99,102,241,0.15)' : 'var(--surface-2)',
                border: `2px solid ${selectedVoice === v.value ? '#6366f1' : 'var(--border-default)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input type="radio" name="botVoice" value={v.value} checked={selectedVoice === v.value} onChange={() => setSelectedVoice(v.value)} style={{ display: 'none' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{v.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{v.desc}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handlePreview}
          style={{
            padding: '8px 20px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          {previewLabel}
        </button>
      </div>

      {/* 이전/다음 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '2rem' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← 이전
        </button>
        <button
          onClick={handleNext}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          다음: 아바타 →
        </button>
      </div>
    </div>
  );
}
