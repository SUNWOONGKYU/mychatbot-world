/**
 * @task S3F12
 * @description 스킬 상세 페이지 — Vanilla detail.html 완전 이식
 * - 헤더 카드: 이모지 아이콘, 이름, 카테고리, 설명, 별점, 설치수
 * - 가격 + 설치/제거 버튼
 * - 상세 정보: 시스템 프롬프트 미리보기 (설치 후 공개)
 * - 정보 표 (카테고리, 버전, 설치수, 평점)
 * - 리뷰 탭
 * Route: /skills/[id]
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchSkillsFromAPI, buildStars, type SkillItem } from '@/lib/skills-data';
import { useSkillsStore } from '@/lib/use-skills-store';

// ── Toast (로컬) ──────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState('');
  const [vis, setVis] = useState(false);
  const show = useCallback((m: string) => {
    setMsg(m); setVis(true);
    setTimeout(() => setVis(false), 3000);
  }, []);
  return { vis, msg, show };
}

// ── 더미 리뷰 ────────────────────────────────────────────────────
const DUMMY_REVIEWS = [
  { id: '1', userName: '김민준', rating: 5, comment: '정말 유용합니다! 코코봇 운영이 훨씬 편해졌어요.', date: '2025-12-01' },
  { id: '2', userName: '이서연', rating: 4, comment: '설치가 간단하고 동작이 잘 됩니다. 추천해요.', date: '2025-11-28' },
  { id: '3', userName: '박지현', rating: 5, comment: '고객 응대 품질이 확실히 올라갔습니다.', date: '2025-11-15' },
];

// ── 별점 컴포넌트 ─────────────────────────────────────────────────
function StarDisplay({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? '1.25rem' : size === 'sm' ? '0.75rem' : '0.875rem';
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: sz, color: i < Math.round(rating) ? '#fbbf24' : 'rgb(var(--text-muted))' }}>★</span>
      ))}
    </span>
  );
}

// ── 리뷰 카드 ─────────────────────────────────────────────────────
function ReviewCard({ review }: { review: typeof DUMMY_REVIEWS[0] }) {
  return (
    <div style={{
      border: '1px solid rgb(var(--border))',
      borderRadius: '0.75rem',
      padding: '1rem',
      background: 'rgb(var(--bg-surface-hover) / 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '50%',
            background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#34d399', fontWeight: 700, fontSize: '0.875rem',
          }}>
            {review.userName[0]}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{review.userName}</span>
        </div>
        <StarDisplay rating={review.rating} size="sm" />
      </div>
      <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary-rgb))', lineHeight: 1.6 }}>{review.comment}</p>
      <p style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.5rem' }}>
        {new Date(review.date).toLocaleDateString('ko-KR')}
      </p>
    </div>
  );
}

// ── 구매 확인 모달 ────────────────────────────────────────────────
function PurchaseModal({ skill, onConfirm, onCancel }: { skill: SkillItem; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="modalTitle"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      className="sk-modal-overlay"
    >
      <div className="sk-modal">
        <div className="sk-modal-icon">{skill.icon}</div>
        <h3 className="sk-modal-title" id="modalTitle">스킬 구매</h3>
        <p className="sk-modal-name">{skill.name}</p>
        <p className="sk-modal-price">₩{(skill.price ?? 0).toLocaleString()}</p>
        <p className="sk-modal-note">실제 포인트 차감 없이 체험합니다.</p>
        <div className="sk-modal-actions">
          <button className="sk-modal-btn sk-modal-btn--cancel" onClick={onCancel}>취소</button>
          <button className="sk-modal-btn sk-modal-btn--confirm" onClick={onConfirm} autoFocus>구매 체험</button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const skillId = params?.id ?? '';

  const { isInstalled, install, remove } = useSkillsStore();
  const { vis: toastVis, msg: toastMsg, show: showToast } = useToast();

  const [skill, setSkill] = useState<SkillItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    fetchSkillsFromAPI().then(skills => {
      setSkill(skills.find(s => s.id === skillId) ?? null);
    });
  }, [skillId]);

  const installed = skill ? isInstalled(skill.id) : false;

  const handleInstall = useCallback(() => {
    if (!skill) return;
    if (!skill.isFree) { setShowPurchase(true); return; }
    install(skill.id);
    showToast(`"${skill.name}" 스킬을 설치했습니다!`);
  }, [skill, install, showToast]);

  const handleRemove = useCallback(() => {
    if (!skill) return;
    remove(skill.id);
    showToast(`"${skill.name}" 스킬을 제거했습니다.`);
  }, [skill, remove, showToast]);

  const handlePurchaseConfirm = useCallback(() => {
    if (!skill) return;
    install(skill.id);
    showToast(`"${skill.name}" 구매 완료! 스킬이 설치되었습니다.`);
    setShowPurchase(false);
  }, [skill, install, showToast]);

  // 로딩 / 없음
  if (!skill) {
    return (
      <main style={{ padding: '5rem 0 4rem' }}>
        <div className="container">
          <div className="sk-detail-skeleton">
            <div className="sk-skeleton-header" />
            <div className="sk-skeleton-body" />
          </div>
        </div>
      </main>
    );
  }

  const stars = buildStars(skill.rating);
  const reviews = DUMMY_REVIEWS.slice(0, 3);

  return (
    <>
      {/* 뒤로가기 */}
      <div className="sk-back-bar">
        <div className="container">
          <Link href="/skills" className="sk-back-link">
            ← 스킬 마켓으로
          </Link>
        </div>
      </div>

      <main className="sk-detail-main">
        <div className="container">
          <div className="sk-detail-content">

            {/* ── 헤더 카드 ── */}
            <div style={{ background: 'rgb(var(--bg-surface-hover) / 0.5)', border: '1px solid rgb(var(--border))', borderRadius: '1rem', padding: '1.5rem' }}>
              <div className="sk-detail-header">
                {/* 아이콘 */}
                <div className="sk-detail-icon">{skill.icon}</div>

                {/* 정보 */}
                <div className="sk-detail-header-info">
                  <span className="sk-detail-cat">{skill.category}</span>
                  <h1 className="sk-detail-title">{skill.name}</h1>
                  <p className="sk-detail-desc">{skill.description}</p>
                  <div className="sk-detail-meta">
                    <span className="sk-stars">{stars}</span>
                    <span className="sk-rating-num">{skill.rating.toFixed(1)}</span>
                    <span className="sk-detail-sep">·</span>
                    <span>{skill.installs.toLocaleString()}회 설치</span>
                  </div>
                </div>

                {/* 액션 */}
                <div className="sk-detail-action">
                  <span className={`sk-detail-price${skill.isFree ? ' free' : ' paid'}`}>
                    {skill.isFree ? '무료' : `₩${(skill.price ?? 0).toLocaleString()}`}
                  </span>
                  {installed ? (
                    <button
                      className="sk-detail-btn sk-detail-btn--remove"
                      onClick={handleRemove}
                    >
                      제거하기
                    </button>
                  ) : (
                    <button
                      className="sk-detail-btn sk-detail-btn--install"
                      onClick={handleInstall}
                    >
                      {skill.isFree ? '설치하기' : '구매 및 설치'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── 탭 ── */}
            <div style={{ borderBottom: '1px solid rgb(var(--border))', display: 'flex', gap: '0.25rem' }}>
              {(['overview', 'reviews'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.625rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab ? '#10b981' : 'transparent'}`,
                    marginBottom: '-1px',
                    color: activeTab === tab ? '#34d399' : 'rgb(var(--text-muted))',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'overview' ? '개요' : `리뷰 (${reviews.length})`}
                </button>
              ))}
            </div>

            {/* ── 개요 탭 ── */}
            {activeTab === 'overview' && (
              <div className="sk-detail-section">
                <h2 className="sk-detail-section-title">스킬 소개</h2>
                <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary-rgb))', lineHeight: 1.7 }}>
                  {skill.description}
                </p>

                {/* 시스템 프롬프트 (설치 후 공개) */}
                <h2 className="sk-detail-section-title" style={{ marginTop: '1rem' }}>시스템 프롬프트 미리보기</h2>
                <p className="sk-detail-prompt-note">
                  {installed ? '설치된 스킬의 프롬프트입니다.' : '설치 후 전체 프롬프트가 공개됩니다.'}
                </p>
                {installed ? (
                  <blockquote className="sk-detail-prompt">
                    {skill.systemPrompt}
                  </blockquote>
                ) : (
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderLeft: '3px solid rgba(16,185,129,0.3)',
                    borderRadius: '0.25rem 0.75rem 0.75rem 0.25rem',
                    filter: 'blur(3px)',
                    userSelect: 'none',
                    fontSize: '0.875rem',
                    color: 'rgb(var(--text-secondary-rgb))',
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                  }}>
                    {skill.systemPrompt.slice(0, 60)}...
                  </div>
                )}

                {/* 정보 표 */}
                <h2 className="sk-detail-section-title" style={{ marginTop: '1rem' }}>상세 정보</h2>
                <dl className="sk-detail-dl">
                  <div className="sk-detail-dl-row">
                    <dt>카테고리</dt>
                    <dd>{skill.category}</dd>
                  </div>
                  <div className="sk-detail-dl-row">
                    <dt>버전</dt>
                    <dd>v1.0.0</dd>
                  </div>
                  <div className="sk-detail-dl-row">
                    <dt>설치수</dt>
                    <dd>{skill.installs.toLocaleString()}회</dd>
                  </div>
                  <div className="sk-detail-dl-row">
                    <dt>평점</dt>
                    <dd>{skill.rating.toFixed(1)} / 5.0</dd>
                  </div>
                  <div className="sk-detail-dl-row">
                    <dt>가격</dt>
                    <dd>{skill.isFree ? '무료' : `₩${(skill.price ?? 0).toLocaleString()}`}</dd>
                  </div>
                  <div className="sk-detail-dl-row">
                    <dt>상태</dt>
                    <dd style={{ color: installed ? '#34d399' : 'rgb(var(--text-secondary-rgb))' }}>
                      {installed ? '설치됨' : '미설치'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* ── 리뷰 탭 ── */}
            {activeTab === 'reviews' && (
              <div className="sk-detail-section">
                {/* 평점 요약 */}
                <div style={{
                  padding: '1.25rem',
                  background: 'rgb(var(--bg-surface-hover) / 0.3)',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                      {skill.rating.toFixed(1)}
                    </p>
                    <StarDisplay rating={skill.rating} size="lg" />
                    <p style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                      {reviews.length}개 리뷰
                    </p>
                  </div>
                </div>

                {/* 리뷰 목록 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* 구매 모달 */}
      {showPurchase && (
        <PurchaseModal
          skill={skill}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setShowPurchase(false)}
        />
      )}

      {/* Toast */}
      {toastVis && (
        <div className="sk-toast" role="alert" aria-live="assertive">
          {toastMsg}
        </div>
      )}
    </>
  );
}
