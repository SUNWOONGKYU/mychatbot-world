/**
 * @task S9FE4
 * @description 온보딩 허브 페이지 — 가입 직후 진입
 *
 * 목표: 가입 → 첫 대화 ≤ 2분 (총 예상 130초)
 */

import Link from 'next/link';
import { ONBOARDING_STEPS, totalEstimatedSeconds } from '@/lib/onboarding-steps';

export const metadata = {
  title: '시작하기 · CoCoBot',
  description: '2분이면 충분합니다. 지금 바로 첫 AI 봇과 대화를 시작하세요.',
};

export default function OnboardingHubPage() {
  const totalSec = totalEstimatedSeconds();
  const totalMin = Math.ceil(totalSec / 60);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-10 text-center">
        <p className="mb-2 text-sm text-text-secondary">온보딩 · 예상 {totalMin}분</p>
        <h1 className="text-3xl font-bold text-text-primary">4단계로 시작하기</h1>
        <p className="mt-3 text-text-secondary">
          각 단계는 건너뛸 수 있습니다. 첫 대화가 가장 중요해요.
        </p>
      </header>

      <ol className="space-y-4">
        {ONBOARDING_STEPS.map((step) => (
          <li
            key={step.id}
            className="rounded-lg border border-border-default p-5 transition hover:border-border-strong"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-text-secondary">
                    {step.order}
                  </span>
                  <h2 className="text-lg font-semibold text-text-primary">{step.title}</h2>
                </div>
                <p className="ml-8 mt-1 text-sm text-text-secondary">{step.hint}</p>
                <p className="ml-8 mt-1 text-xs text-text-tertiary">
                  예상 {step.estimatedSeconds}초 · {step.skippable ? '건너뛰기 가능' : '필수'}
                </p>
              </div>
              <Link
                href={step.nextPath}
                className="shrink-0 inline-flex items-center justify-center min-h-[44px] rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--interactive-primary)' }}
              >
                {step.cta}
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <footer className="mt-8 text-center text-sm text-text-secondary">
        <Link href="/my" className="inline-flex items-center justify-center min-h-[44px] underline">
          건너뛰고 대시보드로
        </Link>
      </footer>
    </main>
  );
}
