// @task S9FE7 — /skills 전용 동적 OG 이미지
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '스킬 마켓 · CoCoBot World';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function SkillsOgImage() {
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
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 36,
            color: '#a5b4fc',
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
          스킬 마켓
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#c7d2fe',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          챗봇 기능을 확장하는 스킬을 찾아보세요
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 20,
            color: '#818cf8',
          }}
        >
          mychatbot.world/skills
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
