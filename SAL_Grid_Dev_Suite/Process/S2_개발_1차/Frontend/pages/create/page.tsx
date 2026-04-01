/**
 * @task S2FE1
 * @description Create 위저드 페이지 — 4단계 챗봇 생성 스텝퍼
 *
 * Step 1: 기본 정보 입력 (챗봇 이름, 설명)
 * Step 2: 음성/텍스트 입력 → AI 분석 (S2BA1 analyze + faq API)
 * Step 3: AI 분석 결과 확인 및 FAQ 검토/편집
 * Step 4: 배포 완료 — URL + QR 코드 표시
 *
 * 완료 시 /birth/{botId} 페이지로 이동
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  WizardProgressBar,
  Step1BasicInfo,
  Step2VoiceInput,
  Step3FaqReview,
  Step4DeployComplete,
  WizardState,
} from '@/components/create/wizard-steps';

// ── 초기 상태 ─────────────────────────────────────────────────────────────────

const INITIAL_STATE: WizardState = {
  name: '',
  description: '',
  voiceText: '',
  recordingData: null,
  analyzeResult: null,
  faqs: [],
  botId: null,
  deployUrl: null,
  qrSvg: null,
};

const TOTAL_STEPS = 4;

// ── 페이지 컴포넌트 ───────────────────────────────────────────────────────────

/**
 * CreatePage — 챗봇 생성 위저드 메인 페이지
 *
 * App Router 클라이언트 컴포넌트:
 * - 4단계 스텝 상태 관리
 * - Step 3→4 전환 시 /api/create-bot/deploy 호출
 * - 완료 시 /birth/{botId} 이동
 */
export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_STATE);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  /** 상태 부분 업데이트 */
  const handleUpdate = useCallback((patch: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...patch }));
  }, []);

  /** Step 3 완료 후 deploy 호출 → Step 4 이동 */
  const handleStep3Next = useCallback(async () => {
    setDeployError(null);
    setIsDeploying(true);

    try {
      // S2BA1 deploy API 호출
      const res = await fetch('/api/create-bot/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: wizardState.botId ?? `bot-${Date.now()}`,
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { botId: string; deployUrl: string; qrSvg: string; qrDataUrl: string };
        error?: string;
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? '배포에 실패했습니다.');
      }

      handleUpdate({
        botId: json.data?.botId ?? null,
        deployUrl: json.data?.deployUrl ?? null,
        qrSvg: json.data?.qrSvg ?? null,
      });

      setStep(4);
    } catch (err) {
      const e = err as { message?: string };
      setDeployError(e.message ?? '배포 중 오류가 발생했습니다.');
      // 에러가 있어도 Step 4로 이동 (graceful degradation)
      setStep(4);
    } finally {
      setIsDeploying(false);
    }
  }, [wizardState.botId, handleUpdate]);

  /** 완료 → birth 페이지 이동 */
  const handleFinish = useCallback(() => {
    const targetBotId = wizardState.botId ?? 'new';
    router.push(`/birth/${targetBotId}`);
  }, [router, wizardState.botId]);

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return (
    <main
      className={clsx(
        'min-h-screen flex items-start justify-center',
        'bg-bg-base px-4 py-8 sm:py-12',
      )}
    >
      <div
        className={clsx(
          'w-full max-w-lg',
          'flex flex-col gap-6',
        )}
      >
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            챗봇 만들기
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            5분 안에 나만의 AI 챗봇을 만들어 보세요
          </p>
        </div>

        {/* 진행 표시바 */}
        <WizardProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* 스텝 카드 */}
        <div
          className={clsx(
            'bg-surface rounded-2xl border border-border',
            'p-5 sm:p-6 shadow-sm',
          )}
        >
          {/* 스텝 제목 */}
          <StepTitle step={step} />

          {/* 각 스텝 컴포넌트 */}
          <div className="mt-5">
            {step === 1 && (
              <Step1BasicInfo
                state={wizardState}
                onUpdate={handleUpdate}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <Step2VoiceInput
                state={wizardState}
                onUpdate={handleUpdate}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <Step3FaqReview
                state={wizardState}
                onUpdate={handleUpdate}
                onNext={handleStep3Next}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <>
                {deployError && (
                  <div
                    className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm"
                    role="alert"
                  >
                    ⚠ {deployError}
                  </div>
                )}
                <Step4DeployComplete
                  state={wizardState}
                  onFinish={handleFinish}
                />
              </>
            )}
          </div>
        </div>

        {/* 하단 안내 */}
        {step < 4 && (
          <p className="text-center text-xs text-text-muted">
            언제든지 저장되며, 나중에 수정할 수 있습니다.
          </p>
        )}
      </div>
    </main>
  );
}

// ── 스텝 제목 서브컴포넌트 ────────────────────────────────────────────────────

/** 스텝별 제목·설명 메타 */
const STEP_META: Record<number, { title: string; description: string }> = {
  1: {
    title: '기본 정보 입력',
    description: '챗봇의 이름과 비즈니스 설명을 입력해 주세요.',
  },
  2: {
    title: '추가 정보 입력',
    description: '음성 또는 텍스트로 더 자세한 정보를 알려주세요. AI가 최적의 FAQ를 만들어 드립니다.',
  },
  3: {
    title: 'FAQ 검토 및 편집',
    description: 'AI가 생성한 FAQ를 확인하고 필요한 내용을 수정해 주세요.',
  },
  4: {
    title: '배포 완료',
    description: '챗봇이 성공적으로 배포되었습니다.',
  },
};

/**
 * StepTitle — 현재 스텝의 제목과 설명 표시
 */
function StepTitle({ step }: { step: number }) {
  const meta = STEP_META[step];
  if (!meta) return null;

  return (
    <div>
      <h2 className="text-base font-semibold text-text-primary">{meta.title}</h2>
      <p className="mt-0.5 text-xs text-text-secondary">{meta.description}</p>
    </div>
  );
}
