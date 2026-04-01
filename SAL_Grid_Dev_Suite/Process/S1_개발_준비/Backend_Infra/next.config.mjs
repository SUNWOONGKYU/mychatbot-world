// @task S1BI1 - Next.js 프로젝트 초기화 + Tailwind CSS 설정
/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router 기본 설정
  experimental: {
    // 점진적 전환: 기존 Vanilla HTML 파일과 공존
    turbo: {},
  },
  // 기존 Vanilla 파일이 있는 pages/ 디렉토리 충돌 방지
  // (기존 pages/는 Vanilla JS 파일을 담고 있으므로 Next.js pages router 비활성화)
  // App Router만 사용
  pageExtensions: ['tsx', 'ts'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
