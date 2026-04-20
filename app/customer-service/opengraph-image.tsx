// @task S9FE7 — /customer-service 전용 동적 OG 이미지
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '고객 지원 · CoCoBot World';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function SupportOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 36,
            color: '#a7f3d0',
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          CoCoBot World
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            marginBottom: 20,
            letterSpacing: -2,
          }}
        >
          고객 지원
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#bbf7d0',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          문의·환불·기술 지원을 24시간 내에 답변드립니다
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 20,
            color: '#6ee7b7',
          }}
        >
          mychatbot.world/customer-service
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
