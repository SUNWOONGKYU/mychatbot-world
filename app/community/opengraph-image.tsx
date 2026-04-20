// @task S9FE7 — /community 전용 동적 OG 이미지
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '커뮤니티 · CoCoBot World';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function CommunityOgImage() {
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
          background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 36,
            color: '#fed7aa',
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
          커뮤니티
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#fed7aa',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          창작자들과 AI 챗봇 아이디어를 공유하세요
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 20,
            color: '#fdba74',
          }}
        >
          mychatbot.world/community
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
