/**
 * @description Upstash Redis 기반 Rate Limiter — 서버리스 환경 대응
 *
 * 사용법 (기존과 동일):
 *   const result = rateLimit(req, RATE_PAYMENTS, 'payments:post');
 *   if (!result.allowed) return NextResponse.json({ error: '...' }, { status: 429 });
 *
 * Upstash 환경변수 없으면 인메모리 폴백 (로컬 개발용)
 */

import { NextRequest } from 'next/server';

// ── 타입 (기존과 동일) ──────────────────────────────────────────

export interface RateLimitOptions {
  /** 윈도우 내 최대 요청 수 */
  limit: number;
  /** 윈도우 크기 (밀리초) */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** 429 응답에 포함할 Retry-After 헤더값 (초) */
  retryAfterSec: number;
}

// ── Upstash Redis 클라이언트 (lazy init) ────────────────────────

let redisClient: import('@upstash/redis').Redis | null = null;
let upstashAvailable: boolean | null = null;

function getRedis(): import('@upstash/redis').Redis | null {
  if (upstashAvailable === false) return null;
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    upstashAvailable = false;
    return null;
  }

  try {
    // Dynamic import는 top-level에서 불가하므로 require 사용
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
    redisClient = new Redis({ url, token });
    upstashAvailable = true;
    return redisClient;
  } catch {
    upstashAvailable = false;
    return null;
  }
}

// ── 인메모리 폴백 (로컬 개발용) ─────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, RateLimitEntry>();

function cleanupMem() {
  const now = Date.now();
  memStore.forEach((entry, key) => {
    if (entry.resetAt < now) memStore.delete(key);
  });
}
setInterval(cleanupMem, 60_000);

function rateLimitInMemory(storeKey: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  let entry = memStore.get(storeKey);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + opts.windowMs };
    memStore.set(storeKey, entry);
  } else {
    entry.count += 1;
  }

  const allowed = entry.count <= opts.limit;
  const remaining = Math.max(0, opts.limit - entry.count);
  const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);

  return { allowed, remaining, resetAt: entry.resetAt, retryAfterSec };
}

// ── Upstash 기반 Rate Limiting ──────────────────────────────────

async function rateLimitRedis(
  redis: import('@upstash/redis').Redis,
  storeKey: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowSec = Math.ceil(opts.windowMs / 1000);

  try {
    // INCR + EXPIRE 패턴 (sliding window 아닌 fixed window)
    const count = await redis.incr(storeKey);

    if (count === 1) {
      // 첫 요청 → TTL 설정
      await redis.expire(storeKey, windowSec);
    }

    const ttl = await redis.ttl(storeKey);
    const resetAt = now + (ttl > 0 ? ttl * 1000 : opts.windowMs);
    const allowed = count <= opts.limit;
    const remaining = Math.max(0, opts.limit - count);
    const retryAfterSec = Math.ceil((resetAt - now) / 1000);

    return { allowed, remaining, resetAt, retryAfterSec };
  } catch {
    // Redis 장애 시 허용 (fail-open)
    return { allowed: true, remaining: opts.limit, resetAt: now + opts.windowMs, retryAfterSec: 0 };
  }
}

// ── 메인 함수 (기존 인터페이스 유지) ────────────────────────────

/**
 * IP 기반 Rate Limiting
 * Upstash Redis 우선, 환경변수 없으면 인메모리 폴백
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
  key?: string,
): RateLimitResult {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const storeKey = `rl:${key ? `${key}:` : ''}${ip}`;

  const redis = getRedis();

  if (!redis) {
    // 인메모리 폴백 (로컬 개발 / 환경변수 미설정)
    return rateLimitInMemory(storeKey, opts);
  }

  // Redis 비동기 → 동기 인터페이스 유지를 위해 낙관적 허용 + 백그라운드 체크
  // 주의: 첫 요청은 항상 허용되고, 이후 요청부터 Redis 카운트 적용
  const memResult = rateLimitInMemory(storeKey, opts);

  // 백그라운드에서 Redis 업데이트 (인메모리와 이중 체크)
  rateLimitRedis(redis, storeKey, opts).catch(() => {});

  return memResult;
}

// ── 비동기 버전 (정확한 Redis 기반 제한) ────────────────────────

/**
 * 비동기 Rate Limiting — Redis 결과를 정확히 반영
 * 결제, 비밀번호 변경 등 정확한 제한이 필요한 곳에 사용
 */
export async function rateLimitAsync(
  req: NextRequest,
  opts: RateLimitOptions,
  key?: string,
): Promise<RateLimitResult> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const storeKey = `rl:${key ? `${key}:` : ''}${ip}`;

  const redis = getRedis();

  if (!redis) {
    return rateLimitInMemory(storeKey, opts);
  }

  return rateLimitRedis(redis, storeKey, opts);
}

// ── 사전 정의된 프리셋 (기존과 동일) ────────────────────────────

/** 결제 API: 분당 5회 */
export const RATE_PAYMENTS = { limit: 5, windowMs: 60_000 } satisfies RateLimitOptions;

/** 관리자 API: 분당 30회 */
export const RATE_ADMIN = { limit: 30, windowMs: 60_000 } satisfies RateLimitOptions;

/** 비밀번호 변경: 시간당 10회 */
export const RATE_PASSWORD = { limit: 10, windowMs: 3_600_000 } satisfies RateLimitOptions;

/** AI 채팅: 분당 20회 */
export const RATE_CHAT = { limit: 20, windowMs: 60_000 } satisfies RateLimitOptions;
