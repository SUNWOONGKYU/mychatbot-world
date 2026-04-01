/**
 * @task S2EX1
 * @description TTS 클라이언트 — OpenAI TTS / ElevenLabs 지원, 응답 캐싱 포함
 *
 * 지원 엔진:
 *   - OpenAI TTS (tts-1, tts-1-hd)
 *   - ElevenLabs API (고품질 선택, fallback: OpenAI)
 *
 * 캐싱:
 *   - 캐시 키: md5(text + voice + language)
 *   - 저장소: /tmp/tts-cache/
 *   - TTL: 24시간 (86400초)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ============================
// 타입 정의
// ============================

/**
 * OpenAI TTS 지원 음성 ID
 */
export type OpenAIVoice =
  | 'alloy'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'shimmer';

/**
 * TTS 요청 옵션
 */
export interface TTSOptions {
  /**
   * 음성 ID (OpenAI: alloy/echo/fable/onyx/nova/shimmer)
   * ElevenLabs 사용 시 ElevenLabs 음성 ID 지정
   * @default 'nova'
   */
  voice?: string;
  /**
   * 재생 속도 (0.5 ~ 2.0)
   * @default 1.0
   */
  speed?: number;
  /**
   * 언어 코드 (ISO 639-1: ko, en, ja 등)
   * OpenAI는 자동 감지, ElevenLabs는 언어 힌트로 사용
   * @default 'ko'
   */
  language?: string;
  /**
   * OpenAI TTS 모델
   * @default 'tts-1'
   */
  model?: 'tts-1' | 'tts-1-hd';
}

/**
 * 캐시 메타데이터 (JSON)
 */
interface CacheMeta {
  /** 캐시 생성 Unix timestamp (ms) */
  createdAt: number;
  /** 원본 텍스트 길이 */
  textLength: number;
  /** 사용된 음성 */
  voice: string;
  /** 사용된 언어 */
  language: string;
}

// ============================
// 상수
// ============================

/** 캐시 저장 디렉토리 */
const CACHE_DIR = '/tmp/tts-cache';

/** 캐시 TTL: 24시간 (ms) */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** OpenAI TTS API 엔드포인트 */
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

/** ElevenLabs TTS API 베이스 URL */
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// ============================
// 캐시 유틸리티
// ============================

/**
 * 캐시 디렉토리 초기화 (없으면 생성)
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * 캐시 키 생성 (MD5 해시)
 *
 * @param text - 합성할 텍스트
 * @param voice - 음성 ID
 * @param language - 언어 코드
 * @returns 32자 16진수 MD5 해시
 */
function buildCacheKey(text: string, voice: string, language: string): string {
  return crypto
    .createHash('md5')
    .update(`${text}::${voice}::${language}`)
    .digest('hex');
}

/**
 * 캐시에서 오디오 버퍼 로드
 * TTL 초과 시 null 반환 후 캐시 파일 삭제
 *
 * @param cacheKey - MD5 캐시 키
 * @returns 캐시 히트 시 Buffer, 미스 시 null
 */
function loadFromCache(cacheKey: string): Buffer | null {
  const audioPath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
  const metaPath = path.join(CACHE_DIR, `${cacheKey}.meta.json`);

  if (!fs.existsSync(audioPath) || !fs.existsSync(metaPath)) {
    return null;
  }

  try {
    const meta: CacheMeta = JSON.parse(
      fs.readFileSync(metaPath, 'utf-8')
    ) as CacheMeta;

    const age = Date.now() - meta.createdAt;
    if (age > CACHE_TTL_MS) {
      // TTL 초과 → 캐시 파일 삭제
      fs.rmSync(audioPath, { force: true });
      fs.rmSync(metaPath, { force: true });
      return null;
    }

    return fs.readFileSync(audioPath);
  } catch {
    return null;
  }
}

/**
 * 오디오 버퍼를 캐시에 저장
 *
 * @param cacheKey - MD5 캐시 키
 * @param audioBuffer - 저장할 오디오 데이터
 * @param meta - 캐시 메타데이터
 */
function saveToCache(
  cacheKey: string,
  audioBuffer: Buffer,
  meta: CacheMeta
): void {
  try {
    ensureCacheDir();
    const audioPath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
    const metaPath = path.join(CACHE_DIR, `${cacheKey}.meta.json`);

    fs.writeFileSync(audioPath, audioBuffer);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  } catch {
    // 캐시 저장 실패는 치명적이지 않으므로 무시
  }
}

// ============================
// OpenAI TTS
// ============================

/**
 * OpenAI TTS API 호출
 *
 * @param text - 합성할 텍스트 (최대 4096자)
 * @param options - TTS 옵션
 * @returns MP3 오디오 Buffer
 * @throws Error - API 키 미설정 / API 오류
 */
async function synthesizeOpenAI(
  text: string,
  options: Required<TTSOptions>
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. Add it to .env.local'
    );
  }

  const requestBody = {
    model: options.model,
    input: text,
    voice: (options.voice as OpenAIVoice) || 'nova',
    speed: Math.min(2.0, Math.max(0.25, options.speed)),
    response_format: 'mp3',
  };

  const response = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMsg: string;
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      errorMsg = errBody.error?.message ?? `HTTP ${response.status}`;
    } catch {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(`OpenAI TTS API error: ${errorMsg}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ============================
// ElevenLabs TTS
// ============================

/**
 * ElevenLabs TTS API 호출
 * ELEVENLABS_API_KEY 없으면 호출하지 않아야 함 (synthesize에서 분기)
 *
 * @param text - 합성할 텍스트
 * @param voiceId - ElevenLabs 음성 ID
 * @param language - 언어 코드 (힌트용)
 * @returns MP3 오디오 Buffer
 * @throws Error - API 오류
 */
async function synthesizeElevenLabs(
  text: string,
  voiceId: string,
  language: string
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY!;

  const url = `${ELEVENLABS_BASE_URL}/${encodeURIComponent(voiceId)}`;

  const requestBody = {
    text,
    model_id: 'eleven_multilingual_v2',
    language_code: language,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMsg: string;
    try {
      const errBody = (await response.json()) as { detail?: { message?: string } };
      errorMsg = errBody.detail?.message ?? `HTTP ${response.status}`;
    } catch {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(`ElevenLabs TTS API error: ${errorMsg}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ============================
// 공개 API
// ============================

/**
 * 텍스트를 음성으로 합성 (TTS)
 *
 * 우선순위:
 *   1. 캐시 히트 → 즉시 반환
 *   2. ELEVENLABS_API_KEY 있으면 ElevenLabs 호출
 *   3. OPENAI_API_KEY로 OpenAI TTS 호출
 *
 * @param text - 합성할 텍스트 (최대 500자 — API 레이어에서 검증)
 * @param options - TTS 옵션 (voice, speed, language, model)
 * @returns MP3 형식의 오디오 Buffer
 *
 * @throws Error - 필수 환경변수 미설정 / API 오류
 *
 * @example
 * ```ts
 * const audio = await synthesize('안녕하세요', { voice: 'nova', language: 'ko' });
 * // audio는 MP3 Buffer
 * ```
 */
export async function synthesize(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const resolvedOptions: Required<TTSOptions> = {
    voice: options.voice ?? 'nova',
    speed: Math.min(2.0, Math.max(0.5, options.speed ?? 1.0)),
    language: options.language ?? 'ko',
    model: options.model ?? 'tts-1',
  };

  const { voice, language } = resolvedOptions;

  // 1. 캐시 확인
  const cacheKey = buildCacheKey(text, voice, language);
  const cached = loadFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. 엔진 선택 및 합성
  let audioBuffer: Buffer;

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsKey) {
    try {
      audioBuffer = await synthesizeElevenLabs(text, voice, language);
    } catch (err) {
      // ElevenLabs 실패 시 OpenAI로 fallback
      console.warn(
        '[tts-client] ElevenLabs failed, falling back to OpenAI:',
        err instanceof Error ? err.message : err
      );
      audioBuffer = await synthesizeOpenAI(text, resolvedOptions);
    }
  } else {
    audioBuffer = await synthesizeOpenAI(text, resolvedOptions);
  }

  // 3. 캐시 저장
  saveToCache(cacheKey, audioBuffer, {
    createdAt: Date.now(),
    textLength: text.length,
    voice,
    language,
  });

  return audioBuffer;
}

/**
 * 캐시 키 생성 함수 — 외부 테스트용 export
 *
 * @param text - 텍스트
 * @param voice - 음성 ID
 * @param language - 언어 코드
 * @returns MD5 캐시 키
 */
export { buildCacheKey };
