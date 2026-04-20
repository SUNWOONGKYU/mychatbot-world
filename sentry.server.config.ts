/**
 * @task S9BI1
 * @description Sentry 서버 초기화 — graceful skip if @sentry/nextjs not installed
 */

const tryInit = async () => {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    const { scrubPII } = await import('@/lib/observability/sentry');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      environment: process.env.VERCEL_ENV ?? 'development',
      tracesSampleRate: 0.1,
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
