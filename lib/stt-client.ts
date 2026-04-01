/**
 * @task S2EX1
 * @description STT 클라이언트 — OpenAI Whisper API + 브라우저 Web Speech API 타입 정의
 *
 * 지원 엔진:
 *   - OpenAI Whisper (whisper-1): 서버 사이드
 *   - 브라우저 Web Speech API: 클라이언트 사이드 (타입 정의만 제공)
 *
 * 기능:
 *   - 다국어 지원 (ISO 639-1 언어 코드)
 *   - 신뢰도 점수 반환
 */

// ============================
// 타입 정의
// ============================

/**
 * STT 요청 옵션
 */
export interface STTOptions {
  /**
   * 언어 코드 (ISO 639-1: ko, en, ja 등)
   * 지정 시 인식 정확도 향상. 미지정 시 자동 감지
   */
  language?: string;
  /**
   * Whisper 응답 형식
   * @default 'verbose_json' — 신뢰도/단어별 타임스탬프 포함
   */
  responseFormat?: 'json' | 'verbose_json' | 'text';
  /**
   * Whisper 온도 (0.0 ~ 1.0) — 높을수록 다양한 결과
   * @default 0
   */
  temperature?: number;
}

/**
 * STT 변환 결과
 */
export interface TranscriptionResult {
  /** 변환된 텍스트 */
  text: string;
  /**
   * 신뢰도 점수 (0.0 ~ 1.0)
   * verbose_json 모드에서 세그먼트 평균값 사용
   * text 모드에서는 -1 (측정 불가)
   */
  confidence: number;
  /**
   * 감지된 언어 코드 (ISO 639-1)
   * verbose_json 모드에서 Whisper가 반환하는 값
   */
  language: string;
}

/**
 * OpenAI Whisper verbose_json 세그먼트
 * @internal
 */
interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
  no_speech_prob?: number;
}

/**
 * OpenAI Whisper verbose_json 응답
 * @internal
 */
interface WhisperVerboseResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments?: WhisperSegment[];
}

/**
 * OpenAI Whisper json 응답
 * @internal
 */
interface WhisperJsonResponse {
  text: string;
}

// ============================
// 브라우저 Web Speech API 타입 정의
// ============================

/**
 * 브라우저 Web Speech API SpeechRecognition 옵션
 *
 * 실제 구현은 클라이언트 컴포넌트에서 `window.SpeechRecognition`을 사용.
 * 이 인터페이스는 TypeScript 타입 지원을 위한 정의입니다.
 *
 * @example
 * ```ts
 * // 클라이언트 컴포넌트에서 사용
 * const recognition: WebSpeechRecognitionOptions = {
 *   lang: 'ko-KR',
 *   continuous: false,
 *   interimResults: false,
 * };
 * ```
 */
export interface WebSpeechRecognitionOptions {
  /** BCP-47 언어 태그 (예: 'ko-KR', 'en-US') */
  lang: string;
  /** 연속 인식 여부 */
  continuous?: boolean;
  /** 중간 결과 포함 여부 */
  interimResults?: boolean;
  /** 반환할 최대 대안 수 */
  maxAlternatives?: number;
}

/**
 * 브라우저 Web Speech API 결과 (클라이언트 사이드)
 */
export interface WebSpeechResult {
  /** 인식된 텍스트 */
  transcript: string;
  /** 신뢰도 점수 (0.0 ~ 1.0) */
  confidence: number;
}

// ============================
// 상수
// ============================

/** OpenAI Whisper API 엔드포인트 */
const OPENAI_WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

/** 지원 오디오 MIME 타입 → Whisper 파일 확장자 매핑 */
const MIME_TO_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/ogg': 'ogg',
  'audio/opus': 'webm',
};

// ============================
// 내부 헬퍼
// ============================

/**
 * OPENAI_API_KEY 환경변수 읽기
 * @throws Error - 키가 없을 때
 */
function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. Add it to .env.local'
    );
  }
  return key;
}

/**
 * verbose_json 세그먼트에서 평균 신뢰도 계산
 * avg_logprob를 확률로 변환: exp(avg_logprob)
 * 세그먼트가 없으면 1.0 반환
 *
 * @param segments - Whisper 세그먼트 배열
 * @returns 신뢰도 점수 (0.0 ~ 1.0)
 */
function computeConfidence(segments?: WhisperSegment[]): number {
  if (!segments || segments.length === 0) {
    return 1.0;
  }

  const validSegments = segments.filter(
    (s) => typeof s.avg_logprob === 'number' && !isNaN(s.avg_logprob)
  );

  if (validSegments.length === 0) {
    return 1.0;
  }

  const avgLogprob =
    validSegments.reduce((sum, s) => sum + (s.avg_logprob ?? 0), 0) /
    validSegments.length;

  // log-probability → probability: e^avgLogprob, 범위 [0, 1]로 클램프
  const prob = Math.exp(avgLogprob);
  return Math.min(1.0, Math.max(0.0, prob));
}

// ============================
// 공개 API
// ============================

/**
 * 오디오 버퍼를 텍스트로 변환 (STT)
 *
 * OpenAI Whisper API를 사용하여 오디오를 텍스트로 변환합니다.
 * 브라우저 Web Speech API 사용 시에는 이 함수를 호출하지 않고
 * 클라이언트 사이드에서 직접 처리해야 합니다.
 *
 * @param audioBuffer - 오디오 데이터 Buffer
 * @param mimeType - 오디오 MIME 타입 ('audio/webm', 'audio/wav', 'audio/mpeg', 'audio/ogg')
 * @param options - STT 옵션 (language, responseFormat, temperature)
 * @returns TranscriptionResult — { text, confidence, language }
 *
 * @throws Error - API 키 미설정 / 지원하지 않는 형식 / API 오류
 *
 * @example
 * ```ts
 * const result = await transcribe(audioBuffer, 'audio/webm', { language: 'ko' });
 * console.log(result.text);       // "안녕하세요"
 * console.log(result.confidence); // 0.95
 * console.log(result.language);   // "ko"
 * ```
 */
export async function transcribe(
  audioBuffer: Buffer,
  mimeType: string,
  options: STTOptions = {}
): Promise<TranscriptionResult> {
  const apiKey = getOpenAIApiKey();

  // MIME 타입 → 파일 확장자
  const ext = MIME_TO_EXT[mimeType.toLowerCase()];
  if (!ext) {
    throw new Error(
      `Unsupported audio MIME type: ${mimeType}. ` +
        `Supported: ${Object.keys(MIME_TO_EXT).join(', ')}`
    );
  }

  const responseFormat = options.responseFormat ?? 'verbose_json';

  // multipart/form-data 빌드 (Node.js 환경 — FormData API 사용)
  const formData = new FormData();

  // Buffer → Blob (Node.js 18+ / Edge Runtime 호환)
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('response_format', responseFormat);

  if (options.language) {
    formData.append('language', options.language);
  }

  if (options.temperature !== undefined) {
    formData.append('temperature', String(options.temperature));
  }

  const response = await fetch(OPENAI_WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // Content-Type은 FormData 자동 설정 (boundary 포함)
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg: string;
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      errorMsg = errBody.error?.message ?? `HTTP ${response.status}`;
    } catch {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(`OpenAI Whisper API error: ${errorMsg}`);
  }

  // 응답 파싱
  if (responseFormat === 'text') {
    const text = await response.text();
    return {
      text: text.trim(),
      confidence: -1, // text 모드에서는 신뢰도 측정 불가
      language: options.language ?? 'unknown',
    };
  }

  if (responseFormat === 'verbose_json') {
    const data = (await response.json()) as WhisperVerboseResponse;
    return {
      text: data.text ?? '',
      confidence: computeConfidence(data.segments),
      language: data.language ?? options.language ?? 'unknown',
    };
  }

  // json 모드
  const data = (await response.json()) as WhisperJsonResponse;
  return {
    text: data.text ?? '',
    confidence: 1.0, // json 모드에서는 신뢰도 정보 없음 → 기본 1.0
    language: options.language ?? 'unknown',
  };
}
