'use client';

import { useState } from 'react';
import supabase from '@/lib/supabase';

// ── 공통 스타일 헬퍼 ─────────────────────────────────────────
export const S = {
  card: {
    background: 'rgb(var(--surface-1))',
    border: '1px solid rgb(var(--border-subtle-rgb))',
    borderRadius: 16,
    padding: '2.5rem',
    maxWidth: 800,
  } as React.CSSProperties,
  sectionHeader: {
    marginBottom: '2rem',
    borderBottom: '1px solid rgb(var(--border-subtle-rgb))',
    paddingBottom: '1.5rem',
  } as React.CSSProperties,
  h1: {
    fontSize: '2rem', fontWeight: 800, color: 'rgb(var(--text-primary-rgb))',
    marginBottom: '2rem', textAlign: 'left' as const,
  } as React.CSSProperties,
  h2: { fontSize: '1.25rem', color: 'rgb(var(--text-primary-rgb))', margin: 0 } as React.CSSProperties,
  label: {
    display: 'block', fontSize: '0.9rem',
    color: 'rgb(var(--text-secondary-rgb))', marginBottom: '0.5rem',
  } as React.CSSProperties,
  staticValue: {
    fontSize: '1.1rem', color: 'rgb(var(--text-primary-rgb))', fontWeight: 600, padding: '10px 0',
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 14px',
    background: 'rgb(var(--bg-muted))',
    border: '1px solid rgb(var(--border))',
    borderRadius: 10, color: 'rgb(var(--text-primary-rgb))', fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  formRow: { marginBottom: '1.5rem' } as React.CSSProperties,
  btnPrimary: {
    padding: '10px 24px', background: 'rgb(var(--color-primary))', color: 'white',
    border: 'none', borderRadius: 10, fontWeight: 600,
    fontSize: '0.9rem', cursor: 'pointer',
  } as React.CSSProperties,
};

interface ProfileTabProps { user: any; }

export function ProfileTab({ user }: ProfileTabProps) {
  const [name, setName] = useState(user?.user_metadata?.name || user?.email?.split('@')[0] || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { name } });
      if (error) throw error;
      showToast('프로필이 성공적으로 저장되었습니다.');
    } catch {
      showToast('프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '-';

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: '#6366f1', color: 'white', padding: '12px 20px',
          borderRadius: 10, fontSize: '0.9rem', fontWeight: 500,
        }}>{toast}</div>
      )}

      <h1 style={S.h1}>회원 정보 관리</h1>

      <div style={S.card}>
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>기본 프로필 정보</h2>
        </div>

        <div style={S.formRow}>
          <label style={S.label}>이메일</label>
          <div style={S.staticValue}>{user?.email || '-'}</div>
        </div>

        <div style={S.formRow}>
          <label style={S.label}>이름 / 닉네임</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={S.input}
          />
        </div>

        <div style={S.formRow}>
          <label style={S.label}>가입 일자</label>
          <div style={S.staticValue}>{joinedDate}</div>
        </div>

        <button onClick={handleSave} disabled={saving} style={S.btnPrimary}>
          {saving ? '저장 중...' : '프로필 저장하기'}
        </button>
      </div>
    </div>
  );
}
