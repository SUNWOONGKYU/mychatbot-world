/**
 * @task S2BI1 - 멀티 AI 라우팅 (OpenRouter) 고도화
 * @description AI 관련 TypeScript 타입 정의
 * - 감성슬라이더/비용슬라이더 기반 모델 선택 타입
 * - OpenRouter API 요청/응답 타입
 * - 스트리밍 청크 타입
 */

// ============================
// 슬라이더 타입
// ============================

/**
 * 감성 슬라이더 값 (1~100)
 * - 1~33: 간결·경제형
 * - 34~66: 균형형
 * - 67~100: 감성·고품질형
 */
export type EmotionSliderValue = number;

/**
 * 비용 슬라이더 티어
 * - economy: 월 $5 이하 예산
 * - standard: 월 $5~$20 예산
 * - premium: 월 $20 초과 예산
 */
export type CostTier = 'economy' | 'standard' | 'premium';

/**
 * 감성 슬라이더 구간 분류
 */
export type EmotionTier = 'concise' | 'balanced' | 'expressive';

// ============================
// AI 모델 타입
// ============================

/**
 * OpenRouter를 통해 지원하는 AI 모델 식별자
 */
export type AIModelId =
  | 'anthropic/claude-haiku-4-5'
  | 'anthropic/claude-3-5-haiku'
  | 'anthropic/claude-sonnet-4-5'
  | 'anthropic/claude-3-7-sonnet'
  | 'anthropic/claude-opus-4-5'
  | 'openai/gpt-3.5-turbo'
  | 'openai/gpt-4o-mini'
  | 'openai/gpt-4o';

/**
 * AI 모델 메타데이터
 */
export interface AIModel {
  /** OpenRouter 모델 ID */
  id: AIModelId;
  /** 표시 이름 */
  name: string;
  /** 공급사 */
  provider: 'anthropic' | 'openai';
  /** 감성 티어 */
  emotionTier: EmotionTier;
  /** 입력 토큰 당 비용 (USD per 1K tokens) */
  inputCostPer1K: number;
  /** 출력 토큰 당 비용 (USD per 1K tokens) */
  outputCostPer1K: number;
  /** 최대 컨텍스트 토큰 */
  maxTokens: number;
  /** 스트리밍 지원 여부 */
  supportsStreaming: boolean;
}

// ============================
// 라우터 입력/출력 타입
// ============================

/**
 * AI 라우터 선택 요청
 */
export interface AIRouterRequest {
  /** 감성 슬라이더 값 (1~100) */
  emotionSlider: EmotionSliderValue;
  /** 비용 슬라이더 티어 */
  costTier: CostTier;
  /** 선호 공급사 (선택적) */
  preferredProvider?: 'anthropic' | 'openai';
}

/**
 * AI 라우터 선택 결과
 */
export interface AIRouterResult {
  /** 선택된 모델 */
  selectedModel: AIModel;
  /** 선택 이유 */
  reason: string;
  /** 후보 모델 목록 */
  candidates: AIModel[];
  /** 감성 티어 분류 결과 */
  emotionTier: EmotionTier;
}

// ============================
// OpenRouter API 타입
// ============================

/**
 * OpenRouter 채팅 메시지
 */
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * OpenRouter 채팅 완성 요청
 */
export interface OpenRouterChatRequest {
  /** 모델 ID */
  model: AIModelId;
  /** 메시지 배열 */
  messages: OpenRouterMessage[];
  /** 스트리밍 여부 */
  stream?: boolean;
  /** 최대 생성 토큰 수 */
  max_tokens?: number;
  /** 샘플링 온도 (0~2) */
  temperature?: number;
  /** 상위 확률 샘플링 */
  top_p?: number;
}

/**
 * OpenRouter 채팅 완성 응답 (비스트리밍)
 */
export interface OpenRouterChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter 스트리밍 청크 델타
 */
export interface OpenRouterStreamDelta {
  role?: 'assistant';
  content?: string;
}

/**
 * OpenRouter 스트리밍 청크
 */
export interface OpenRouterStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: OpenRouterStreamDelta;
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
}

// ============================
// API Route 타입
// ============================

/**
 * /api/ai/chat POST 요청 바디
 */
export interface AIChatRequestBody {
  /** 메시지 배열 */
  messages: OpenRouterMessage[];
  /** 감성 슬라이더 (1~100, 기본값: 50) */
  emotionSlider?: EmotionSliderValue;
  /** 비용 티어 (기본값: 'standard') */
  costTier?: CostTier;
  /** 선호 공급사 */
  preferredProvider?: 'anthropic' | 'openai';
  /** 스트리밍 여부 (기본값: true) */
  stream?: boolean;
  /** 최대 생성 토큰 */
  maxTokens?: number;
  /** 온도 */
  temperature?: number;
}

/**
 * /api/ai/chat 비스트리밍 응답
 */
export interface AIChatResponse {
  /** 생성된 응답 텍스트 */
  content: string;
  /** 사용된 모델 ID */
  modelId: AIModelId;
  /** 모델 표시 이름 */
  modelName: string;
  /** 감성 티어 */
  emotionTier: EmotionTier;
  /** 토큰 사용량 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 스트리밍 이벤트 타입 (Server-Sent Events)
 */
export type StreamEventType = 'model_selected' | 'content' | 'done' | 'error';

/**
 * 스트리밍 이벤트 데이터
 */
export interface StreamEvent {
  type: StreamEventType;
  data: string;
}
