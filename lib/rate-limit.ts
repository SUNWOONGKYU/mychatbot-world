/**
 * @task SAL-DA S2AP1
 * @description Rate Limiting — 토큰 버킷 알고리즘
 * Edge Runtime / Next.js Middleware compatible: Map 기반 인메모리 버킷
 *
 * 제약: 서버리스 환경에서 인스턴스 간 공유 안 됨
 * (분산 환경에서는 Redis 기반 업그레이드 필요)
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

export interface RateLimitConfig {
  /** 버킷 최대 토큰 수 */
  maxTokens: number;
  /** 초당 보충 토큰 수 */
  refillRate: number;
  /** 버킷 만료 기준 (ms) — cleanup 시 사용 */
  windowMs: number;
}

/** AI/고비용 엔드포인트용 엄격한 설정 */
export const AI_RATE_LIMIT: RateLimitConfig = {
  maxTokens: 20,   // 분당 최대 20회
  refillRate: 0.33, // 초당 0.33 토큰 (≈ 20회/분)
  windowMs: 60_000,
};

/** TTS/STT 오디오 합성용 설정 */
export const AUDIO_RATE_LIMIT: RateLimitConfig = {
  maxTokens: 10,   // 분당 최대 10회
  refillRate: 0.17, // 초당 0.17 토큰 (≈ 10회/분)
  windowMs: 60_000,
};

/** 공개 쓰기 엔드포인트용 설정 (커뮤니티/공개 봇 API) */
export const PUBLIC_WRITE_RATE_LIMIT: RateLimitConfig = {
  maxTokens: 30,   // 분당 최대 30회
  refillRate: 0.5, // 초당 0.5 토큰 (≈ 30회/분)
  windowMs: 60_000,
};

/** 오래된 버킷 정리 (메모리 누수 방지) */
function cleanupStaleBuckets(windowMs: number): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > windowMs * 2) {
      buckets.delete(key);
    }
  }
}

/**
 * 토큰 버킷 Rate Limiting 체크
 * @returns 429 응답 객체 (한도 초과 시) 또는 null (통과 시)
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { status: 429; retryAfter: number } | null {
  // 100개 초과 시 cleanup
  if (buckets.size > 100) {
    cleanupStaleBuckets(config.windowMs);
  }

  const now = Date.now();
  let bucket = buckets.get(key) ?? {
    tokens: config.maxTokens,
    lastRefill: now,
  };

  // 경과 시간만큼 토큰 보충
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket = {
    tokens: Math.min(
      config.maxTokens,
      bucket.tokens + elapsed * config.refillRate
    ),
    lastRefill: now,
  };

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    const retryAfter = Math.ceil((1 - bucket.tokens) / config.refillRate);
    return { status: 429, retryAfter };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return null; // 통과
}

/**
 * X-Forwarded-For 또는 실제 IP 추출
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}
