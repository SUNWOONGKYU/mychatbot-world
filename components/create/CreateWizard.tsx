/**
 * CreateWizard — Vanilla 원본 8단계 코코봇 생성 위저드 충실 전환
 *
 * Step 1: 기본정보
 * Step 2: 대표 페르소나
 * Step 3: 인터뷰 (음성/텍스트)
 * Step 4: AI 분석 → 결과
 * Step 5: 목소리 선택 + 생성하기
 * Step 6: 아바타 설정
 * Step 7: 테마 선택
 * Step 8: 배포
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2Persona from './steps/Step2Persona';
import Step3Interview from './steps/Step3Interview';
import Step4Analysis from './steps/Step4Analysis';
import Step5Voice from './steps/Step5Voice';
import Step6Avatar from './steps/Step6Avatar';
import Step7Theme from './steps/Step7Theme';
import Step8Deploy from './steps/Step8Deploy';

// ── 타입 ──────────────────────────────────────────────────────────────────────

export type PersonaType = 'avatar' | 'helper';

export interface PersonaData {
  name: string;
  userTitle: string;
  role: string;
  iqEq: number;
  model: 'logic' | 'emotion' | 'fast' | 'creative';
  type?: PersonaType;
  presetId?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface WizardData {
  // Step 1
  botName: string;
  botDesc: string;
  botUsername: string;
  // Step 2
  persona: PersonaData;
  // Step 3
  interviewText: string;
  // Step 4 (AI 결과)
  greeting: string;
  faqs: FaqItem[];
  // Step 5
  voice: string;
  // Step 6
  avatarEmoji: string;
  avatarImageData: string | null;
  // Step 7
  themeMode: 'dark' | 'light';
  themeColor: string;
  // Step 8
  deployChannels: string[];
  botId: string | null;
  deployUrl: string | null;
  qrSvg: string | null;
}

const INITIAL_DATA: WizardData = {
  botName: '',
  botDesc: '',
  botUsername: '',
  persona: {
    name: '',
    userTitle: '고객님',
    role: '',
    iqEq: 50,
    model: 'logic',
    type: 'avatar',
    presetId: undefined,
  },
  interviewText: '',
  greeting: '',
  faqs: [],
  voice: 'fable',
  avatarEmoji: 'robot',
  avatarImageData: null,
  themeMode: 'dark',
  themeColor: 'purple',
  deployChannels: ['web'],
  botId: null,
  deployUrl: null,
  qrSvg: null,
};

const TOTAL_STEPS = 8;

const STEP_LABELS = ['기본정보', '페르소나', '인터뷰', '분석', '목소리', '아바타', '테마', '생성'];

interface Props {
  onComplete: (botId: string) => void;
}

// ── 진행률 바 ──────────────────────────────────────────────────────────────────

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <div
              key={stepNum}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.6rem',
                fontWeight: isActive ? 700 : 500,
                // 라이트 모드: text-muted는 neutral-500 = AA 간신히. 비활성 라벨을 text-secondary로 끌어올려 가독성 확보
                color: isActive
                  ? 'rgb(var(--text-primary-rgb))'
                  : isDone
                  ? 'rgb(var(--text-secondary-rgb))'
                  : 'rgb(var(--text-secondary-rgb))',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isActive
                    ? 'rgb(var(--color-primary))'
                    : isDone
                    ? 'rgb(var(--color-success))'
                    : 'var(--surface-1)',
                  // 비활성 원은 라이트에서 bg-muted(#E4E8ED) + 배경 흰색 → 보더 없으면 투명하게 보임. border 추가로 가시성 확보
                  border: isActive || isDone ? 'none' : '1.5px solid var(--border-strong)',
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  flexShrink: 0,
                  color: isActive || isDone ? '#ffffff' : 'var(--text-primary)',
                }}
              >
                {stepNum}
              </span>
              <span style={{ display: window?.innerWidth <= 480 ? 'none' : 'inline' }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ height: '4px', background: 'rgb(var(--bg-muted))', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            background: 'var(--gradient-primary)',
            borderRadius: '2px',
            width: `${pct}%`,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

// ── 메인 위저드 ────────────────────────────────────────────────────────────────

export default function CreateWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);

  // sessionStorage 초안 복원
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('mcw_create_draft_v2');
      if (!raw) return;
      const draft = JSON.parse(raw);
      // 1시간 경과 → 폐기 (이전: 24h. 너무 길어서 false-positive 복원 안내가 잦음)
      if (Date.now() - draft.savedAt > 60 * 60 * 1000) {
        sessionStorage.removeItem('mcw_create_draft_v2');
        return;
      }
      // 이미 봇이 생성됐거나(botId 존재) Step 8까지 진입한 draft → 폐기 (재생성 방지)
      if (draft.data?.botId || (draft.step ?? 0) >= 8) {
        sessionStorage.removeItem('mcw_create_draft_v2');
        return;
      }
      // 의미있는 진행이 있을 때만 복원 안내
      // - Step 4(분석) 이상 또는 인터뷰 응답 100자 이상 입력된 경우만 "이어서?" 묻기
      // - Step 1에서 "다음" 한 번 누른 정도로는 묻지 않음 (스팸성 프롬프트 방지)
      const interviewLen = (draft.data?.interviewText ?? '').length;
      const hasMeaningfulProgress = (draft.step ?? 0) >= 4 || interviewLen >= 100;
      if (!hasMeaningfulProgress) {
        sessionStorage.removeItem('mcw_create_draft_v2');
        return;
      }
      if (confirm('이전에 작성 중이던 코코봇이 있습니다. 이어서 작성하시겠습니까?')) {
        setData(draft.data || INITIAL_DATA);
        setStep(draft.step || 1);
      } else {
        sessionStorage.removeItem('mcw_create_draft_v2');
      }
    } catch { /* ignore */ }
  }, []);

  const saveDraft = useCallback((nextStep: number, nextData: WizardData) => {
    try {
      sessionStorage.setItem('mcw_create_draft_v2', JSON.stringify({
        step: nextStep,
        data: nextData,
        savedAt: Date.now(),
      }));
    } catch { /* ignore */ }
  }, []);

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem('mcw_create_draft_v2');
  }, []);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...patch }));
  }, []);

  const goTo = useCallback((nextStep: number, updatedData?: Partial<WizardData>) => {
    const merged = updatedData ? { ...data, ...updatedData } : data;
    setData(merged);
    setStep(nextStep);
    saveDraft(nextStep, merged);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [data, saveDraft]);

  const handleFinish = useCallback((finalData: Partial<WizardData>) => {
    const merged = { ...data, ...finalData };
    setData(merged);
    clearDraft();
    // 생성 직후 자동 리다이렉트 금지 — Step 8 성공 화면(축하 + QR + URL)을 사용자가 반드시 보도록 함
    // 사용자는 Step 8 내부의 "대화해보기" / "마이페이지" 버튼으로 수동 이동
  }, [data, clearDraft]);

  return (
    <div>
      <ProgressBar currentStep={step} />

      <div style={{ animation: 'fadeIn 0.5s ease' }}>
        {step === 1 && (
          <Step1BasicInfo
            data={data}
            onNext={(patch) => goTo(2, patch)}
          />
        )}
        {step === 2 && (
          <Step2Persona
            data={data}
            onNext={(patch) => goTo(3, patch)}
            onBack={() => goTo(1)}
          />
        )}
        {step === 3 && (
          <Step3Interview
            data={data}
            onNext={(patch) => goTo(4, patch)}
            onBack={() => goTo(2)}
          />
        )}
        {step === 4 && (
          <Step4Analysis
            data={data}
            onNext={(patch) => goTo(5, patch)}
          />
        )}
        {step === 5 && (
          <Step5Voice
            data={data}
            onNext={(patch) => goTo(6, patch)}
            onBack={() => goTo(4)}
          />
        )}
        {step === 6 && (
          <Step6Avatar
            data={data}
            onNext={(patch) => goTo(7, patch)}
            onBack={() => goTo(5)}
          />
        )}
        {step === 7 && (
          <Step7Theme
            data={data}
            onNext={(patch) => goTo(8, patch)}
            onBack={() => goTo(6)}
          />
        )}
        {step === 8 && (
          <Step8Deploy
            data={data}
            onFinish={handleFinish}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
