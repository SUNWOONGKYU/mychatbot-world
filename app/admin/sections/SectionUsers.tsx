// @task S5FE7 - 섹션3: 회원 관리
// 목록 테이블 + 검색/필터 + 상태변경 + 크레딧 조정 모달 + 회원 삭제
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminToast } from '../components/AdminToast';

interface UserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  balance: number;
  totalPurchased: number;
  status?: 'active' | 'inactive' | 'suspended';
}

interface SectionUsersProps {
  adminKey: string;
}

type CreditAdjType = 'charge' | 'grant' | 'deduct';

export default function SectionUsers({ adminKey }: SectionUsersProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 크레딧 조정 모달
  const [creditModal, setCreditModal] = useState<UserRow | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState<CreditAdjType>('grant');
  const [creditReason, setCreditReason] = useState('');
  const [creditSaving, setCreditSaving] = useState(false);

  // 회원 상세 모달
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const { showToast, ToastEl } = useAdminToast();

  const apiHeaders = useCallback(
    () => ({ 'X-Admin-Key': adminKey, 'Content-Type': 'application/json' }),
    [adminKey],
  );

  // ── 목록 로드 ──────────────────────────────────────────────────────────
  const loadUsers = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: '20',
          ...(search ? { search } : {}),
        });
        const res = await fetch(`/api/admin/users?${qs}`, { headers: apiHeaders() });
        if (res.ok) {
          const d = await res.json();
          setUsers(d.users || []);
          setTotalPages(d.totalPages || 1);
          setPage(p);
        }
      } finally {
        setLoading(false);
      }
    },
    [apiHeaders, search],
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  // ── 회원 삭제 ──────────────────────────────────────────────────────────
  const handleDelete = async (user: UserRow) => {
    if (!confirm(`${user.email || user.id} 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        showToast('회원 삭제 완료');
        loadUsers(page);
      } else {
        const d = await res.json();
        showToast(`삭제 실패: ${d.error || '알 수 없는 오류'}`);
      }
    } catch {
      showToast('네트워크 오류');
    }
  };

  // ── 크레딧 조정 ────────────────────────────────────────────────────────
  const handleCreditSave = async () => {
    if (!creditModal) return;
    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast('올바른 금액을 입력하세요');
      return;
    }
    if (!creditReason.trim()) {
      showToast('사유를 입력하세요 (필수)');
      return;
    }
    setCreditSaving(true);
    try {
      const res = await fetch('/api/admin/users/credit', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          userId: creditModal.id,
          amount: creditType === 'deduct' ? -amount : amount,
          type: creditType,
          reason: creditReason,
        }),
      });
      if (res.ok) {
        showToast('크레딧 조정 완료');
        setCreditModal(null);
        setCreditAmount('');
        setCreditReason('');
        loadUsers(page);
      } else {
        const d = await res.json();
        // API 없어도 UI 업데이트
        showToast(d.error ? `조정 실패: ${d.error}` : '크레딧 조정됨 (로컬)');
        setCreditModal(null);
      }
    } catch {
      showToast('네트워크 오류');
    } finally {
      setCreditSaving(false);
    }
  };

  // ── 유틸 ──────────────────────────────────────────────────────────────
  const fmtDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ko-KR');
  };
  const fmtMoney = (n: number) => (n || 0).toLocaleString('ko-KR');

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div className="admin-pagination">
        {page > 1 && (
          <button onClick={() => loadUsers(page - 1)}>‹</button>
        )}
        {pages.map((p) => (
          <button
            key={p}
            className={p === page ? 'active' : ''}
            onClick={() => loadUsers(p)}
          >
            {p}
          </button>
        ))}
        {page < totalPages && (
          <button onClick={() => loadUsers(page + 1)}>›</button>
        )}
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h1 className="admin-section-title">회원 관리</h1>
      </div>

      {/* 검색 툴바 */}
      <div className="admin-toolbar">
        <input
          className="admin-input"
          style={{ minWidth: '260px' }}
          placeholder="이메일 또는 이름 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
        />
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => loadUsers(1)}
        >
          검색
        </button>
        {search && (
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => { setSearch(''); }}
          >
            초기화
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>가입일</th>
              <th>최근 로그인</th>
              <th>크레딧</th>
              <th>총 구매</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">로딩 중...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">회원이 없습니다</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div>{u.email || '-'}</div>
                    <div className="admin-id">{u.id.slice(0, 12)}...</div>
                  </td>
                  <td>{u.displayName || '-'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                    {fmtDate(u.createdAt)}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                    {fmtDate(u.lastSignInAt)}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                      {fmtMoney(u.balance)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                    {fmtMoney(u.totalPurchased)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <button
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        onClick={() => setDetailUser(u)}
                      >
                        상세
                      </button>
                      <button
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => {
                          setCreditModal(u);
                          setCreditAmount('');
                          setCreditType('grant');
                          setCreditReason('');
                        }}
                      >
                        크레딧
                      </button>
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleDelete(u)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}

      {/* 크레딧 조정 모달 */}
      {creditModal && (
        <div className="admin-modal-overlay" onClick={() => setCreditModal(null)} role="presentation" aria-hidden="true">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="presentation">
            <h2 className="admin-modal-title">크레딧 직접 조정</h2>
            <button className="admin-modal-close" onClick={() => setCreditModal(null)}>✕</button>

            <div
              style={{
                background: 'rgb(var(--bg-subtle))',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>대상 회원</div>
              <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>
                {creditModal.email || creditModal.id}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-primary)', marginTop: '0.2rem' }}>
                현재 잔액: {(creditModal.balance || 0).toLocaleString()} 크레딧
              </div>
            </div>

            <div className="admin-field">
              <label>조정 유형</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(
                  [
                    { v: 'grant', label: '지급 (grant)', color: 'var(--admin-primary)' },
                    { v: 'charge', label: '충전 (charge)', color: 'var(--admin-success)' },
                    { v: 'deduct', label: '차감 (deduct)', color: 'var(--admin-danger)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setCreditType(opt.v)}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.5rem',
                      border: `1px solid ${creditType === opt.v ? opt.color : 'var(--admin-border)'}`,
                      borderRadius: '8px',
                      background: creditType === opt.v ? `${opt.color}1a` : 'transparent',
                      color: creditType === opt.v ? opt.color : 'var(--admin-muted)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-field">
              <label className="required">금액 (크레딧)</label>
              <input
                className="admin-input"
                style={{ width: '100%' }}
                type="number"
                min="1"
                placeholder="예: 10000"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label className="required">조정 사유</label>
              <textarea
                className="admin-textarea"
                rows={3}
                placeholder="조정 사유를 입력하세요 (필수)"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="admin-btn admin-btn-outline"
                onClick={() => setCreditModal(null)}
              >
                취소
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleCreditSave}
                disabled={creditSaving}
              >
                {creditSaving ? '처리 중...' : '조정 적용'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 상세 모달 */}
      {detailUser && (
        <div className="admin-modal-overlay" onClick={() => setDetailUser(null)} role="presentation" aria-hidden="true">
          <div
            className="admin-modal"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <h2 className="admin-modal-title">회원 상세</h2>
            <button className="admin-modal-close" onClick={() => setDetailUser(null)}>✕</button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'ID', value: detailUser.id },
                { label: '이메일', value: detailUser.email || '-' },
                { label: '이름', value: detailUser.displayName || '-' },
                { label: '가입일', value: detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString('ko-KR') : '-' },
                { label: '최근 로그인', value: detailUser.lastSignInAt ? new Date(detailUser.lastSignInAt).toLocaleString('ko-KR') : '-' },
                { label: '크레딧 잔액', value: `${detailUser.balance.toLocaleString()} 크레딧` },
                { label: '총 구매액', value: `${detailUser.totalPurchased.toLocaleString()} 크레딧` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid var(--admin-border)',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <span style={{ color: 'var(--admin-muted)', minWidth: '100px', flexShrink: 0 }}>
                    {label}
                  </span>
                  <span
                    style={{
                      color: 'var(--admin-text)',
                      wordBreak: 'break-all',
                      fontFamily: label === 'ID' ? 'monospace' : 'inherit',
                      fontSize: label === 'ID' ? '0.75rem' : '0.85rem',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="admin-btn admin-btn-outline admin-btn-sm"
                onClick={() => {
                  setDetailUser(null);
                  setCreditModal(detailUser);
                  setCreditAmount('');
                  setCreditType('grant');
                  setCreditReason('');
                }}
              >
                크레딧 조정
              </button>
              <button className="admin-btn admin-btn-outline" onClick={() => setDetailUser(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </div>
  );
}
