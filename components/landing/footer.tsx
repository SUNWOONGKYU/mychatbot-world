/**
 * @task S5FE3 - 랜딩 페이지 리디자인
 * @component LandingFooter
 * @description 랜딩 푸터 — ssalworks 스타일 (이용약관 + 회사정보 + 저작권)
 */

import Link from 'next/link';
import { BrandLogo } from '@/components/common/brand-logo';

export function LandingFooter() {
  return (
    <footer
      style={{
        background: 'var(--nav-bg)',
        borderTop: '1px solid rgb(var(--primary-500) / 0.30)',
        paddingTop: '44px',
        paddingBottom: '44px',
      }}
    >
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-center gap-4 text-center">
        {/* 브랜드 워드마크 (다크 배경 — #F8FAFC) */}
        <BrandLogo
          variant="wordmark"
          height={32}
          style={{ color: '#F8FAFC' }}
        />

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
            href="/refund"
            className="text-white transition-opacity hover:opacity-100"
            style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}
          >
            환불정책
          </Link>
          <Link
            href="/support"
            className="text-white transition-opacity hover:opacity-100"
            style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}
          >
            고객센터
          </Link>
        </div>

        {/* 저작권 */}
        <p style={{ fontSize: '11px', color: 'rgb(255 255 255 / 0.6)', margin: 0 }}>
          © 2026 CoCoBot. All rights reserved.
        </p>

        {/* 특허 출원 */}
        <p style={{ fontSize: '10px', color: 'rgb(255 255 255 / 0.45)', margin: 0, lineHeight: 1.6 }}>
          특허출원번호: 10-2026-0038658 | 멀티 페르소나와 감성·비용 조건 기반 멀티 AI 자동 라우팅을 구비한 AI 챗봇의 생성·학습·성장·수익활동·피상속으로 이어지는 라이프사이클 지원 시스템 및 방법
        </p>

        {/* 관리자 — 우측 하단 끝 */}
        <Link href="/admin" className="absolute right-0 bottom-0" style={{ fontSize: '9px', color: 'rgb(255 255 255 / 0.15)' }}>
          Admin
        </Link>
      </div>
    </footer>
  );
}
