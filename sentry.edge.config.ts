/**
 * @task S9BI1
 * @description Sentry Edge runtime 초기화 — graceful skip if @sentry/nextjs not installed
 */

const tryInit = async () => {
  if (!process.env.SENTRY_DSN) return;
  try {
    // @ts-expect-error 옵셔널 의존성 — 런타임에만 존재
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      environment: process.env.VERCEL_ENV ?? 'development',
      tracesSampleRate: 0.1,
    });
  } catch {
    // silent
  }
};

void tryInit();

export {};
