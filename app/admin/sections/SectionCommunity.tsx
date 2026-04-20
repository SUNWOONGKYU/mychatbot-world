// @task S5FE8
// @description 섹션8 — 커뮤니티 관리 (신고 처리/강제 삭제/경고 발송/마당 관리)

'use client';

import React, { useState } from 'react';
import { adminSectionStyles } from './SectionBots';

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface ReportedContent {
  id: string;
  type: 'post' | 'comment';
  title?: string;
  content: string;
  author_name: string;
  author_email?: string;
  report_count: number;
  report_reason: string;
  status: 'pending' | 'deleted' | 'dismissed';
  created_at: string;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  post_count: number;
  is_active: boolean;
  order: number;
}

interface Props {
  adminKey: string;
  badgeCount?: number;
  onBadgeChange?: () => void;
}

// ── Mock ─────────────────────────────────────────────────────────────────────

const MOCK_REPORTS: ReportedContent[] = [
  { id: 'r1', type: 'post', title: '스팸 홍보글', content: '엄청난 수익 보장! 지금 바로 가입하세요...', author_name: '스패머1', author_email: 'spam1@ex.com', report_count: 12, report_reason: '스팸/광고', status: 'pending', created_at: '2026-04-05T10:00:00Z', category: '인기글' },
  { id: 'r2', type: 'comment', content: '이 봇 완전 사기야 쓰레기!!', author_name: '악플러', author_email: 'bad@ex.com', report_count: 5, report_reason: '욕설/비방', status: 'pending', created_at: '2026-04-06T11:00:00Z', category: '노하우' },
  { id: 'r3', type: 'post', title: '성인 콘텐츠 게시글', content: '19+ 내용이 포함된 게시글입니다...', author_name: '위반자', author_email: 'violator@ex.com', report_count: 8, report_reason: '불법/부적절 콘텐츠', status: 'deleted', created_at: '2026-04-04T09:00:00Z', category: '성공사례' },
  { id: 'r4', type: 'comment', content: '이 글 너무 도움됐어요 ㅠㅠ 감사합니다!', author_name: '일반회원', author_email: 'user@ex.com', report_count: 1, report_reason: '도배', status: 'dismissed', created_at: '2026-04-03T15:00:00Z', category: 'Q&A' },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: '인기글', icon: '🔥', post_count: 234, is_active: true, order: 1 },
  { id: 'cat2', name: '최신글', icon: '🆕', post_count: 1028, is_active: true, order: 2 },
  { id: 'cat3', name: '노하우', icon: '📚', post_count: 567, is_active: true, order: 3 },
  { id: 'cat4', name: '성공사례', icon: '🏆', post_count: 189, is_active: true, order: 4 },
  { id: 'cat5', name: '협업요청', icon: '🤝', post_count: 84, is_active: true, order: 5 },
  { id: 'cat6', name: 'Q&A', icon: '❓', post_count: 412, is_active: true, order: 6 },
  { id: 'cat7', name: '비공개마당', icon: '🔒', post_count: 0, is_active: false, order: 7 },
];

// ── 삭제 모달 ─────────────────────────────────────────────────────────────────

function DeleteModal({ item, onClose, onConfirm }: {
  item: ReportedContent;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="amodal-overlay" onClick={onClose} role="presentation" aria-hidden="true">
      <div className="amodal" onClick={(e) => e.stopPropagation()} role="presentation">
        <div className="amodal__header">
          <div className="amodal__title">🗑️ 강제 삭제 — {item.type === 'post' ? '게시글' : '댓글'}</div>
          <button className="amodal__close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 10, padding: '1rem', fontSize: '.875rem', color: 'rgba(255,255,255,.7)' }}>
          <strong style={{ color: '#f87171' }}>삭제 대상:</strong>
          <p style={{ margin: '.5rem 0 0', lineHeight: 1.6 }}>
            {item.title && <><strong>{item.title}</strong><br /></>}
            {item.content.slice(0, 100)}{item.content.length > 100 ? '...' : ''}
          </p>
          <p style={{ margin: '.5rem 0 0', opacity: .6 }}>작성자: {item.author_name}</p>
        </div>

        <div className="aform-group">
          <label className="aform-label">삭제 사유 * (작성자에게 알림 전송)</label>
          <textarea className="atextarea" placeholder="삭제 사유를 입력하세요. 작성자에게 전달됩니다." value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="amodal__footer">
          <button className="abtn abtn--secondary" onClick={onClose}>취소</button>
          <button className="abtn abtn--danger" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>강제 삭제</button>
        </div>
      </div>
    </div>
  );
}

// ── 경고 발송 모달 ────────────────────────────────────────────────────────────

function WarnModal({ item, onClose, onConfirm }: {
  item: ReportedContent;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="amodal-overlay" onClick={onClose} role="presentation" aria-hidden="true">
      <div className="amodal" onClick={(e) => e.stopPropagation()} role="presentation">
        <div className="amodal__header">
          <div className="amodal__title">⚠️ 경고 발송 — {item.author_name}</div>
          <button className="amodal__close" onClick={onClose}>✕</button>
        </div>

        <div className="aform-group">
          <label className="aform-label">경고 사유 *</label>
          <textarea className="atextarea" placeholder="경고 사유를 입력하세요." value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="amodal__footer">
          <button className="abtn abtn--secondary" onClick={onClose}>취소</button>
          <button className="abtn abtn--warning" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>⚠️ 경고 발송</button>
        </div>
      </div>
    </div>
  );
}

// ── 카테고리(마당) 관리 ────────────────────────────────────────────────────────

function CategoryManager({ cats, onUpdate }: { cats: Category[]; onUpdate: (cats: Category[]) => void }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon: '💬' });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleToggle = (cat: Category) => {
    onUpdate(cats.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
    showToast(`마당 "${cat.name}"이(가) ${cat.is_active ? '비활성화' : '활성화'}되었습니다.`);
  };

  const handleDelete = (cat: Category) => {
    if (!confirm(`마당 "${cat.name}"을(를) 삭제하시겠습니까?`)) return;
    onUpdate(cats.filter((c) => c.id !== cat.id));
    showToast(`마당 "${cat.name}"이(가) 삭제되었습니다.`);
  };

  const handleAdd = () => {
    if (!newCat.name.trim()) return;
    onUpdate([...cats, { id: `cat-${Date.now()}`, name: newCat.name, icon: newCat.icon, post_count: 0, is_active: true, order: cats.length + 1 }]);
    showToast(`마당 "${newCat.name}"이(가) 추가되었습니다.`);
    setNewCat({ name: '', icon: '💬' });
    setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>마당(카테고리) 목록</h3>
        <button className="abtn abtn--primary" onClick={() => setShowAdd(true)}>+ 마당 추가</button>
      </div>

      {showAdd && (
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="ainput" style={{ width: 60 }} placeholder="🎯" value={newCat.icon} onChange={(e) => setNewCat((f) => ({ ...f, icon: e.target.value }))} />
          <input className="ainput" style={{ flex: 1, minWidth: 180 }} placeholder="마당 이름" value={newCat.name} onChange={(e) => setNewCat((f) => ({ ...f, name: e.target.value }))} />
          <button className="abtn abtn--primary" onClick={handleAdd} disabled={!newCat.name.trim()}>추가</button>
          <button className="abtn abtn--ghost" onClick={() => setShowAdd(false)}>취소</button>
        </div>
      )}

      <div className="atable-wrap">
        <table className="atable">
          <thead><tr><th>아이콘</th><th>마당 이름</th><th>게시글 수</th><th>상태</th><th>작업</th></tr></thead>
          <tbody>
            {cats.map((cat) => (
              <tr key={cat.id}>
                <td style={{ fontSize: '1.25rem' }}>{cat.icon}</td>
                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                <td>{cat.post_count.toLocaleString()}개</td>
                <td>
                  {cat.is_active
                    ? <span className="abadge abadge--green">활성</span>
                    : <span className="abadge abadge--muted">비활성</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="abtn abtn--ghost" onClick={() => handleToggle(cat)}>
                      {cat.is_active ? '⏸️ 비활성' : '▶️ 활성'}
                    </button>
                    <button className="abtn abtn--danger" onClick={() => handleDelete(cat)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && <div className="atoast atoast--success">{toast}</div>}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function SectionCommunity({ onBadgeChange }: Props) {
  const [reports, setReports] = useState<ReportedContent[]>(MOCK_REPORTS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [activeTab, setActiveTab] = useState<'reports' | 'categories'>('reports');
  const [deleteItem, setDeleteItem] = useState<ReportedContent | null>(null);
  const [warnItem, setWarnItem] = useState<ReportedContent | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'deleted' | 'dismissed'>('all');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleDelete = (item: ReportedContent, reason: string) => {
    setReports((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'deleted' } : r));
    showToast(`"${item.author_name}"의 ${item.type === 'post' ? '게시글' : '댓글'}이 삭제되었습니다.`);
    setDeleteItem(null);
    onBadgeChange?.();
  };

  const handleWarn = (item: ReportedContent, reason: string) => {
    showToast(`"${item.author_name}"에게 경고가 발송되었습니다.`);
    setWarnItem(null);
  };

  const handleDismiss = (item: ReportedContent) => {
    setReports((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'dismissed' } : r));
    showToast('신고가 무시 처리되었습니다.');
    onBadgeChange?.();
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const filtered = reports.filter((r) => statusFilter === 'all' || r.status === statusFilter);

  const STATUS_LABEL: Record<ReportedContent['status'], string> = { pending: '처리 대기', deleted: '삭제됨', dismissed: '무시됨' };
  const STATUS_BADGE: Record<ReportedContent['status'], string> = { pending: 'abadge--amber', deleted: 'abadge--red', dismissed: 'abadge--muted' };

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">🏛️ 커뮤니티 관리</h2>
        {pendingCount > 0 && <span className="abadge abadge--red">🚨 처리 대기 {pendingCount}건</span>}
      </div>

      {/* 탭 */}
      <div className="atabs">
        <button className={`atab${activeTab === 'reports' ? ' atab--active' : ''}`} onClick={() => setActiveTab('reports')}>
          신고 처리 {pendingCount > 0 && <span className="atab-badge">{pendingCount}</span>}
        </button>
        <button className={`atab${activeTab === 'categories' ? ' atab--active' : ''}`} onClick={() => setActiveTab('categories')}>
          마당(카테고리) 관리
        </button>
      </div>

      {activeTab === 'reports' ? (
        <>
          {/* 필터 */}
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="aselect" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">전체 상태</option>
              <option value="pending">처리 대기</option>
              <option value="deleted">삭제됨</option>
              <option value="dismissed">무시됨</option>
            </select>
            <span style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.4)' }}>총 {filtered.length}건</span>
          </div>

          {/* 테이블 */}
          <div className="atable-wrap">
            {filtered.length === 0 ? (
              <div className="aempty"><span>🏛️</span><span>조건에 맞는 신고 내역이 없습니다.</span></div>
            ) : (
              <table className="atable">
                <thead><tr><th>유형</th><th>내용</th><th>작성자</th><th>신고 수</th><th>사유</th><th>상태</th><th>작업</th></tr></thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={`abadge ${item.type === 'post' ? 'abadge--purple' : 'abadge--blue'}`}>
                          {item.type === 'post' ? '📝 게시글' : '💬 댓글'}
                        </span>
                      </td>
                      <td>
                        {item.title && <div style={{ fontWeight: 600, marginBottom: '.25rem' }}>{item.title}</div>}
                        <div style={{ fontSize: '.8125rem', opacity: .65, lineHeight: 1.5 }}>
                          {item.content.slice(0, 60)}{item.content.length > 60 ? '...' : ''}
                        </div>
                      </td>
                      <td>
                        <div>{item.author_name}</div>
                        <div style={{ fontSize: '.75rem', opacity: .5 }}>{item.author_email}</div>
                      </td>
                      <td>
                        <span className="abadge abadge--red">{item.report_count}건</span>
                      </td>
                      <td style={{ fontSize: '.8125rem', opacity: .7 }}>{item.report_reason}</td>
                      <td><span className={`abadge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span></td>
                      <td>
                        {item.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                            <button className="abtn abtn--danger" onClick={() => setDeleteItem(item)}>🗑️ 삭제</button>
                            <button className="abtn abtn--warning" onClick={() => setWarnItem(item)}>⚠️ 경고</button>
                            <button className="abtn abtn--ghost" onClick={() => handleDismiss(item)}>무시</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <CategoryManager cats={categories} onUpdate={setCategories} />
      )}

      {deleteItem && <DeleteModal item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={(r) => handleDelete(deleteItem, r)} />}
      {warnItem && <WarnModal item={warnItem} onClose={() => setWarnItem(null)} onConfirm={(r) => handleWarn(warnItem, r)} />}
      {toast && <div className="atoast atoast--success">{toast}</div>}

      <style jsx global>{adminSectionStyles}</style>
    </section>
  );
}
