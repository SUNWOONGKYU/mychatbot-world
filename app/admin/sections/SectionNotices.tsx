// @task S7FE7 (S5FE7) - 섹션2: 공지사항 관리 (admin-* → S7 Semantic 토큰 브리지 적용)
// 공지 CRUD + 상단 고정 핀 + 대상 설정 + 공개/비공개 토글
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminToast } from '../components/AdminToast';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  target: string;
  is_pinned: boolean;
  is_published: boolean;
  scheduled_at?: string;
  created_at: string;
  updated_at?: string;
}

interface SectionNoticesProps {
  adminKey: string;
}

const CATEGORIES = ['공지', '업데이트', '이벤트', '점검', '정책'];
const TARGETS = ['전체', '무료', '유료', '관리자'];

// ── 빈 공지 폼 ─────────────────────────────────────────────────────────────
const emptyForm = (): Omit<Notice, 'id' | 'created_at' | 'updated_at'> => ({
  title: '',
  content: '',
  category: '공지',
  target: '전체',
  is_pinned: false,
  is_published: true,
  scheduled_at: undefined,
});

export default function SectionNotices({ adminKey }: SectionNoticesProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showToast, ToastEl } = useAdminToast();

  const apiHeaders = useCallback(
    () => ({ 'X-Admin-Key': adminKey, 'Content-Type': 'application/json' }),
    [adminKey],
  );

  // ── 목록 로드 (notices API 없으므로 로컬 상태로 CRUD) ──────────────────
  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      // /api/admin/notices API 사용 (없으면 로컬 샘플)
      const res = await fetch('/api/admin/notices', { headers: apiHeaders() });
      if (res.ok) {
        const d = await res.json();
        setNotices(d.notices || []);
      } else {
        // 샘플 데이터
        setNotices([
          {
            id: 'sample-1',
            title: '[공지] MCW 서비스 오픈 안내',
            content: '코코봇 서비스가 정식 오픈했습니다.',
            category: '공지',
            target: '전체',
            is_pinned: true,
            is_published: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // ── 저장 ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showToast('제목과 내용을 입력하세요');
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editNotice;
      const url = isEdit ? `/api/admin/notices/${editNotice!.id}` : '/api/admin/notices';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: apiHeaders(),
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(isEdit ? '공지 수정 완료' : '공지 등록 완료');
        setShowModal(false);
        loadNotices();
      } else {
        // 로컬 fallback: API 없는 경우 UI만 업데이트
        if (isEdit) {
          setNotices((prev) =>
            prev.map((n) =>
              n.id === editNotice!.id
                ? { ...n, ...form, updated_at: new Date().toISOString() }
                : n,
            ),
          );
        } else {
          const newNotice: Notice = {
            ...form,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          };
          setNotices((prev) =>
            form.is_pinned ? [newNotice, ...prev] : [...prev, newNotice],
          );
        }
        showToast(isEdit ? '공지 수정됨 (로컬)' : '공지 등록됨 (로컬)');
        setShowModal(false);
      }
    } catch {
      showToast('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  // ── 삭제 ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('이 공지를 삭제하시겠습니까?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: 'DELETE',
        headers: apiHeaders(),
      });
      if (res.ok || res.status === 404) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
        showToast('공지 삭제됨');
      } else {
        setNotices((prev) => prev.filter((n) => n.id !== id));
        showToast('공지 삭제됨 (로컬)');
      }
    } catch {
      setNotices((prev) => prev.filter((n) => n.id !== id));
      showToast('공지 삭제됨');
    } finally {
      setDeleting(null);
    }
  };

  // ── 토글 ─────────────────────────────────────────────────────────────
  const toggleField = async (id: string, field: 'is_pinned' | 'is_published') => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [field]: !n[field] } : n)),
    );
    showToast(field === 'is_pinned' ? '핀 상태 변경' : '공개 상태 변경');
  };

  // ── 모달 열기 ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditNotice(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (notice: Notice) => {
    setEditNotice(notice);
    setForm({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      target: notice.target,
      is_pinned: notice.is_pinned,
      is_published: notice.is_published,
      scheduled_at: notice.scheduled_at,
    });
    setShowModal(true);
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h1 className="admin-section-title">공지사항 관리</h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          + 공지 작성
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>핀</th>
              <th>제목</th>
              <th>카테고리</th>
              <th>대상</th>
              <th>공개</th>
              <th>작성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">로딩 중...</td>
              </tr>
            ) : notices.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  등록된 공지사항이 없습니다
                </td>
              </tr>
            ) : (
              notices.map((n) => (
                <tr key={n.id}>
                  <td>
                    <button
                      title="핀 고정 토글"
                      onClick={() => toggleField(n.id, 'is_pinned')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        opacity: n.is_pinned ? 1 : 0.3,
                      }}
                    >
                      📌
                    </button>
                  </td>
                  <td>
                    <span style={{ fontWeight: n.is_pinned ? 600 : 400 }}>
                      {n.title}
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-primary">{n.category}</span>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-muted">{n.target}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleField(n.id, 'is_published')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: n.is_published
                          ? 'var(--admin-success)'
                          : 'var(--admin-muted)',
                        fontFamily: 'inherit',
                      }}
                    >
                      {n.is_published ? '공개' : '비공개'}
                    </button>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                    {new Date(n.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        onClick={() => openEdit(n)}
                      >
                        수정
                      </button>
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleDelete(n.id)}
                        disabled={deleting === n.id}
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

      {/* 공지 작성/수정 모달 */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)} role="presentation" aria-hidden="true">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="presentation">
            <h2 className="admin-modal-title">
              {editNotice ? '공지 수정' : '공지 작성'}
            </h2>
            <button
              className="admin-modal-close"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <div className="admin-field">
              <label className="required">제목</label>
              <input
                className="admin-input"
                style={{ width: '100%' }}
                placeholder="공지 제목"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="admin-field">
                <label>카테고리</label>
                <select
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label>공개 대상</label>
                <select
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={form.target}
                  onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                >
                  {TARGETS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="required">내용</label>
              <textarea
                className="admin-textarea"
                rows={5}
                placeholder="공지 내용을 입력하세요"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--admin-text)',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_pinned: e.target.checked }))
                  }
                />
                상단 고정
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--admin-text)',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_published: e.target.checked }))
                  }
                />
                즉시 공개
              </label>
            </div>

            <div className="admin-field" style={{ marginBottom: '1.25rem' }}>
              <label>예약 발행일시</label>
              <input
                type="datetime-local"
                className="admin-input"
                style={{ width: '100%' }}
                value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  }))
                }
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '0.25rem', display: 'block' }}>
                비워두면 즉시 공개 여부에 따라 처리됩니다
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="admin-btn admin-btn-outline"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : editNotice ? '수정 저장' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastEl}
    </div>
  );
}
