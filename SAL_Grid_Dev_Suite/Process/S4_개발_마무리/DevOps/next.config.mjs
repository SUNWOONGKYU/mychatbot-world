// @task S4DV1 - 프로덕션 배포 최적화 (성능, SEO, PWA)
/** @type {import('next').NextConfig} */

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? (await import('@next/bundle-analyzer').then((m) => m.default({ enabled: true })))
    : (config) => config;

const nextConfig = {
  // .next 캐시를 로컬 디스크에 저장 (Google Drive 파일 쓰기 충돌 방지)
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // App Router만 사용 (기존 pages/ 는 Vanilla JS)
  pageExtensions: ['tsx', 'ts'],

  // ── 성능 최적화 ──────────────────────────────────────────────
  compress: true,

  // ── 이미지 최적화 ─────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // 이미지 포맷 최적화
    formats: ['image/avif', 'image/webp'],
    // 디바이스별 사이즈 최적화
    deviceSizes: [375, 390, 768, 1024, 1280, 1440],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },

  // ── 실험적 최적화 ─────────────────────────────────────────────
  experimental: {
    // CSS 최적화
    optimizeCss: true,
  },

  // ── 필수 환경 변수 명시 ───────────────────────────────────────
  env: {
    // 빌드 시 존재해야 하는 환경 변수 (선언만, 값은 .env에서)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://mychatbot-world.vercel.app',
  },

  // ── 보안 헤더 ─────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // 정적 자원 캐싱 헤더
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Service Worker
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  // ── 리다이렉트 ────────────────────────────────────────────────
  async redirects() {
    return [];
  },
};

export default withBundleAnalyzer(nextConfig);
