/**
 * @task S9BI1
 * @description Next.js 15 instrumentation hook — Sentry runtime 라우팅
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
