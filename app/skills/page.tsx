/**
 * @task S3F12
 * @description 스킬 마켓 페이지 — Hero + 클라이언트 컴포넌트
 */
import { Suspense } from 'react';
import SkillsMarketPageInner from './page-client';

export const metadata = {
  title: 'Skills (스킬장터) — My Chatbot World',
  description: '예약, 결제, 번역, 감정 분석 — 필요한 스킬을 골라 장착하세요. My Chatbot World 스킬장터.',
};

export default function SkillsMarketPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-bg"><div className="page-hero-orb" /></div>
        <div className="page-hero-content">
          <span className="page-hero-badge">STEP 3 — SKILLS</span>
          <h1 className="page-hero-title">
            <span className="accent">스킬</span>을 장착합니다
          </h1>
          <p className="page-hero-subtitle">
            예약, 결제, 번역, 감정 분석 — 필요한 스킬을 골라 장착하세요.<br />
            {/* 총 스킬 수는 클라이언트 컴포넌트에서 표시 */}
            23개 스킬로 챗봇의 능력을 강화하세요.
          </p>
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
