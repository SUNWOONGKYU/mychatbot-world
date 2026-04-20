/**
 * @task S9BA6
 * @description PostHog 분석 래퍼 — graceful disable 패턴
 *
 * 환경변수 미설정 시 no-op. 배포 시 NEXT_PUBLIC_POSTHOG_KEY 설정하면 자동 활성화.
 * - 클라이언트: posthog-js (자동 ingest + autocapture)
 * - 서버: posthog-node 는 현재 미포함 (번들 증가 회피) — 필요 시 server wrapper 별도
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';
const ENABLED = Boolean(KEY);

let posthog: any = null;
let initPromise: Promise<any> | null = null;

async function getPosthog() {
  if (!ENABLED || typeof window === 'undefined') return null;
  if (posthog) return posthog;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const mod = await import('posthog-js');
      const client = mod.default ?? mod;
      client.init(KEY!, {
        api_host: HOST,
        capture_pageview: true,
        autocapture: true,
        persistence: 'localStorage+cookie',
        disable_session_recording: true,
        sanitize_properties: (props: Record<string, unknown>) => sanitize(props),
      });
      posthog = client;
      return client;
    } catch {
      return null;
    }
  })();
  return initPromise;
}

function sanitize(props: Record<string, unknown>): Record<string, unknown> {
  // PII 제거 — password/token/authorization 등
  const clone = { ...props };
  for (const k of Object.keys(clone)) {
    const lower = k.toLowerCase();
    if (
      lower.includes('password') ||
      lower.includes('token') ||
      lower.includes('authorization') ||
      lower.includes('cookie') ||
      lower.includes('secret') ||
      lower.includes('x-admin-key')
    ) {
      clone[k] = '[REDACTED]';
    }
  }
  return clone;
}

export type AnalyticsEvent =
  | 'signup_complete'
  | 'signup_started'
  | 'bot_created'
  | 'chat_first_message'
  | 'chat_message'
  | 'skill_installed'
  | 'payment_requested'
  | 'payment_completed'
  | 'payment_failed'
  | 'refund_requested'
  | 'onboarding_step';

export async function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  const client = await getPosthog();
  if (!client) return;
  try {
    client.capture(event, properties ? sanitize(properties) : undefined);
  } catch {
    // swallow — analytics 는 절대 앱을 깨면 안됨
  }
}

export async function identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
  const client = await getPosthog();
  if (!client) return;
  try {
    client.identify(userId, traits ? sanitize(traits) : undefined);
  } catch {}
}

export async function reset(): Promise<void> {
  const client = await getPosthog();
  if (!client) return;
  try {
    client.reset();
  } catch {}
}

export const analyticsEnabled = ENABLED;
