// @task S4DV1 - PWA 매니페스트
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My Chatbot World',
    short_name: 'MCW',
    description: 'AI 챗봇을 만들고 공유하는 플랫폼 — My Chatbot World',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    categories: ['utilities', 'lifestyle'],
    lang: 'ko',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '1280x720',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: '봇 만들기',
        short_name: '새 봇',
        description: '새로운 AI 챗봇을 만듭니다',
        url: '/bots/new',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: '마켓플레이스',
        short_name: '마켓',
        description: '다양한 AI 스킬을 탐색합니다',
        url: '/marketplace',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  };
}
