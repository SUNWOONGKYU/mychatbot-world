/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component LandingFooter
 * @description 랜딩 푸터 — ssalworks 스타일 (이용약관 + 회사정보 + 저작권)
 */

import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer
      style={{
        background: 'linear-gradient(135deg, rgb(var(--primary-900)), rgb(var(--primary-950, 10 4 60)))',
        paddingTop: '44px',
        paddingBottom: '44px',
      }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-center gap-4 text-center">
        {/* 법적 링크 */}
        <div className="flex items-center gap-8">
          <Link
            href="/terms"
            className="text-white transition-opacity hover:opacity-100"
            style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="text-white transition-opacity hover:opacity-100"
            style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}
          >
            개인정보처리방침
          </Link>
          <Link
            href="/customer-service"
            className="text-white transition-opacity hover:opacity-100"
            style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}
          >
            고객센터
          </Link>
        </div>

        {/* 저작권 */}
        <p style={{ fontSize: '11px', color: 'rgb(255 255 255 / 0.6)', margin: 0 }}>
          © 2026 My Chatbot World. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
