/**
 * @task S2BI1 - 멀티 AI 라우팅 (OpenRouter) 고도화
 * @description 감성슬라이더 + 비용슬라이더 기반 AI 모델 자동 선택 라우터
 *
 * 라우팅 로직:
 * - emotionSlider 1~33  → 간결·경제형 (haiku, gpt-3.5-turbo)
 * - emotionSlider 34~66 → 균형형       (sonnet, gpt-4o-mini)
 * - emotionSlider 67~100 → 감성·고품질형 (opus, gpt-4o)
 * - costTier: 후보군 내 비용 필터 적용
 */

import type {
  AIModel,
  AIModelId,
  AIRouterRequest,
  AIRouterResult,
  CostTier,
  EmotionTier,
} from '@/types/ai';

// ============================
// 모델 카탈로그
// ============================

/**
 * 지원 모델 카탈로그 (OpenRouter 경유)
 * inputCostPer1K / outputCostPer1K 단위: USD per 1,000 tokens
 */
const MODEL_CATALOG: AIModel[] = [
  // === 간결·경제형 (concise) ===
  {
    id: 'anthropic/claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    emotionTier: 'concise',
    inputCostPer1K: 0.0008,
    outputCostPer1K: 0.004,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    emotionTier: 'concise',
    inputCostPer1K: 0.0008,
    outputCostPer1K: 0.004,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    emotionTier: 'concise',
    inputCostPer1K: 0.0005,
    outputCostPer1K: 0.0015,
    maxTokens: 16385,
    supportsStreaming: true,
  },
  // === 균형형 (balanced) ===
  {
    id: 'anthropic/claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    emotionTier: 'balanced',
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'anthropic/claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    emotionTier: 'balanced',
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    emotionTier: 'balanced',
    inputCostPer1K: 0.00015,
    outputCostPer1K: 0.0006,
    maxTokens: 128000,
    supportsStreaming: true,
  },
  // === 감성·고품질형 (expressive) ===
  {
    id: 'anthropic/claude-opus-4-5',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    emotionTier: 'expressive',
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    emotionTier: 'expressive',
    inputCostPer1K: 0.005,
    outputCostPer1K: 0.015,
    maxTokens: 128000,
    supportsStreaming: true,
  },
];

// ============================
// 비용 티어 기준 (outputCostPer1K 기준)
// ============================

/**
 * 비용 티어별 최대 허용 출력 비용 (USD per 1K output tokens)
 * economy  : 가장 저렴한 모델만 허용
 * standard : 중간 비용까지 허용
 * premium  : 제한 없음
 */
const COST_TIER_LIMITS: Record<CostTier, number> = {
  economy: 0.005,   // $0.005/1K out tokens 이하
  standard: 0.02,   // $0.02/1K out tokens 이하
  premium: Infinity, // 제한 없음
};

// ============================
// 헬퍼 함수
// ============================

/**
 * 감성슬라이더 값을 EmotionTier로 변환
 * @param emotionSlider - 1~100 감성 슬라이더 값
 * @returns EmotionTier 분류
 */
export function resolveEmotionTier(emotionSlider: number): EmotionTier {
  if (emotionSlider < 1 || emotionSlider > 100) {
    throw new RangeError(
      `emotionSlider must be between 1 and 100, got: ${emotionSlider}`
    );
  }

  if (emotionSlider <= 33) return 'concise';
  if (emotionSlider <= 66) return 'balanced';
  return 'expressive';
}

/**
 * 비용 티어와 공급사 선호도를 적용하여 후보 모델 필터링
 * @param candidates - 후보 모델 배열
 * @param costTier - 비용 티어
 * @param preferredProvider - 선호 공급사 (optional)
 * @returns 필터링된 모델 배열 (비용 오름차순 정렬)
 */
function filterByCost(
  candidates: AIModel[],
  costTier: CostTier,
  preferredProvider?: 'anthropic' | 'openai'
): AIModel[] {
  const maxCost = COST_TIER_LIMITS[costTier];

  // 비용 필터 적용
  let filtered = candidates.filter(
    (model) => model.outputCostPer1K <= maxCost
  );

  // 비용 필터 후 후보가 없으면 가장 저렴한 1개 폴백
  if (filtered.length === 0) {
    const sorted = [...candidates].sort(
      (a, b) => a.outputCostPer1K - b.outputCostPer1K
    );
    filtered = sorted.slice(0, 1);
  }

  // 공급사 선호도 적용 (해당 공급사가 있을 때만)
  if (preferredProvider) {
    const providerFiltered = filtered.filter(
      (m) => m.provider === preferredProvider
    );
    if (providerFiltered.length > 0) {
      filtered = providerFiltered;
    }
  }

  // 비용 오름차순 정렬 (저렴한 것 우선)
  return filtered.sort((a, b) => a.outputCostPer1K - b.outputCostPer1K);
}

/**
 * 선택 이유 메시지 생성
 */
function buildReason(
  emotionTier: EmotionTier,
  costTier: CostTier,
  model: AIModel
): string {
  const tierLabels: Record<EmotionTier, string> = {
    concise: '간결·경제형 (슬라이더 1~33)',
    balanced: '균형형 (슬라이더 34~66)',
    expressive: '감성·고품질형 (슬라이더 67~100)',
  };

  return (
    `감성 티어: ${tierLabels[emotionTier]}, ` +
    `비용 티어: ${costTier} → ` +
    `${model.name} 선택 ` +
    `(출력 $${model.outputCostPer1K}/1K tokens)`
  );
}

// ============================
// 핵심 라우터 함수
// ============================

/**
 * 감성슬라이더 + 비용슬라이더 기반으로 최적 AI 모델 선택
 *
 * @param request - AIRouterRequest (emotionSlider, costTier, preferredProvider)
 * @returns AIRouterResult (selectedModel, reason, candidates, emotionTier)
 *
 * @example
 * ```ts
 * const result = selectModel({
 *   emotionSlider: 75,  // expressive tier
 *   costTier: 'standard',
 *   preferredProvider: 'anthropic',
 * });
 * // → Claude Sonnet (비용 필터 통과한 anthropic 모델 중 최저가)
 * ```
 */
export function selectModel(request: AIRouterRequest): AIRouterResult {
  const { emotionSlider, costTier, preferredProvider } = request;

  // 1. 감성 티어 결정
  const emotionTier = resolveEmotionTier(emotionSlider);

  // 2. 해당 티어 후보군 추출
  const tierCandidates = MODEL_CATALOG.filter(
    (m) => m.emotionTier === emotionTier
  );

  // 3. 비용 필터 + 공급사 선호 적용
  const filteredCandidates = filterByCost(
    tierCandidates,
    costTier,
    preferredProvider
  );

  // 4. 최우선 모델 선택 (비용 오름차순 첫 번째)
  const selectedModel = filteredCandidates[0];

  return {
    selectedModel,
    reason: buildReason(emotionTier, costTier, selectedModel),
    candidates: filteredCandidates,
    emotionTier,
  };
}

/**
 * 모델 ID로 카탈로그에서 모델 조회
 * @param modelId - AIModelId
 * @returns AIModel | undefined
 */
export function getModelById(modelId: AIModelId): AIModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}

/**
 * 감성 티어별 모델 목록 조회
 * @param tier - EmotionTier
 * @returns AIModel[]
 */
export function getModelsByTier(tier: EmotionTier): AIModel[] {
  return MODEL_CATALOG.filter((m) => m.emotionTier === tier);
}

/**
 * 전체 모델 카탈로그 반환 (읽기 전용)
 */
export function getAllModels(): Readonly<AIModel[]> {
  return MODEL_CATALOG;
}
