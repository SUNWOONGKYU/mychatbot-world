/**
 * @task S8FE3
 * @description 동적 OG 이미지 생성 엔드포인트
 *
 * GET /og?title=...&subtitle=...
 *   → 1200×630 PNG (Next.js ImageResponse, Edge 런타임)
 *
 * 사용:
 *   const ogUrl = `/og?title=${encodeURIComponent('My Bot')}`;
 *   export const metadata = { openGraph: { images: [ogUrl] } };
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const contentType = 'image/png';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') ?? 'CoCoBot World').slice(0, 120);
  const subtitle = (searchParams.get('subtitle') ?? 'AI 챗봇 제작·공유 플랫폼').slice(0, 200);
  const badge = searchParams.get('badge') ?? 'mychatbot.world';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            🤖
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.5px' }}>
            CoCoBot World
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: '1000px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '32px',
              color: '#cbd5e1',
              lineHeight: 1.4,
              maxWidth: '1000px',
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#94a3b8',
            fontSize: '24px',
          }}
        >
          <div>{badge}</div>
          <div style={{ fontWeight: 700, color: '#c4b5fd' }}>AI · 코코봇 · 수익화</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
