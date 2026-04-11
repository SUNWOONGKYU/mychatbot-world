// @task S5FE10 - OG Image (Next.js ImageResponse)
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'My Chatbot World — AI 챗봇 플랫폼';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 로고 아이콘 */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            fontWeight: 700,
            color: 'white',
            marginBottom: 32,
          }}
        >
          M
        </div>

        {/* 서비스명 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: 'white',
            marginBottom: 16,
            letterSpacing: -1,
          }}
        >
          My Chatbot World
        </div>

        {/* 설명 */}
        <div
          style={{
            fontSize: 28,
            color: '#a5b4fc',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          AI 챗봇을 만들고 공유하는 플랫폼
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 20,
            color: '#6366f1',
          }}
        >
          mychatbot.world
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
