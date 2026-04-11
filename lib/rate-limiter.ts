/**
 * @description 인메모리 Rate Limiter — 중요 API 엔드포인트 보호
 *
 * 사용법:
 *   const result = rateLimit(req, { limit: 10, windowMs: 60_000 });
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *
 * 주의: 서버리스 환경(Vercel)에서는 인스턴스가 여러 개 뜰 수 있어
 *       인메모리 카운터가 인스턴스 간 공유되지 않습니다.
 *       정확한 Rate Limiting이 필요하면 Upstash Redis 기반으로 교체하세요.
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 인스턴스별 인메모리 스토어
const store = new Map<string, RateLimitEntry>();

// 만료된 엔트리 주기적 정리 (메모리 누수 방지)
function cleanup() {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}
setInterval(cleanup, 60_000);

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

/**
 * IP 기반 Rate Limiting
 * @param req  - NextRequest
 * @param key  - 구분 키 (기본: IP, 추가 식별자 가능)
 * @param opts - limit, windowMs
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
  key?: string
): RateLimitResult {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const storeKey = key ? `${key}:${ip}` : ip;
  const now = Date.now();

  let entry = store.get(storeKey);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + opts.windowMs };
    store.set(storeKey, entry);
  } else {
    entry.count += 1;
  }

  const allowed = entry.count <= opts.limit;
  const remaining = Math.max(0, opts.limit - entry.count);
  const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);

  return { allowed, remaining, resetAt: entry.resetAt, retryAfterSec };
}

// ── 사전 정의된 프리셋 ───────────────────────────────────────────

/** 결제 API: 분당 5회 */
export const RATE_PAYMENTS = { limit: 5, windowMs: 60_000 } satisfies RateLimitOptions;

/** 관리자 API: 분당 30회 */
export const RATE_ADMIN = { limit: 30, windowMs: 60_000 } satisfies RateLimitOptions;

/** 비밀번호 변경: 시간당 10회 */
export const RATE_PASSWORD = { limit: 10, windowMs: 3_600_000 } satisfies RateLimitOptions;

/** AI 채팅: 분당 20회 */
export const RATE_CHAT = { limit: 20, windowMs: 60_000 } satisfies RateLimitOptions;
