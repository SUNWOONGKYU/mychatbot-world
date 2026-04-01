/**
 * @task S3SC1
 * @description Rate Limiting — 토큰 버킷 알고리즘
 * Edge Runtime compatible: Map 기반 인메모리 버킷
 * Note: 서버리스 환경에서 인스턴스 간 공유 안 됨 (분산 환경은 Redis 필요 — S4 고도화)
 */
import { NextRequest, NextResponse } from 'next/server';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const RATE_LIMIT_CONFIG = {
  maxTokens: 60,        // 분당 최대 60회
  refillRate: 1,        // 초당 1 토큰 보충
  windowMs: 60_000,     // 1분 윈도우 (cleanup 기준)
} as const;

/**
 * 오래된 버킷 정리 (메모리 누수 방지)
 * Edge Runtime에서는 주기적 실행이 아닌 요청 시 트리거
 */
function cleanupStaleBuckets(): void {
  const now = Date.now();
  Array.from(buckets.entries()).forEach(([ip, bucket]) => {
    if (now - bucket.lastRefill > RATE_LIMIT_CONFIG.windowMs * 2) {
      buckets.delete(ip);
    }
  });
}

/**
 * Rate Limiting 미들웨어
 * @returns NextResponse(429) if rate limit exceeded, null if allowed
 */
export function rateLimitMiddleware(req: NextRequest): NextResponse | null {
  // 100개 버킷마다 cleanup 실행
  if (buckets.size > 100) {
    cleanupStaleBuckets();
  }

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const now = Date.now();

  let bucket = buckets.get(ip) ?? {
    tokens: RATE_LIMIT_CONFIG.maxTokens,
    lastRefill: now,
  };

  // 토큰 보충: 경과 시간(초) × 보충률
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket = {
    tokens: Math.min(
      RATE_LIMIT_CONFIG.maxTokens,
      bucket.tokens + elapsed * RATE_LIMIT_CONFIG.refillRate
    ),
    lastRefill: now,
  };

  if (bucket.tokens < 1) {
    buckets.set(ip, bucket);
    const retryAfter = Math.ceil((1 - bucket.tokens) / RATE_LIMIT_CONFIG.refillRate);
    return NextResponse.json(
      { error: 'Too Many Requests', retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.maxTokens),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return null; // 통과
}
