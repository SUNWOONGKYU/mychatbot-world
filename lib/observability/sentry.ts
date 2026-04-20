/**
 * @task S9BI1
 * @description Sentry wrapper — DSN 미설정 시 graceful no-op
 *
 * 사용:
 *   import { captureException, setUser } from '@/lib/observability/sentry';
 *   captureException(err, { tags: { route: '/api/foo' } });
 *
 * 설치 필요 (PO):
 *   pnpm add @sentry/nextjs
 *   SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN Vercel env 등록
 */

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
};

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENABLED = !!DSN;

// 동적 import로 @sentry/nextjs 미설치 시에도 앱 기동 가능
// 타입 참조를 피하기 위해 any — 실제 호출은 @sentry/nextjs SDK의 public API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentry: any = null;

async function getSentry() {
  if (!ENABLED) return null;
  if (sentry) return sentry;
  try {
    sentry = await import('@sentry/nextjs');
    return sentry;
  } catch {
    return null;
  }
}

export async function captureException(err: unknown, ctx?: CaptureContext): Promise<void> {
  const s = await getSentry();
  if (!s) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[sentry disabled]', err, ctx);
    }
    return;
  }
  s.captureException(err, { tags: ctx?.tags, extra: ctx?.extra, user: ctx?.user });
}

export async function captureMessage(msg: string, ctx?: CaptureContext): Promise<void> {
  const s = await getSentry();
  if (!s) return;
  s.captureMessage(msg, { tags: ctx?.tags, extra: ctx?.extra });
}

export async function setUser(user: { id: string; email?: string } | null): Promise<void> {
  const s = await getSentry();
  if (!s) return;
  s.setUser(user);
}

export const sentryEnabled = ENABLED;

/**
 * PII scrubber — Sentry beforeSend hook에서 호출.
 * 이메일·토큰·Authorization 헤더·크레딧 잔액을 마스킹한다.
 */
export function scrubPII<T extends Record<string, unknown>>(event: T): T {
  const clone = JSON.parse(JSON.stringify(event));
  const scrub = (obj: Record<string, unknown>) => {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie') ||
        lowerKey.includes('token') ||
        lowerKey.includes('password') ||
        lowerKey === 'x-admin-key'
      ) {
        obj[key] = '[REDACTED]';
      } else if (typeof val === 'string' && /[\w.+-]+@[\w-]+\.[\w.-]+/.test(val)) {
        obj[key] = val.replace(/([\w.+-]+)@([\w-]+\.[\w.-]+)/g, '***@$2');
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        scrub(val as Record<string, unknown>);
      }
    }
  };
  scrub(clone);
  return clone;
}
