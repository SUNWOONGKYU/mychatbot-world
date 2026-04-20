/**
 * @task S9BA1
 * @description 서킷 브레이커 — 외부 API 장애 전파 차단
 *
 * 상태 전이:
 *   closed → (연속 실패 ≥ threshold) → open → (cooldown 경과) → half-open → (성공) → closed
 *                                                              → (실패) → open
 *
 * 분산 환경(서버리스)에서는 Upstash Redis를 상태 저장소로 사용.
 * Redis 미설정 시 프로세스 내 메모리로 fallback (단일 인스턴스에서만 유효).
 */

import { Redis } from '@upstash/redis';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitOptions {
  name: string;
  threshold?: number; // 연속 실패 임계 (기본 5)
  cooldownMs?: number; // open 지속 시간 (기본 60_000)
}

interface CircuitRecord {
  state: CircuitState;
  failures: number;
  openedAt?: number;
}

const memStore = new Map<string, CircuitRecord>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

async function readRecord(name: string): Promise<CircuitRecord> {
  if (redis) {
    const raw = await redis.get<CircuitRecord>(`cb:${name}`);
    if (raw) return raw;
  } else {
    const cached = memStore.get(name);
    if (cached) return cached;
  }
  return { state: 'closed', failures: 0 };
}

async function writeRecord(name: string, record: CircuitRecord): Promise<void> {
  if (redis) {
    await redis.set(`cb:${name}`, record, { ex: 120 });
  } else {
    memStore.set(name, record);
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker OPEN: ${name}`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  opts: CircuitOptions,
): Promise<T> {
  const { name, threshold = 5, cooldownMs = 60_000 } = opts;
  const record = await readRecord(name);
  const now = Date.now();

  // open 상태에서 cooldown 경과 시 half-open 전환
  if (record.state === 'open') {
    if (record.openedAt && now - record.openedAt >= cooldownMs) {
      record.state = 'half-open';
      await writeRecord(name, record);
    } else {
      throw new CircuitBreakerOpenError(name);
    }
  }

  try {
    const result = await fn();
    // 성공 시 closed 복귀
    if (record.state !== 'closed' || record.failures > 0) {
      await writeRecord(name, { state: 'closed', failures: 0 });
    }
    return result;
  } catch (err) {
    const failures = record.failures + 1;
    if (failures >= threshold) {
      await writeRecord(name, { state: 'open', failures, openedAt: now });
    } else {
      await writeRecord(name, {
        state: record.state === 'half-open' ? 'open' : 'closed',
        failures,
        openedAt: record.state === 'half-open' ? now : record.openedAt,
      });
    }
    throw err;
  }
}
