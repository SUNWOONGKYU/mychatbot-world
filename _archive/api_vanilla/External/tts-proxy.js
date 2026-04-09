// @task S3E3
// unspeech TTS 마이크로서비스 — HTTP API 프록시
//
// AGPL 라이선스 격리 이유:
//   unspeech는 AGPL-3.0 라이선스 오픈소스 TTS 엔진입니다.
//   AGPL은 네트워크를 통해 서비스를 제공하는 경우에도 소스코드 공개 의무가 발생합니다.
//   MCW 메인 코드베이스(MIT)와의 라이선스 오염을 방지하기 위해:
//     1. unspeech는 별도 Docker 컨테이너로 격리 실행됩니다.
//     2. MCW는 이 프록시 파일을 통해 HTTP API로만 통신합니다.
//     3. unspeech 코드/바이너리는 MCW 저장소에 포함되지 않습니다.
//
// 엔드포인트: POST /api/External/tts-proxy
// 요청 body:  { text: string, voice?: string, speed?: number }
// 응답:       audio/wav 스트림 (unspeech 원본 응답 그대로 전달)

const TIMEOUT_MS = 30_000; // 30초 타임아웃 (TTS 생성은 텍스트 길이에 따라 소요 시간 가변)

export default async function handler(req, res) {
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // UNSPEECH_URL 환경변수 필수 확인 (하드코딩 금지)
  const UNSPEECH_URL = process.env.UNSPEECH_URL;
  if (!UNSPEECH_URL) {
    console.error('[tts-proxy] UNSPEECH_URL 환경변수가 설정되지 않았습니다.');
    return res.status(500).json({
      error: 'Server configuration error',
      detail: 'UNSPEECH_URL environment variable is not set.',
    });
  }

  // 요청 body 파싱
  const { text, voice, speed } = req.body || {};

  // text 필드 필수 검증
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      detail: "'text' field is required and must be a non-empty string.",
    });
  }

  // unspeech API 요청 payload 구성 (옵션 필드는 undefined 제외)
  const payload = { text: text.trim() };
  if (voice !== undefined) payload.voice = voice;
  if (speed !== undefined) payload.speed = speed;

  // AbortController로 타임아웃 구현
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${UNSPEECH_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // unspeech 서비스 에러 응답 처리
    if (!upstream.ok) {
      let detail = `unspeech responded with HTTP ${upstream.status}`;
      try {
        const errBody = await upstream.text();
        if (errBody) detail += `: ${errBody}`;
      } catch (_) {
        // 응답 body 파싱 실패 시 무시
      }
      console.error(`[tts-proxy] upstream error — ${detail}`);
      return res.status(502).json({ error: 'Bad Gateway', detail });
    }

    // 응답 Content-Type 확인 (audio/wav 기대)
    const contentType = upstream.headers.get('content-type') || 'audio/wav';

    // unspeech 응답(audio/wav)을 클라이언트에 그대로 스트리밍
    res.setHeader('Content-Type', contentType);

    const audioBuffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(audioBuffer));

  } catch (err) {
    clearTimeout(timeoutId);

    // 타임아웃 에러
    if (err.name === 'AbortError') {
      console.error(`[tts-proxy] unspeech 요청 타임아웃 (${TIMEOUT_MS}ms 초과)`);
      return res.status(504).json({
        error: 'Gateway Timeout',
        detail: `unspeech did not respond within ${TIMEOUT_MS / 1000} seconds.`,
      });
    }

    // 연결 실패 (unspeech 서비스 다운 등)
    if (err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
      console.error(`[tts-proxy] unspeech 서비스에 연결할 수 없습니다: ${UNSPEECH_URL}`);
      return res.status(502).json({
        error: 'Bad Gateway',
        detail: 'Cannot connect to unspeech service. The TTS service may be down.',
      });
    }

    // 기타 예기치 못한 에러
    console.error('[tts-proxy] 예기치 못한 에러:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      detail: err.message || 'An unexpected error occurred.',
    });
  }
}
