/**
 * @task S9BI2
 * @description Core Web Vitals 수집 — 클라이언트 측 reporter
 *
 * 사용 (Next.js `app/layout.tsx` 또는 클라이언트 컴포넌트):
 *   import { initWebVitals } from '@/lib/report-vitals';
 *   useEffect(() => { initWebVitals(); }, []);
 *
 * 의존성 (선택): pnpm add web-vitals
 *   설치 안 돼 있으면 silent no-op.
 */

'use client';

type VitalMetric = {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType?: string;
};

async function sendBeacon(metric: VitalMetric): Promise<void> {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    url: typeof location !== 'undefined' ? location.pathname : undefined,
    nav: metric.navigationType,
  });

  try {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const ok = navigator.sendBeacon('/api/metrics', new Blob([body], { type: 'application/json' }));
      if (ok) return;
    }
    await fetch('/api/metrics', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    });
  } catch {
    // silent
  }
}

export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const mod = await import('web-vitals');
    mod.onCLS(sendBeacon);
    mod.onFCP(sendBeacon);
    mod.onLCP(sendBeacon);
    mod.onINP(sendBeacon);
    mod.onTTFB(sendBeacon);
  } catch {
    // web-vitals not installed — silent
  }
}
