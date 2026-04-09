// @task S5FE8
// @description 섹션7 — 구봇구직 관리 (공고 목록/부적절 처리/매칭현황/정산)

'use client';

import React, { useState } from 'react';
import { adminSectionStyles } from './SectionBots';

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface JobPosting {
  id: string;
  title: string;
  requester_name: string;
  category: string;
  budget: number;
  deadline: string;
  status: 'active' | 'hidden' | 'matched' | 'completed';
  applications: number;
  is_flagged: boolean;
}

interface MatchRecord {
  id: string;
  job_title: string;
  bot_name: string;
  owner_name: string;
  requester_name: string;
  deal_amount: number;
  commission_amount: number;
  settlement_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Props { adminKey: string; }

// ── Mock ─────────────────────────────────────────────────────────────────────

const MOCK_JOBS: JobPosting[] = [
  { id: 'j1', title: '시니어 고객응대봇 구함', requester_name: '홍사장', category: '고객서비스', budget: 50000, deadline: '2026-04-20', status: 'active', applications: 3, is_flagged: false },
  { id: 'j2', title: '영어권 판매봇 급구', requester_name: '김대표', category: '판매', budget: 120000, deadline: '2026-04-15', status: 'matched', applications: 7, is_flagged: false },
  { id: 'j3', title: '의심스러운 무료 봇 찾습니다', requester_name: '스패머', category: '기타', budget: 0, deadline: '2026-05-01', status: 'active', applications: 0, is_flagged: true },
  { id: 'j4', title: '교육봇 장기 운영', requester_name: '이원장', category: '교육', budget: 200000, deadline: '2026-04-30', status: 'active', applications: 5, is_flagged: false },
  { id: 'j5', title: '의료 상담봇 월정액', requester_name: '박원장', category: '의료', budget: 300000, deadline: '2026-04-25', status: 'completed', applications: 4, is_flagged: false },
];

const MOCK_MATCHES: MatchRecord[] = [
  { id: 'm1', job_title: '영어권 판매봇 급구', bot_name: '영어 판매 마스터', owner_name: '이개발', requester_name: '김대표', deal_amount: 120000, commission_amount: 24000, settlement_status: 'pending', created_at: '2026-04-05T14:00:00Z' },
  { id: 'm2', job_title: '의료 상담봇 월정액', bot_name: '헬스케어 AI', owner_name: '최의사', requester_name: '박원장', deal_amount: 300000, commission_amount: 60000, settlement_status: 'approved', created_at: '2026-03-25T10:00:00Z' },
  { id: 'm3', job_title: '요리봇 단기 계약', bot_name: '셰프 봇', owner_name: '김쉐프', requester_name: '식당주인', deal_amount: 80000, commission_amount: 16000, settlement_status: 'rejected', created_at: '2026-04-01T09:00:00Z' },
];

// ── 상수 ──────────────────────────────────────────────────────────────────────

const JOB_STATUS_LABEL: Record<JobPosting['status'], string> = { active: '모집 중', hidden: '숨김', matched: '매칭 완료', completed: '종료' };
const JOB_STATUS_BADGE: Record<JobPosting['status'], string> = { active: 'abadge--green', hidden: 'abadge--muted', matched: 'abadge--purple', completed: 'abadge--blue' };
const SETTLE_LABEL: Record<MatchRecord['settlement_status'], string> = { pending: '정산 대기', approved: '승인', rejected: '거부' };
const SETTLE_BADGE: Record<MatchRecord['settlement_status'], string> = { pending: 'abadge--amber', approved: 'abadge--green', rejected: 'abadge--red' };

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function SectionJobs({ adminKey: _ }: Props) {
  const [jobs, setJobs] = useState<JobPosting[]>(MOCK_JOBS);
  const [matches, setMatches] = useState<MatchRecord[]>(MOCK_MATCHES);
  const [activeTab, setActiveTab] = useState<'postings' | 'matches'>('postings');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const toggleHide = (job: JobPosting) => {
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: j.status === 'hidden' ? 'active' : 'hidden' } : j));
    showToast(`공고 "${job.title}"이(가) ${job.status === 'hidden' ? '복원' : '숨김'} 처리되었습니다.`);
  };

  const deleteJob = (job: JobPosting) => {
    if (!confirm(`공고 "${job.title}"을(를) 삭제하시겠습니까?`)) return;
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    showToast(`공고 "${job.title}"이(가) 삭제되었습니다.`);
  };

  const handleSettle = (match: MatchRecord, action: 'approved' | 'rejected') => {
    setMatches((prev) => prev.map((m) => m.id === match.id ? { ...m, settlement_status: action } : m));
    showToast(`"${match.job_title}" 정산이 ${action === 'approved' ? '승인' : '거부'}되었습니다.`);
  };

  const flagged = jobs.filter((j) => j.is_flagged);
  const pending = matches.filter((m) => m.settlement_status === 'pending');
  const pendingAmt = pending.reduce((a, m) => a + m.commission_amount, 0);

  const filteredJobs = jobs.filter((j) =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.requester_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">💼 구봇구직 관리</h2>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {flagged.length > 0 && <span className="abadge abadge--red">🚨 부적절 {flagged.length}건</span>}
          {pending.length > 0 && <span className="abadge abadge--amber">💰 정산 대기 {pending.length}건</span>}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="s7-stats">
        {[
          { label: '모집 중 공고', value: jobs.filter((j) => j.status === 'active').length, cls: '' },
          { label: '부적절 신고', value: flagged.length, cls: 's7-card--red' },
          { label: '완료 매칭', value: matches.filter((m) => m.settlement_status === 'approved').length, cls: 's7-card--green' },
          { label: '정산 대기 금액', value: `₩${pendingAmt.toLocaleString()}`, cls: 's7-card--amber' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`s7-card ${cls}`}>
            <div className="s7-card__val">{value}</div>
            <div className="s7-card__lbl">{label}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="atabs">
        <button className={`atab${activeTab === 'postings' ? ' atab--active' : ''}`} onClick={() => setActiveTab('postings')}>
          공고 목록 {flagged.length > 0 && <span className="atab-badge">{flagged.length}</span>}
        </button>
        <button className={`atab${activeTab === 'matches' ? ' atab--active' : ''}`} onClick={() => setActiveTab('matches')}>
          매칭/정산 현황 {pending.length > 0 && <span className="atab-badge">{pending.length}</span>}
        </button>
      </div>

      {activeTab === 'postings' ? (
        <>
          <div className="asearch" style={{ maxWidth: 360 }}>
            <span>🔍</span>
            <input placeholder="공고명, 의뢰인 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="atable-wrap">
            <table className="atable">
              <thead><tr><th>공고명</th><th>의뢰인</th><th>카테고리</th><th>예산</th><th>마감일</th><th>지원</th><th>상태</th><th>작업</th></tr></thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 600 }}>
                        {job.title}
                        {job.is_flagged && <span className="abadge abadge--red">🚨</span>}
                      </div>
                    </td>
                    <td>{job.requester_name}</td>
                    <td><span className="abadge abadge--blue">{job.category}</span></td>
                    <td style={{ color: '#fbbf24', fontWeight: 600 }}>{job.budget === 0 ? '무료' : `₩${job.budget.toLocaleString()}`}</td>
                    <td style={{ opacity: .6, fontSize: '.8125rem' }}>{new Date(job.deadline).toLocaleDateString('ko-KR')}</td>
                    <td>{job.applications}명</td>
                    <td><span className={`abadge ${JOB_STATUS_BADGE[job.status]}`}>{JOB_STATUS_LABEL[job.status]}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button
                          className={`abtn ${job.status === 'hidden' ? 'abtn--secondary' : 'abtn--warning'}`}
                          onClick={() => toggleHide(job)}
                          disabled={job.status === 'matched' || job.status === 'completed'}
                        >
                          {job.status === 'hidden' ? '👁️ 복원' : '🚫 숨김'}
                        </button>
                        <button className="abtn abtn--danger" onClick={() => deleteJob(job)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th>공고명</th><th>봇 이름</th><th>봇 소유자</th><th>의뢰인</th><th>계약금</th><th>수수료(20%)</th><th>정산 상태</th><th>작업</th></tr></thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.job_title}</td>
                  <td>{m.bot_name}</td>
                  <td style={{ opacity: .8 }}>{m.owner_name}</td>
                  <td style={{ opacity: .8 }}>{m.requester_name}</td>
                  <td style={{ color: '#fbbf24', fontWeight: 600 }}>₩{m.deal_amount.toLocaleString()}</td>
                  <td style={{ color: '#34d399', fontWeight: 700 }}>₩{m.commission_amount.toLocaleString()}</td>
                  <td><span className={`abadge ${SETTLE_BADGE[m.settlement_status]}`}>{SETTLE_LABEL[m.settlement_status]}</span></td>
                  <td>
                    {m.settlement_status === 'pending' && (
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button className="abtn abtn--primary" onClick={() => handleSettle(m, 'approved')}>✓ 승인</button>
                        <button className="abtn abtn--danger" onClick={() => handleSettle(m, 'rejected')}>✕ 거부</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className="atoast atoast--success">{toast}</div>}

      <style jsx global>{`
        ${adminSectionStyles}
        .s7-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
        .s7-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 1rem; text-align: center; }
        .s7-card--red   { border-color: rgba(248,113,113,.3); }
        .s7-card--green { border-color: rgba(52,211,153,.3); }
        .s7-card--amber { border-color: rgba(251,191,36,.3); }
        .s7-card__val { font-size: 1.5rem; font-weight: 700; color: #e2e8f0; }
        .s7-card--red .s7-card__val   { color: #f87171; }
        .s7-card--green .s7-card__val { color: #34d399; }
        .s7-card--amber .s7-card__val { color: #fbbf24; }
        .s7-card__lbl { font-size: .75rem; color: rgba(255,255,255,.4); margin-top: .25rem; }
        @media (max-width:768px) { .s7-stats { grid-template-columns: repeat(2,1fr); } }
      `}</style>
    </section>
  );
}
