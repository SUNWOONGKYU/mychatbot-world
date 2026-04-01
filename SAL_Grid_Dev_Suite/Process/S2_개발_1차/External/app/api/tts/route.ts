/**
 * @task S2EX1
 * @description POST /api/tts — TTS 오디오 합성 API
 *
 * 요청: POST { text, voice?, language?, speed? }
 * 응답: audio/mpeg Buffer (MP3)
 *
 * 캐시 히트 시: 응답 헤더 X-Cache: HIT
 * 캐시 미스 시: 응답 헤더 X-Cache: MISS
 *
 * 제약:
 *   - 텍스트 최대 500자 (초과 시 400)
 *   - OPENAI_API_KEY 필수
 *   - ELEVENLABS_API_KEY 있으면 ElevenLabs 우선 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { synthesize, buildCacheKey } from '@/lib/tts-client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ============================
// 상수
// ============================

/** 텍스트 최대 길이 */
const MAX_TEXT_LENGTH = 500;

/** 캐시 디렉토리 (tts-client와 동일) */
const CACHE_DIR = '/tmp/tts-cache';

// ============================
// 헬퍼
// ============================

/**
 * 요청 처리 전 캐시 히트 여부를 미리 확인
 * (synthesize 내부 캐시 로직과 별개로, 헤더에 HIT/MISS를 설정하기 위해 사전 확인)
 *
 * @param text - 합성할 텍스트
 * @param voice - 음성 ID
 * @param language - 언어 코드
 * @returns 캐시 히트 여부
 */
function isCacheHit(text: string, voice: string, language: string): boolean {
  const key = buildCacheKey(text, voice, language);
  const audioPath = path.join(CACHE_DIR, `${key}.mp3`);
  const metaPath = path.join(CACHE_DIR, `${key}.meta.json`);

  if (!fs.existsSync(audioPath) || !fs.existsSync(metaPath)) {
    return false;
  }

  try {
    const meta = JSON.parse(
      fs.readFileSync(metaPath, 'utf-8')
    ) as { createdAt: number };
    const TTL_MS = 24 * 60 * 60 * 1000;
    return Date.now() - meta.createdAt <= TTL_MS;
  } catch {
    return false;
  }
}

// ============================
// Route Handler
// ============================

/**
 * POST /api/tts
 *
 * 요청 바디 (JSON):
 * ```json
 * {
 *   "text": "안녕하세요",
 *   "voice": "nova",
 *   "language": "ko",
 *   "speed": 1.0
 * }
 * ```
 *
 * 성공 응답:
 * - Content-Type: audio/mpeg
 * - X-Cache: HIT | MISS
 *
 * 오류 응답:
 * - 400: 텍스트 없음 / 500자 초과 / 잘못된 speed 범위
 * - 500: API 오류
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. 요청 파싱
  let body: {
    text?: unknown;
    voice?: unknown;
    language?: unknown;
    speed?: unknown;
  };

  try {
    body = (await req.json()) as {
      text?: unknown;
      voice?: unknown;
      language?: unknown;
      speed?: unknown;
    };
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { text, voice, language, speed } = body;

  // 2. 필수 파라미터 검증
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json(
      { error: 'text is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      {
        error: `text exceeds maximum length of ${MAX_TEXT_LENGTH} characters. Got ${text.length}.`,
      },
      { status: 400 }
    );
  }

  // 3. 옵션 파라미터 검증 및 기본값
  const resolvedVoice = typeof voice === 'string' ? voice : 'nova';
  const resolvedLanguage = typeof language === 'string' ? language : 'ko';
  let resolvedSpeed = 1.0;

  if (speed !== undefined) {
    const speedNum = Number(speed);
    if (isNaN(speedNum) || speedNum < 0.5 || speedNum > 2.0) {
      return NextResponse.json(
        { error: 'speed must be a number between 0.5 and 2.0' },
        { status: 400 }
      );
    }
    resolvedSpeed = speedNum;
  }

  // 4. 캐시 히트 여부 사전 확인 (헤더 설정용)
  const cacheHit = isCacheHit(text, resolvedVoice, resolvedLanguage);

  // 5. TTS 합성 (캐시 히트 시 캐시 반환, 미스 시 API 호출)
  let audioBuffer: Buffer;
  try {
    audioBuffer = await synthesize(text, {
      voice: resolvedVoice,
      language: resolvedLanguage,
      speed: resolvedSpeed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS synthesis failed';
    console.error('[POST /api/tts] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 6. 오디오 응답 반환
  const headers = new Headers({
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(audioBuffer.length),
    'X-Cache': cacheHit ? 'HIT' : 'MISS',
    // 서버리스(Vercel) 환경에서는 파일 캐시 대신 HTTP 캐시 활용
    'Cache-Control': 'public, max-age=86400',
  });

  return new NextResponse(audioBuffer, {
    status: 200,
    headers,
  });
}
