/**
 * @task S3F12
 * @description 스킬 마켓 페이지 — Hero + 클라이언트 컴포넌트
 */
import { Suspense } from 'react';
import SkillsMarketPageInner from './page-client';
import { JsonLd, buildCollectionPage, buildBreadcrumb } from '@/components/seo/json-ld';

export const metadata = {
  title: 'Skills (스킬장터) — CoCoBot',
  description: '예약, 결제, 번역, 감정 분석 — 필요한 스킬을 골라 장착하세요. CoCoBot 스킬장터.',
};

export default function SkillsMarketPage() {
  return (
    <>
      {/* S8FE3 — JSON-LD */}
      <JsonLd data={buildCollectionPage({
        name: '스킬 장터',
        description: '예약, 결제, 번역, 감정 분석 — 23+ AI 챗봇 스킬 카탈로그',
        url: '/skills',
      })} />
      <JsonLd data={buildBreadcrumb([
        { name: '홈', url: '/' },
        { name: '스킬', url: '/skills' },
      ])} />
      {/* ── Hero (jobs 스타일 통일) ──────────────────────── */}
      <section
        className="relative overflow-hidden py-16 px-6 text-center"
        style={{ background: 'rgb(var(--bg-subtle))' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[80px]"
            style={{ background: 'rgb(var(--color-primary) / 0.1)' }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <h1
            className="mb-4"
            style={{
              color: 'rgb(var(--text-primary-rgb))',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: 'rgb(var(--color-primary))' }}>스킬장터</span>
          </h1>
          <p className="mb-8" style={{ color: 'rgb(var(--text-secondary-rgb))', fontSize: '1.125rem', lineHeight: 1.6 }}>
            필요한 스킬을 골라 코코봇에 장착하거나, 직접 만든 스킬을 공유하세요.<br />
            예약·결제·번역·감정 분석 등 23+ 스킬이 코코봇의 능력을 강화합니다.
          </p>

          {/* CTA 버튼 */}
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="#skills-grid"
              className="px-6 py-3 text-sm font-semibold rounded-full transition-all"
              style={{
                background: 'rgb(var(--color-primary))',
                color: 'rgb(var(--text-on-primary))',
              }}
            >
              🔍 스킬 둘러보기
            </a>
            <a
              href="/skills/register"
              className="px-6 py-3 text-sm font-semibold rounded-full transition-all"
              style={{
                background: 'transparent',
                color: 'rgb(var(--text-primary-rgb))',
                border: '1.5px solid rgb(var(--border))',
              }}
            >
              ⚡ 스킬 등록
            </a>
            <a
              href="/skills/my"
              className="px-6 py-3 text-sm font-semibold rounded-full transition-all"
              style={{
                background: 'transparent',
                color: 'rgb(var(--text-primary-rgb))',
                border: '1.5px solid rgb(var(--border))',
              }}
            >
              ⭐ 내 스킬
            </a>
          </div>
        </div>
      </section>

      {/* 클라이언트 컴포넌트 (필터·그리드·프리셋) */}
      <Suspense fallback={
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'rgb(var(--text-muted))' }}>
          스킬 목록을 불러오는 중...
        </div>
      }>
        <SkillsMarketPageInner />
      </Suspense>
    </>
  );
}
