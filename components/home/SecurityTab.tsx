'use client';

import { useState } from 'react';
import supabase from '@/lib/supabase';
import { S } from './ProfileTab';

const darkInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
};

export function SecurityTab() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const changePassword = async () => {
    if (!newPw) { alert('새 비밀번호를 입력해주세요.'); return; }
    if (newPw.length < 6) { alert('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (newPw !== newPwConfirm) { alert('새 비밀번호가 일치하지 않습니다.'); return; }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      showToast('비밀번호가 안전하게 변경되었습니다.');
      setCurrentPw(''); setNewPw(''); setNewPwConfirm('');
    } catch (e: any) {
      alert('비밀번호 변경에 실패했습니다: ' + (e.message || ''));
    }
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#6366f1', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 500 }}>{toast}</div>
      )}

      <h1 style={S.h1}>계정 보안 설정</h1>

      <div style={S.card}>
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>비밀번호 변경</h2>
        </div>

        <div style={S.formRow}>
          <label style={S.label}>현재 비밀번호</label>
          <input type="password" style={darkInput} value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
        </div>

        <div style={S.formRow}>
          <label style={S.label}>새 비밀번호</label>
          <input type="password" style={darkInput} value={newPw} onChange={e => setNewPw(e.target.value)} />
        </div>

        <div style={S.formRow}>
          <label style={S.label}>새 비밀번호 확인</label>
          <input type="password" style={darkInput} value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} />
        </div>

        <button
          onClick={changePassword}
          style={{
            padding: '10px 24px',
            background: 'transparent',
            color: '#818cf8',
            border: '1px solid #6366f1',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          비밀번호 보안 업데이트
        </button>
      </div>
    </div>
  );
}
