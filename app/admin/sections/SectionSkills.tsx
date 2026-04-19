// @task S5FE8
// @description 섹션6 — 스킬 관리 (목록/공식 등록/회원 스킬 검수)

'use client';

import React, { useState, useEffect } from 'react';
import { adminSectionStyles } from './SectionBots';

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  is_active?: boolean;
  is_official?: boolean;
  install_count?: number;
  created_at?: string;
  creator_name?: string;
  review_status?: 'approved' | 'pending' | 'rejected';
}

interface Props {
  adminKey: string;
  badgeCount?: number;
  onBadgeChange?: () => void;
}

// ── Mock ─────────────────────────────────────────────────────────────────────

function mockSkills(): Skill[] {
  return [
    { id: 'sk1', name: '고객응대 AI', description: '고객 문의 자동 분류 및 답변', category: '고객서비스', price: 0, is_active: true, is_official: true, install_count: 1243, created_at: '2026-01-10T09:00:00Z', creator_name: '공식', review_status: 'approved' },
    { id: 'sk2', name: '실시간 번역', description: '10개 언어 실시간 번역 지원', category: '언어', price: 9900, is_active: true, is_official: true, install_count: 890, created_at: '2026-01-15T10:00:00Z', creator_name: '공식', review_status: 'approved' },
    { id: 'sk3', name: '리포트 생성기', description: '대화 내용 바탕 리포트 자동 생성', category: '문서', price: 19900, is_active: true, is_official: false, install_count: 654, created_at: '2026-02-01T11:00:00Z', creator_name: '이개발', review_status: 'approved' },
    { id: 'sk4', name: '감정 분석 AI', description: '사용자 감정 상태 분석 및 응답 제안', category: '분석', price: 14900, is_active: true, is_official: false, install_count: 312, created_at: '2026-02-20T14:00:00Z', creator_name: '박감정', review_status: 'pending' },
    { id: 'sk5', name: '일정 관리 봇', description: '자연어로 일정 추가 및 관리', category: '생산성', price: 0, is_active: false, is_official: false, install_count: 78, created_at: '2026-03-05T09:30:00Z', creator_name: '최일정', review_status: 'pending' },
    { id: 'sk6', name: '스팸 필터', description: '욕설 및 스팸 메시지 자동 필터링', category: '보안', price: 0, is_active: true, is_official: false, install_count: 456, created_at: '2026-03-12T10:00:00Z', creator_name: '김보안', review_status: 'rejected' },
  ];
}

// ── 공식 스킬 등록 모달 ────────────────────────────────────────────────────────

function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}

function RegisterModal({ onClose, onRegister }: { onClose: () => void; onRegister: (s: Partial<Skill>) => void }) {
  useEscapeToClose(onClose);
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '0', prompt: '' });

  return (
    <div className="amodal-overlay" onClick={onClose}>
      <div className="amodal amodal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="amodal__header">
          <div className="amodal__title">⭐ 공식 스킬 등록</div>
          <button className="amodal__close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="aform-group">
            <label className="aform-label">스킬 이름 *</label>
            <input className="ainput" placeholder="예: 고객응대 AI" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="aform-group">
            <label className="aform-label">설명</label>
            <textarea className="atextarea" placeholder="스킬 설명..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="aform-group">
              <label className="aform-label">카테고리</label>
              <select className="aform-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">선택...</option>
                {['고객서비스', '언어', '문서', '분석', '생산성', '보안', '커머스', '기타'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="aform-group">
              <label className="aform-label">가격 (₩)</label>
              <input className="ainput" type="number" min="0" placeholder="0 = 무료" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div className="aform-group">
            <label className="aform-label">시스템 프롬프트</label>
            <textarea className="atextarea" style={{ minHeight: '120px' }} placeholder="이 스킬의 동작을 정의하는 프롬프트..." value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))} />
          </div>
        </div>

        <div className="amodal__footer">
          <button className="abtn abtn--secondary" onClick={onClose}>취소</button>
          <button className="abtn abtn--primary" onClick={() => onRegister({ ...form, price: Number(form.price), is_official: true })} disabled={!form.name.trim()}>⭐ 등록</button>
        </div>
      </div>
    </div>
  );
}

// ── 검수 모달 ─────────────────────────────────────────────────────────────────

function ReviewModal({ skill, onClose, onApprove, onReject }: {
  skill: Skill;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  useEscapeToClose(onClose);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div className="amodal-overlay" onClick={onClose}>
      <div className="amodal" onClick={(e) => e.stopPropagation()}>
        <div className="amodal__header">
          <div className="amodal__title">🔍 스킬 검수 — {skill.name}</div>
          <button className="amodal__close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {[
            { label: '제출자', value: skill.creator_name },
            { label: '카테고리', value: skill.category ?? '미분류' },
            { label: '가격', value: skill.price === 0 ? '무료' : `₩${(skill.price ?? 0).toLocaleString()}` },
            { label: '설명', value: skill.description ?? '없음' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: '1rem', fontSize: '.875rem' }}>
              <span style={{ minWidth: 70, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>

        {rejecting && (
          <div className="aform-group">
            <label className="aform-label">반려 사유 *</label>
            <textarea className="atextarea" placeholder="반려 사유를 입력해주세요. 제출자에게 전달됩니다." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}

        <div className="amodal__footer">
          <button className="abtn abtn--secondary" onClick={onClose}>취소</button>
          {rejecting ? (
            <>
              <button className="abtn abtn--ghost" onClick={() => setRejecting(false)}>뒤로</button>
              <button className="abtn abtn--danger" onClick={() => onReject(reason)} disabled={!reason.trim()}>반려 확정</button>
            </>
          ) : (
            <>
              <button className="abtn abtn--danger" onClick={() => setRejecting(true)}>✕ 반려</button>
              <button className="abtn abtn--primary" onClick={onApprove}>✓ 승인</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function SectionSkills({ adminKey, onBadgeChange }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showRegister, setShowRegister] = useState(false);
  const [reviewSkill, setReviewSkill] = useState<Skill | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/skills', { headers: { 'X-Admin-Key': adminKey } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const raw = d?.skills ?? mockSkills();
        setSkills(raw.map((s: Skill) => ({
          ...s,
          install_count: s.install_count ?? 0,
          is_official: s.is_official ?? false,
          review_status: s.review_status ?? 'approved',
          creator_name: s.creator_name ?? '공식',
        })));
      })
      .catch(() => setSkills(mockSkills()))
      .finally(() => setLoading(false));
  }, [adminKey]);

  const handleRegister = async (newSkill: Partial<Skill>) => {
    setShowRegister(false);
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ name: newSkill.name, description: newSkill.description, category: newSkill.category, price: newSkill.price }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json().catch(() => null);
      const record = (saved?.skill as Skill | undefined) ?? ({ id: `sk-${Date.now()}`, ...newSkill, install_count: 0, created_at: new Date().toISOString(), review_status: 'approved' } as Skill);
      setSkills((prev) => [record, ...prev]);
      showToast(`스킬 "${newSkill.name}"이(가) 공식 등록되었습니다.`);
    } catch (err) {
      showToast(`스킬 등록에 실패했습니다: ${(err as Error).message}`);
    }
  };

  const handleApprove = (skill: Skill) => {
    setSkills((prev) => prev.map((s) => s.id === skill.id ? { ...s, review_status: 'approved', is_active: true } : s));
    showToast(`스킬 "${skill.name}"이(가) 승인되었습니다.`);
    setReviewSkill(null);
    onBadgeChange?.();
  };

  const handleReject = (skill: Skill, reason: string) => {
    setSkills((prev) => prev.map((s) => s.id === skill.id ? { ...s, review_status: 'rejected' } : s));
    showToast(`스킬 "${skill.name}"이(가) 반려되었습니다. (사유: ${reason})`);
    setReviewSkill(null);
    onBadgeChange?.();
  };

  const handleDelete = async (skill: Skill) => {
    if (!confirm(`스킬 "${skill.name}"을(를) 삭제하시겠습니까?`)) return;
    const snapshot = skills;
    // 낙관적 업데이트
    setSkills((prev) => prev.filter((s) => s.id !== skill.id));
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ skillId: skill.id, mode: 'soft' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`스킬 "${skill.name}"이(가) 삭제되었습니다.`);
    } catch (err) {
      // 실패 시 롤백
      setSkills(snapshot);
      showToast(`스킬 삭제에 실패했습니다: ${(err as Error).message}`);
    }
  };

  const pendingCount = skills.filter((s) => s.review_status === 'pending').length;
  const categories = ['all', ...Array.from(new Set(skills.map((s) => s.category ?? '기타').filter(Boolean)))];

  const filtered = skills.filter((s) =>
    (!search || s.name.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === 'all' || s.category === catFilter) &&
    (activeTab === 'all' || s.review_status === 'pending'),
  );

  const getStatusBadge = (s: Skill) => {
    if (s.review_status === 'pending') return <span className="abadge abadge--amber">검수 대기</span>;
    if (s.review_status === 'rejected') return <span className="abadge abadge--red">반려</span>;
    if (!s.is_active) return <span className="abadge abadge--muted">비활성</span>;
    return <span className="abadge abadge--green">활성</span>;
  };

  if (loading) return <div className="admin-section"><div className="admin-spinner"><div className="admin-spinner__dot" /></div></div>;

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">🔧 스킬 관리</h2>
        <button className="abtn abtn--primary" onClick={() => setShowRegister(true)}>⭐ 공식 스킬 등록</button>
      </div>

      <div className="atabs">
        <button className={`atab${activeTab === 'all' ? ' atab--active' : ''}`} onClick={() => setActiveTab('all')}>전체 스킬 ({skills.length})</button>
        <button className={`atab${activeTab === 'pending' ? ' atab--active' : ''}`} onClick={() => setActiveTab('pending')}>
          검수 대기 {pendingCount > 0 && <span className="atab-badge">{pendingCount}</span>}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
        <div className="asearch">
          <span>🔍</span>
          <input placeholder="스킬 이름 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="aselect" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? '전체 카테고리' : c}</option>)}
        </select>
      </div>

      <div className="atable-wrap">
        {filtered.length === 0 ? (
          <div className="aempty"><span>🔧</span><span>조건에 맞는 스킬이 없습니다.</span></div>
        ) : (
          <table className="atable">
            <thead><tr>
              <th>스킬 이름</th><th>카테고리</th><th>제출자</th><th>설치 수</th><th>가격</th><th>상태</th><th>작업</th>
            </tr></thead>
            <tbody>
              {filtered.map((skill) => (
                <tr key={skill.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 600 }}>
                      {skill.name}
                      {skill.is_official && <span className="abadge abadge--amber" style={{ fontSize: '.7rem' }}>⭐ 공식</span>}
                    </div>
                    <div style={{ fontSize: '.75rem', opacity: .5, marginTop: 2 }}>
                      {skill.description ? skill.description.slice(0, 50) + (skill.description.length > 50 ? '...' : '') : ''}
                    </div>
                  </td>
                  <td><span className="abadge abadge--blue">{skill.category ?? '기타'}</span></td>
                  <td style={{ fontSize: '.875rem' }}>{skill.creator_name}</td>
                  <td>{(skill.install_count ?? 0).toLocaleString()}회</td>
                  <td style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {skill.price === 0 ? '무료' : `₩${(skill.price ?? 0).toLocaleString()}`}
                  </td>
                  <td>{getStatusBadge(skill)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      {skill.review_status === 'pending' && (
                        <button className="abtn abtn--warning" onClick={() => setReviewSkill(skill)}>🔍 검수</button>
                      )}
                      <button className="abtn abtn--danger" onClick={() => handleDelete(skill)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onRegister={handleRegister} />}
      {reviewSkill && (
        <ReviewModal
          skill={reviewSkill}
          onClose={() => setReviewSkill(null)}
          onApprove={() => handleApprove(reviewSkill)}
          onReject={(r) => handleReject(reviewSkill, r)}
        />
      )}
      {toast && <div className="atoast atoast--success">{toast}</div>}

      <style jsx global>{adminSectionStyles}</style>
    </section>
  );
}
