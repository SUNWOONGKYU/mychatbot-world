/**
 * @task S9BI2
 * @description POST /api/metrics — Core Web Vitals 수집
 *
 * 클라이언트 `lib/report-vitals.ts`가 페이지 이탈 시 beacon으로 전송.
 * 서버 측에서는 (1) Sentry custom metric, (2) 콘솔 로그(개발),
 * (3) Axiom 구조화 로그(S9BI3 설정 시)로 기록.
 *
 * 요청 바디:
 *   { name, value, rating, id, label, url, nav }
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { captureMessage } from '@/lib/observability/sentry';

interface WebVitalPayload {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  label?: string;
  url?: string;
  nav?: string;
}

// 10% 샘플링 (서버 부하 감소)
const SAMPLE_RATE = 0.1;

export async function POST(req: NextRequest): Promise<Response> {
  let body: WebVitalPayload | null = null;
  try {
    body = (await req.json()) as WebVitalPayload;
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body?.name || typeof body.value !== 'number') {
    return Response.json({ error: 'missing fields' }, { status: 400 });
  }

  // 서버측 샘플링
  if (Math.random() > SAMPLE_RATE) {
    return new Response(null, { status: 204 });
  }

  // 구조화 로그 (Vercel→Axiom 드레인 시 자동 수집)
  console.log(
    JSON.stringify({
      type: 'web_vital',
      metric: body.name,
      value: body.value,
      rating: body.rating,
      url: body.url,
      nav: body.nav,
      ts: new Date().toISOString(),
    }),
  );

  // Sentry에 custom metric 태그로 기록 (선택)
  if (body.rating === 'poor') {
    void captureMessage(`poor web-vital: ${body.name}=${body.value.toFixed(0)}`, {
      tags: { metric: body.name, rating: body.rating },
      extra: { url: body.url, id: body.id },
    });
  }

  return new Response(null, { status: 204 });
}
