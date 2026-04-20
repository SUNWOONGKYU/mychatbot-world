/**
 * @task S9BI1
 * @description Sentry 클라이언트 초기화 — graceful skip if @sentry/nextjs not installed
 */

const tryInit = async () => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    const { scrubPII } = await import('@/lib/observability/sentry');
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeSend(event: any): any {
        return scrubPII(event as Record<string, unknown>);
      },
    });
  } catch {
    // @sentry/nextjs not installed — silent
  }
};

void tryInit();

export {};
