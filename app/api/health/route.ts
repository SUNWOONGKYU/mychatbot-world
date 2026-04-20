/**
 * @task S5DO1 / S6BI2 / S9BA3
 * @description GET /api/health — 세분화된 헬스체크
 *
 * S9BA3 업그레이드: 서비스별 독립 status + latency 측정.
 *
 * 응답 스키마:
 *   {
 *     status: 'ok' | 'degraded' | 'down',
 *     services: {
 *       env:        { status, ... }
 *       database:   { status, latency_ms }
 *       redis:      { status, latency_ms }
 *       openrouter: { status, latency_ms }
 *     },
 *     timestamp, service, version
 *   }
 *
 * HTTP 200: overall=ok
 * HTTP 503: overall=degraded 또는 down
 */

export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { checkServerEnv } from '@/lib/env';

type ServiceStatus = 'ok' | 'unreachable' | 'timeout' | 'skipped' | 'missing';

interface ServiceResult {
  status: ServiceStatus;
  latency_ms?: number;
  detail?: string;
}

interface HealthPayload {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  service: string;
  version?: string;
  services: {
    env: ServiceResult & { missing?: string[]; warnings?: string[] };
    database: ServiceResult;
    redis: ServiceResult;
    openrouter: ServiceResult;
  };
}

const REQUIRED_ENVS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const SERVICE_TIMEOUT_MS = 2_000;

// ── 개별 서비스 헬스 프로브 ──────────────────────────────────────

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return Promise.race([
    promise,
    new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms)),
  ]);
}

async function probeDatabase(): Promise<ServiceResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { status: 'skipped', detail: 'env missing' };

  const start = Date.now();
  try {
    const supabase = createClient(url, key);
    const queryPromise = (async () => {
      const { error } = await supabase
        .from('mcw_bots')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      return { error };
    })();
    const result = await withTimeout(queryPromise, SERVICE_TIMEOUT_MS);
    const latency_ms = Date.now() - start;
    if (result === 'timeout') return { status: 'timeout', latency_ms };
    if (result.error) {
      return { status: 'unreachable', latency_ms, detail: result.error.message };
    }
    return { status: 'ok', latency_ms };
  } catch (err) {
    return {
      status: 'unreachable',
      latency_ms: Date.now() - start,
      detail: err instanceof Error ? err.message : 'unknown',
    };
  }
}

async function probeRedis(): Promise<ServiceResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { status: 'skipped', detail: 'env missing' };

  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch(`${url}/ping`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      SERVICE_TIMEOUT_MS,
    );
    const latency_ms = Date.now() - start;
    if (res === 'timeout') return { status: 'timeout', latency_ms };
    if (!res.ok) return { status: 'unreachable', latency_ms, detail: `HTTP ${res.status}` };
    return { status: 'ok', latency_ms };
  } catch (err) {
    return {
      status: 'unreachable',
      latency_ms: Date.now() - start,
      detail: err instanceof Error ? err.message : 'unknown',
    };
  }
}

async function probeOpenRouter(): Promise<ServiceResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { status: 'skipped', detail: 'env missing' };

  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch('https://openrouter.ai/api/v1/models', {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${key}` },
      }),
      SERVICE_TIMEOUT_MS,
    );
    const latency_ms = Date.now() - start;
    if (res === 'timeout') return { status: 'timeout', latency_ms };
    // 405(HEAD unsupported) 도 살아있음 신호로 허용
    if (res.ok || res.status === 405 || res.status === 401) {
      return { status: 'ok', latency_ms };
    }
    return { status: 'unreachable', latency_ms, detail: `HTTP ${res.status}` };
  } catch (err) {
    return {
      status: 'unreachable',
      latency_ms: Date.now() - start,
      detail: err instanceof Error ? err.message : 'unknown',
    };
  }
}

// ── 전체 상태 종합 ───────────────────────────────────────────────

function computeOverall(services: HealthPayload['services']): HealthPayload['status'] {
  const envOk = services.env.status === 'ok';
  const dbOk = services.database.status === 'ok';
  const redisOk = services.redis.status === 'ok' || services.redis.status === 'skipped';
  const openrouterOk =
    services.openrouter.status === 'ok' || services.openrouter.status === 'skipped';

  if (!envOk || !dbOk) return 'down'; // env/DB는 필수
  if (!redisOk || !openrouterOk) return 'degraded';
  return 'ok';
}

// ── 엔드포인트 ──────────────────────────────────────────────────

export async function GET(): Promise<Response> {
  const missing = REQUIRED_ENVS.filter((k) => !process.env[k]);
  const envAudit = checkServerEnv();

  const [database, redis, openrouter] = await Promise.all([
    probeDatabase(),
    probeRedis(),
    probeOpenRouter(),
  ]);

  const services: HealthPayload['services'] = {
    env: {
      status: missing.length === 0 ? 'ok' : 'missing',
      ...(missing.length > 0 ? { missing: missing as unknown as string[] } : {}),
      ...(envAudit.warnings.length > 0 ? { warnings: envAudit.warnings } : {}),
    },
    database,
    redis,
    openrouter,
  };

  const overall = computeOverall(services);
  const httpStatus = overall === 'ok' ? 200 : 503;

  const payload: HealthPayload = {
    status: overall,
    timestamp: new Date().toISOString(),
    service: 'mychatbot-world',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    services,
  };

  return Response.json(payload, { status: httpStatus });
}
