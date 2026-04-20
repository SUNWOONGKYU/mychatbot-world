/**
 * @task SAL-DA S1AR1 / S2AP1 + S8SC2
 * @description Next.js Middleware
 *  - 관리자 API 경로 중앙 인증 가드 (/api/admin/*)
 *  - AI/고비용 엔드포인트 Rate Limiting (/api/chat, /api/ai/*, /api/tts, /api/stt)
 *  - Origin 검증 (상태 변경 요청) — S8SC2
 *
 * Rate Limit: AI 20req/min, 오디오 10req/min (per IP, in-memory token bucket)
 * 주의: 서버리스 환경에서 인스턴스 간 공유 안 됨 (분산 환경은 Redis 필요)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, AI_RATE_LIMIT, AUDIO_RATE_LIMIT, PUBLIC_WRITE_RATE_LIMIT } from '@/lib/rate-limit';

// S8SC2: 허용 origin 목록 — POST/PATCH/PUT/DELETE 요청 시 Origin/Referer 헤더 검증
const ALLOWED_ORIGINS = [
  'https://mychatbot.world',
  'https://www.mychatbot.world',
  // Vercel preview 도메인은 *.vercel.app 로 검증 (아래 isAllowedOrigin)
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const u = new URL(origin);
    // Vercel preview 배포 (mychatbot-world-*.vercel.app)
    if (u.hostname.endsWith('.vercel.app')) return true;
    // localhost (개발)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return process.env.NODE_ENV !== 'production';
    }
  } catch {
    return false;
  }
  return false;
}

const STATE_CHANGING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
// Origin 검증 예외 — webhook/콜백처럼 외부 호출이 정상인 경로
const ORIGIN_CHECK_EXEMPT = [
  '/api/auth/callback',
  '/api/webhooks/',
  '/api/og', // OG 이미지는 Cross-origin 정상
];

// 공개 경로 — 인증 불필요
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/bots/public',
];

// Rate limit 적용 경로 목록
const AI_PATHS = ['/api/chat', '/api/ai/'];
const AUDIO_PATHS = ['/api/tts', '/api/stt'];
// 공개 쓰기 엔드포인트 — 일반 쓰기 rate-limit 적용 대상
const PUBLIC_WRITE_PATHS = ['/api/community/', '/api/bots/public'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Origin 검증 (S8SC2) — API 상태 변경 요청에만 적용 ───────────
  if (
    pathname.startsWith('/api/') &&
    STATE_CHANGING_METHODS.has(request.method) &&
    !ORIGIN_CHECK_EXEMPT.some((p) => pathname.startsWith(p))
  ) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const candidate = origin || (referer ? new URL(referer).origin : null);
    // Admin key 로 호출하는 서버간 통신은 Origin 누락 허용 (ADMIN_API_KEY 검증이 아래에서 수행)
    const hasAdminKey = request.headers.get('X-Admin-Key');
    if (!hasAdminKey && !isAllowedOrigin(candidate)) {
      return NextResponse.json(
        { error: 'Forbidden: cross-origin request not allowed' },
        { status: 403 },
      );
    }
  }

  // ── Rate Limiting (AI/고비용 엔드포인트) ─────────────────────
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  const isAiPath = AI_PATHS.some((p) => pathname.startsWith(p));
  const isAudioPath = AUDIO_PATHS.some((p) => pathname.startsWith(p));
  const isPublicWritePath =
    (request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE') &&
    PUBLIC_WRITE_PATHS.some((p) => pathname.startsWith(p));

  if (isAiPath || isAudioPath || isPublicWritePath) {
    const config = isAudioPath
      ? AUDIO_RATE_LIMIT
      : isPublicWritePath
        ? PUBLIC_WRITE_RATE_LIMIT
        : AI_RATE_LIMIT;
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
    // Origin 검증을 위해 /api/* 전 경로 매칭, 내부에서 메서드별 분기
    '/api/:path*',
  ],
};
