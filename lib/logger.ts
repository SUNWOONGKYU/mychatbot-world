/**
 * @task S8BI2 — 구조화 로그 (JSON)
 *
 * 모든 API 경로에서 console.log 대신 이 모듈을 사용.
 * Vercel Log Drain (→ Axiom/Datadog/Betterstack) 가 JSON 을 파싱할 수 있도록
 * 단일 라인 JSON 으로 출력한다.
 *
 * 개발 환경(NODE_ENV !== 'production')에서는 사람이 읽기 쉬운 포맷으로 출력.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const IS_PROD = process.env.NODE_ENV === 'production';
const SERVICE = 'cocobot-world';
const VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev';

/**
 * 값에서 민감 필드를 마스킹.
 * key 에 비밀/키 관련 단어가 포함되면 값 치환.
 */
const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|cookie|admin_key|api_key)/i;

function redactValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    // 40자 이상의 hex/base64 문자열은 마스킹
    if (value.length > 32 && /^[A-Za-z0-9+/=._\-]+$/.test(value)) {
      return value.slice(0, 4) + '…[REDACTED:' + value.length + 'c]';
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactValue(v);
      }
    }
    return out;
  }
  return value;
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    service: SERVICE,
    version: VERSION,
    message,
    ...(context ? (redactValue(context) as Record<string, unknown>) : {}),
  };

  const line = JSON.stringify(record);

  if (IS_PROD) {
    // Vercel 의 stdout/stderr 은 log drain 으로 포워딩됨
    if (level === 'error') process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
  } else {
    // dev: 색상 있는 한 줄 요약 + 컨텍스트
    const tag = { debug: '🔍', info: 'ℹ️ ', warn: '⚠️ ', error: '❌' }[level];
    const ctxStr = context && Object.keys(context).length ? ` ${JSON.stringify(redactValue(context))}` : '';
    // eslint-disable-next-line no-console
    console.log(`${tag} [${level}] ${message}${ctxStr}`);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
};

/**
 * 요청 ID 생성 — 분산 트레이싱용.
 * Vercel 의 `x-vercel-id` 또는 신규 uuid.
 */
export function requestId(headers?: Headers | Record<string, string | undefined>): string {
  const get = (k: string): string | undefined => {
    if (!headers) return undefined;
    if (headers instanceof Headers) return headers.get(k) ?? undefined;
    return headers[k];
  };
  return (
    get('x-request-id') ||
    get('x-vercel-id') ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))
  );
}
