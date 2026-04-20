/**
 * @task S9FE4
 * @description 온보딩 스텝 정의 — 가입 → 첫 대화 ≤ 2분
 *
 * 설계 원칙:
 *   - 기본값을 풍부히 채워 "다음" 한 번으로 진행 가능
 *   - 스킵 가능 (강제 X)
 *   - 각 스텝마다 소요 시간 표시로 심리적 부담 완화
 *   - 진행률 표시 (1/4, 2/4 ...)
 */

export interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  hint: string;
  estimatedSeconds: number;
  cta: string;
  skippable: boolean;
  nextPath: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    order: 1,
    title: '환영합니다 — 30초면 첫 대화를 시작할 수 있어요',
    hint: '아래 샘플 봇을 바로 사용하거나, 나만의 봇을 만들 수 있습니다.',
    estimatedSeconds: 10,
    cta: '시작하기',
    skippable: false,
    nextPath: '/onboarding/sample-bot',
  },
  {
    id: 'sample-bot',
    order: 2,
    title: '샘플 봇 시험 대화',
    hint: '준비된 "상담봇"과 1분간 대화해보세요. 분위기를 익히는 게 목표.',
    estimatedSeconds: 60,
    cta: '대화 시작',
    skippable: true,
    nextPath: '/onboarding/create-bot',
  },
  {
    id: 'create-bot',
    order: 3,
    title: '나만의 봇 만들기 (기본값 사용 가능)',
    hint: '이름·인사말·성격만 정하면 완성. 나머지는 기본값이 자동 채워져요.',
    estimatedSeconds: 40,
    cta: '내 봇 만들기',
    skippable: true,
    nextPath: '/onboarding/first-chat',
  },
  {
    id: 'first-chat',
    order: 4,
    title: '내 봇과 첫 대화',
    hint: '추천 질문을 클릭하면 바로 시작. 무료 크레딧 500원 지급됨.',
    estimatedSeconds: 20,
    cta: '대화 시작',
    skippable: false,
    nextPath: '/my',
  },
];

export const BOT_CREATION_DEFAULTS = {
  name: '내 첫 번째 봇',
  greeting: '안녕하세요! 무엇을 도와드릴까요?',
  persona: '친절하고 간결하게 답하는 조력자',
  language: 'ko',
  model: 'auto',
  maxTokens: 1024,
};

export const SUGGESTED_FIRST_PROMPTS = [
  '자기소개 해줘',
  '오늘 날씨에 어울리는 인사 한 마디',
  '3문장 요약 방법 알려줘',
  '이모지 추천해줘 🎉',
];

export function totalEstimatedSeconds(): number {
  return ONBOARDING_STEPS.reduce((sum, s) => sum + s.estimatedSeconds, 0);
}

export function progressFraction(currentStepId: string): number {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.id === currentStepId);
  if (idx < 0) return 0;
  return (idx + 1) / ONBOARDING_STEPS.length;
}
