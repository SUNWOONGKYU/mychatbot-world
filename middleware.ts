/**
 * @task SAL-DA S1AR1 / S2AP1
 * @description Next.js Middleware
 *  - 관리자 API 경로 중앙 인증 가드 (/api/admin/*)
 *  - AI/고비용 엔드포인트 Rate Limiting (/api/chat, /api/ai/*, /api/tts, /api/stt)
 *
 * Rate Limit: AI 20req/min, 오디오 10req/min (per IP, in-memory token bucket)
 * 주의: 서버리스 환경에서 인스턴스 간 공유 안 됨 (분산 환경은 Redis 필요)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, AI_RATE_LIMIT, AUDIO_RATE_LIMIT } from '@/lib/rate-limit';

// 공개 경로 — 인증 불필요
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/bots/public',
];

// Rate limit 적용 경로 목록
const AI_PATHS = ['/api/chat', '/api/ai/'];
const AUDIO_PATHS = ['/api/tts', '/api/stt'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate Limiting (AI/고비용 엔드포인트) ─────────────────────
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  const isAiPath = AI_PATHS.some((p) => pathname.startsWith(p));
  const isAudioPath = AUDIO_PATHS.some((p) => pathname.startsWith(p));

  if (isAiPath || isAudioPath) {
    const config = isAudioPath ? AUDIO_RATE_LIMIT : AI_RATE_LIMIT;
    const limited = checkRateLimit(`${ip}:${pathname}`, config);
    if (limited) {
      return NextResponse.json(
        { error: 'Too Many Requests', retryAfter: limited.retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': String(limited.retryAfter),
            'X-RateLimit-Limit': String(config.maxTokens),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // ── 관리자 API 경로 보호 ──────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    const adminKey = process.env.ADMIN_API_KEY;
    const requestAdminKey = request.headers.get('X-Admin-Key');
    const authHeader = request.headers.get('Authorization') || '';

    // X-Admin-Key 검증
    if (adminKey && requestAdminKey === adminKey) {
      return NextResponse.next();
    }

    // Bearer 토큰이 있으면 통과 (route 레벨에서 verifyAdminUser로 세부 검증)
    if (authHeader.startsWith('Bearer ')) {
      return NextResponse.next();
    }

    return NextResponse.json(
      { error: 'Admin authentication required' },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/chat/:path*',
    '/api/ai/:path*',
    '/api/tts',
    '/api/stt',
  ],
};
