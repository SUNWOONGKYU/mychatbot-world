/**
 * @task S9BA2
 * @description 통일된 재시도 정책 (exponential backoff + jitter)
 *
 * 사용:
 *   const result = await retryWithBackoff(() => fetch(url), {
 *     maxRetries: 3,
 *     baseMs: 200,
 *     factor: 2,
 *     jitter: true,
 *     shouldRetry: (err) => err.status >= 500,
 *   });
 *
 * 정책:
 *   - 5xx, 네트워크 에러 → 재시도
 *   - 4xx → 즉시 throw (클라이언트 버그)
 *   - 지수 백오프: 200ms → 400ms → 800ms (jitter ±50%)
 */

export interface RetryOptions {
  maxRetries?: number;
  baseMs?: number;
  factor?: number;
  jitter?: boolean;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  baseMs: 200,
  factor: 2,
  jitter: true,
};

function defaultShouldRetry(err: unknown): boolean {
  if (err instanceof Error) {
    // network error, timeout
    if (err.name === 'AbortError' || err.message.includes('fetch failed')) return true;
  }
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status: number }).status;
    return status >= 500 && status < 600;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === opts.maxRetries || !shouldRetry(err, attempt)) {
        throw err;
      }
      let delay = opts.baseMs * Math.pow(opts.factor, attempt);
      if (opts.jitter) {
        const rand = 0.5 + Math.random(); // 0.5~1.5
        delay = Math.floor(delay * rand);
      }
      options.onRetry?.(err, attempt + 1, delay);
      await sleep(delay);
    }
  }
  throw lastErr;
}
