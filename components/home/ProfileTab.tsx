'use client';

import { useState } from 'react';
import supabase from '@/lib/supabase';

// ── 공통 스타일 헬퍼 ─────────────────────────────────────────
export const S = {
  card: {
    background: '#1c1c24',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '2.5rem',
    maxWidth: 800,
  } as React.CSSProperties,
  sectionHeader: {
    marginBottom: '2rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '1.5rem',
  } as React.CSSProperties,
  h1: {
    fontSize: '2rem', fontWeight: 800, color: 'white',
    marginBottom: '2rem', textAlign: 'left' as const,
  } as React.CSSProperties,
  h2: { fontSize: '1.25rem', color: 'white', margin: 0 } as React.CSSProperties,
  label: {
    display: 'block', fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem',
  } as React.CSSProperties,
  staticValue: {
    fontSize: '1.1rem', color: 'white', fontWeight: 600, padding: '10px 0',
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 14px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: 'white', fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  formRow: { marginBottom: '1.5rem' } as React.CSSProperties,
  btnPrimary: {
    padding: '10px 24px', background: '#6366f1', color: 'white',
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
