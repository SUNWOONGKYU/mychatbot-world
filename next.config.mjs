// @task S4DV1 - 프로덕션 배포 최적화 (성능, SEO, PWA)
/** @type {import('next').NextConfig} */

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? (await import('@next/bundle-analyzer').then((m) => m.default({ enabled: true })))
    : (config) => config;

const nextConfig = {
  // .next 캐시를 로컬 디스크에 저장 (Google Drive 파일 쓰기 충돌 방지)
  distDir: process.env.NODE_ENV === 'development' ? 'C:/mcw-next-cache' : '.next',

  // App Router만 사용 (기존 pages/ 는 Vanilla JS)
  pageExtensions: ['tsx', 'ts'],

  // ── 성능 최적화 ──────────────────────────────────────────────
  compress: true,

  // ── 이미지 최적화 ─────────────────────────────────────────────
  images: {
    remotePatterns: [
      // Supabase Storage (프로젝트 도메인 패턴)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Google OAuth 프로필 이미지
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Kakao 프로필 이미지
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
      // GitHub 아바타 (개발/데모용)
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
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
    optimizeCss: false,
  },
  // SSG 비활성화 — 모든 페이지를 SSR로 처리 (useSearchParams 호환)
  // output: 'standalone', // Vercel은 자체 빌드 — standalone 불필요

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
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === 'development'
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' https: data: blob:",
              "font-src 'self' data: https://cdn.jsdelivr.net",
              "connect-src 'self' https:",
              "media-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join('; '),
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
    return [
      // /support → /customer-service (고객센터 공식 라우트)
      { source: '/support', destination: '/customer-service', permanent: false },
      { source: '/support/:path*', destination: '/customer-service', permanent: false },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
