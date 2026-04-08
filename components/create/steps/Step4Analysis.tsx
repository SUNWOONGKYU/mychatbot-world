/**
 * Step 4: AI 분석 중 → 결과 확인
 * - 애니메이션 4단계 순차 표시
 * - /api/create-bot 호출하여 greeting + faqs 생성
 * - 인사말 TTS 미리듣기 (▶ 인사말 듣기 버튼)
 * - 분석 완료 후 "다음: 목소리 선택 →" 버튼
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import type { WizardData, FaqItem } from '../CreateWizard';
import { stepTitle, btnPrimary } from '../ui';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
}

const ANALYSIS_STEPS = [
  '🔍 입력 데이터 분석 중...',
  '🧠 페르소나별 성격/어조 추출 중...',
  '💬 인사말 생성 중...',
  '❓ FAQ 자동 생성 중...',
];

function generateGreeting(botName: string, personaName: string, iqEq: number): string {
  if (iqEq >= 75) return `안녕하세요. ${botName}의 ${personaName}입니다. 정확하고 전문적인 답변으로 도와드리겠습니다.`;
  if (iqEq >= 50) return `안녕하세요! ${botName}의 ${personaName}입니다. 무엇이든 편하게 물어보세요.`;
  if (iqEq >= 25) return `안녕하세요! ${botName}의 ${personaName}이에요. 함께 이야기해볼까요?`;
  return `반가워요! ${botName}의 ${personaName}이에요. 편하게 말씀해 주세요.`;
}

function generateDefaultFaqs(): FaqItem[] {
  return [
    { q: '소개해주세요', a: '' },
    { q: '서비스 안내', a: '' },
    { q: '연락처', a: '' },
  ];
}

export default function Step4Analysis({ data, onNext }: Props) {
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playStatus, setPlayStatus] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const runAnalysis = async () => {
      // 단계 애니메이션
      for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        setActiveStep(i);
        setDoneSteps(prev => [...prev, i - 1].filter(x => x >= 0));
      }

      // AI API 호출
      let aiGreeting = '';
      let aiFaqs: FaqItem[] = [];

      try {
        const res = await fetch('/api/create-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botName: data.botName,
            botDesc: data.botDesc,
            inputText: data.interviewText,
            persona: {
              name: data.persona.name,
              role: data.persona.role,
              iqEq: data.persona.iqEq,
            },
          }),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.greeting) aiGreeting = d.greeting;
          if (d.faqs?.length) aiFaqs = d.faqs;
        }
      } catch (e) {
        console.warn('[AI] server API failed:', e);
      }

      // 폴백
      if (!aiGreeting) {
        aiGreeting = generateGreeting(data.botName, data.persona.name, data.persona.iqEq);
      }
      if (!aiFaqs.length) {
        aiFaqs = generateDefaultFaqs();
      }

      setDoneSteps([0, 1, 2, 3]);
      setActiveStep(-1);
      await new Promise(r => setTimeout(r, 300));

      setGreeting(aiGreeting);
      setFaqs(aiFaqs);
      setIsAnalyzed(true);
    };

    runAnalysis();
  }, []);

  const handlePreviewGreeting = async () => {
    if (!greeting) { alert('미리 들을 인사말이 없습니다.'); return; }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setPlayStatus('');
      return;
    }

    setIsPlaying(true);
    setPlayStatus('로딩 중...');

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: greeting, voice: data.voice || 'fable' }),
      });
      if (!res.ok) throw new Error('TTS API 오류');
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('audio')) throw new Error('Not audio');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayStatus('재생 중...');
      audio.play();
      audio.onended = () => { URL.revokeObjectURL(url); setIsPlaying(false); setPlayStatus(''); };
      audio.onerror = () => { URL.revokeObjectURL(url); setIsPlaying(false); setPlayStatus(''); };
    } catch {
      // Web Speech API fallback
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(greeting);
        u.lang = 'ko-KR';
        setPlayStatus('(브라우저 TTS)');
        u.onend = () => { setIsPlaying(false); setPlayStatus(''); };
        window.speechSynthesis.speak(u);
      } else {
        setIsPlaying(false);
        setPlayStatus('');
        alert('TTS 재생에 실패했습니다.');
      }
    }
  };

  const handleNext = () => {
    onNext({ greeting, faqs });
  };

  return (
    <div>
      {!isAnalyzed ? (
        <>
          <h2 style={stepTitle}>AI가 분석 중입니다...</h2>
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            {/* 스피너 */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(99,102,241,0.2)',
                borderTopColor: '#6366f1',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }} />
            </div>

            {/* 단계 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
              {ANALYSIS_STEPS.map((label, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    color: doneSteps.includes(i)
                      ? '#22c55e'
                      : activeStep === i
                      ? 'white'
                      : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.5s ease',
                  }}
                >
                  {doneSteps.includes(i) ? '✓ ' : ''}{label}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 style={stepTitle}>분석 완료!</h2>

          {/* 결과 미리보기 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: 'white',
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                대표 페르소나
              </div>
              <div>{data.persona.name || '(없음)'}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                인사말
              </div>
              <div>&ldquo;{greeting}&rdquo;</div>
            </div>

            {faqs.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  예상 Q&A
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {faqs.slice(0, 5).map((f, i) => (
                    <li key={i} style={{ padding: '8px 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong>Q:</strong> {f.q}
                      {f.a && <><br /><strong>A:</strong> {f.a}</>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 인사말 TTS 미리듣기 */}
          <div style={{ marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePreviewGreeting}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {isPlaying ? '⏸ 정지' : '▶ 인사말 듣기'}
            </button>
            {playStatus && (
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{playStatus}</span>
            )}
          </div>

          <button
            onClick={handleNext}
            style={{ ...btnPrimary, width: '100%', marginTop: '1rem', padding: '14px', fontSize: '1rem' }}
          >
            다음: 목소리 선택 →
          </button>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
