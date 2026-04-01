/**
 * @task S2EX1
 * @description POST /api/stt — STT 음성 인식 API
 *
 * 요청: multipart/form-data
 *   - audio: File (webm, wav, mp3, ogg)
 *   - language?: string (ISO 639-1, 예: "ko", "en", "ja")
 *
 * 응답: { text, confidence, language }
 *
 * 제약:
 *   - 파일 최대 크기: 25MB (OpenAI Whisper 제한)
 *   - 지원 형식: audio/webm, audio/wav, audio/mpeg, audio/ogg
 *   - OPENAI_API_KEY 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { transcribe } from '@/lib/stt-client';
import type { TranscriptionResult } from '@/lib/stt-client';

// ============================
// 상수
// ============================

/** 최대 파일 크기: 25MB (Whisper API 제한) */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** 지원 MIME 타입 */
const SUPPORTED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/opus',
]);

// ============================
// 헬퍼
// ============================

/**
 * File의 MIME 타입을 정규화
 * 브라우저마다 webm/ogg 파일에 다른 MIME을 붙이는 경우를 처리
 *
 * @param mimeType - 원본 MIME 타입
 * @param fileName - 파일명 (확장자 힌트용)
 * @returns 정규화된 MIME 타입
 */
function normalizeMimeType(mimeType: string, fileName: string): string {
  const lower = mimeType.toLowerCase();

  // opus 코덱 webm은 audio/webm으로 처리
  if (lower.includes('opus')) return 'audio/webm';
  if (lower.includes('webm')) return 'audio/webm';
  if (lower.includes('ogg')) return 'audio/ogg';

  // MIME이 generic이면 파일 확장자로 추론
  if (lower === 'application/octet-stream' || lower === '') {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'webm') return 'audio/webm';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'mp3') return 'audio/mpeg';
    if (ext === 'ogg') return 'audio/ogg';
  }

  return lower;
}

// ============================
// Route Handler
// ============================

/**
 * POST /api/stt
 *
 * 요청 (multipart/form-data):
 * - audio: File — 오디오 파일 (webm/wav/mp3/ogg, 최대 25MB)
 * - language: string (선택) — ISO 639-1 언어 코드
 *
 * 성공 응답 (JSON):
 * ```json
 * {
 *   "text": "안녕하세요",
 *   "confidence": 0.95,
 *   "language": "ko"
 * }
 * ```
 *
 * 오류 응답:
 * - 400: 파일 없음 / 지원하지 않는 형식 / 크기 초과
 * - 500: Whisper API 오류
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Content-Type 확인
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      {
        error:
          'Content-Type must be multipart/form-data. ' +
          'Send the audio file as form field "audio".',
      },
      { status: 400 }
    );
  }

  // 2. FormData 파싱
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse multipart/form-data body' },
      { status: 400 }
    );
  }

  // 3. audio 파일 추출
  const audioFile = formData.get('audio');
  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json(
      { error: 'audio field is required and must be a File' },
      { status: 400 }
    );
  }

  // 4. 파일 크기 검증
  if (audioFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Audio file exceeds maximum size of 25MB. Got ${(audioFile.size / 1024 / 1024).toFixed(2)}MB.`,
      },
      { status: 400 }
    );
  }

  // 5. MIME 타입 검증
  const rawMime = audioFile.type;
  const mimeType = normalizeMimeType(rawMime, audioFile.name);

  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        error: `Unsupported audio format: ${rawMime}. Supported: webm, wav, mp3, ogg`,
      },
      { status: 400 }
    );
  }

  // 6. language 파라미터 추출
  const languageRaw = formData.get('language');
  const language =
    typeof languageRaw === 'string' && languageRaw.trim().length > 0
      ? languageRaw.trim()
      : undefined;

  // 7. 오디오 Buffer 변환
  let audioBuffer: Buffer;
  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json(
      { error: 'Failed to read audio file data' },
      { status: 400 }
    );
  }

  // 8. STT 변환 (Whisper API)
  let result: TranscriptionResult;
  try {
    result = await transcribe(audioBuffer, mimeType, {
      language,
      responseFormat: 'verbose_json',
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Speech-to-text transcription failed';
    console.error('[POST /api/stt] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 9. 결과 반환
  return NextResponse.json(
    {
      text: result.text,
      confidence: result.confidence,
      language: result.language,
    } satisfies TranscriptionResult,
    { status: 200 }
  );
}
