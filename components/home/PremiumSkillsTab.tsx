'use client';

import { useState, useEffect } from 'react';
import { S } from './ProfileTab';

const darkInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: 'white', fontSize: '1rem', outline: 'none',
  boxSizing: 'border-box',
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: 20,
      background: active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
      color: active ? '#22c55e' : 'rgba(255,255,255,0.4)',
      border: active ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)',
    }}>{active ? '활성' : '미설정'}</span>
  );
}

export function PremiumSkillsTab() {
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [voiceFileName, setVoiceFileName] = useState('');
  const [rpmAvatarUrl, setRpmAvatarUrl] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('mcw_premium_skills') || '{}');
    if (settings.elevenLabsKey) setElevenLabsKey(settings.elevenLabsKey);
    if (settings.rpmAvatarUrl) setRpmAvatarUrl(settings.rpmAvatarUrl);
    if (settings.customCss) setCustomCss(settings.customCss);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const saveSettings = (updates: Record<string, string>) => {
    const settings = JSON.parse(localStorage.getItem('mcw_premium_skills') || '{}');
    Object.assign(settings, updates);
    localStorage.setItem('mcw_premium_skills', JSON.stringify(settings));
  };

  const saveVoiceClone = () => {
    if (!elevenLabsKey.trim()) { showToast('ElevenLabs API 키를 입력해주세요.'); return; }
    saveSettings({ elevenLabsKey: elevenLabsKey.trim() });
    showToast('목소리 복제 설정이 저장되었습니다.');
  };

  const save3dAvatar = () => {
    if (!rpmAvatarUrl.trim()) { showToast('Ready Player Me 아바타 URL을 입력해주세요.'); return; }
    saveSettings({ rpmAvatarUrl: rpmAvatarUrl.trim() });
    showToast('3D 아바타 URL이 저장되었습니다.');
  };

  const saveTheme = () => {
    saveSettings({ customCss: customCss.trim() });
    showToast('커스텀 CSS가 저장되었습니다.');
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#6366f1', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 500 }}>{toast}</div>
      )}

      <h1 style={S.h1}>💎 유료 스킬 설정</h1>

      {/* 목소리 복제 */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div style={{ ...S.sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={S.h2}>🎤 내 목소리 복제</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 4 }}>ElevenLabs API 연동 · ₩50,000/월</p>
          </div>
          <StatusBadge active={!!elevenLabsKey} />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          3분 분량의 음성 샘플을 업로드하면 AI가 당신의 목소리를 학습합니다.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>ElevenLabs API 키</label>
          <input type="password" style={darkInput} value={elevenLabsKey}
            onChange={e => setElevenLabsKey(e.target.value)} placeholder="sk-..." />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>음성 샘플 업로드 (MP3/WAV, 최대 30MB)</label>
          <label style={{
            border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 12,
            padding: '1.5rem', textAlign: 'center', cursor: 'pointer', display: 'block',
            color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
          }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>🎙️</span>
            클릭하여 음성 파일 업로드
            <input type="file" accept=".mp3,.wav,.m4a" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) setVoiceFileName(f.name + ' (' + (f.size / 1024 / 1024).toFixed(1) + 'MB)'); }} />
          </label>
          {voiceFileName && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>선택된 파일: {voiceFileName}</div>}
        </div>

        <button style={S.btnPrimary} onClick={saveVoiceClone}>목소리 복제 설정 저장</button>
      </div>

      {/* 3D 아바타 */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div style={{ ...S.sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={S.h2}>👤 3D 아바타</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 4 }}>Ready Player Me API 연동 · ₩30,000/월</p>
          </div>
          <StatusBadge active={!!rpmAvatarUrl} />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Ready Player Me를 통해 나만의 3D 아바타를 생성하고 챗봇에 적용합니다.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>Ready Player Me 아바타 URL</label>
          <input type="text" style={darkInput} value={rpmAvatarUrl}
            onChange={e => setRpmAvatarUrl(e.target.value)} placeholder="https://models.readyplayer.me/..." />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            onClick={() => window.open('https://readyplayer.me', '_blank')}>Ready Player Me 열기</button>
          <button style={{ ...S.btnPrimary, padding: '8px 16px', fontSize: '0.85rem' }} onClick={save3dAvatar}>아바타 URL 저장</button>
        </div>
      </div>

      {/* 커스텀 테마 */}
      <div style={S.card}>
        <div style={{ ...S.sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={S.h2}>🎨 커스텀 테마</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: 4 }}>CSS 에디터 직접 편집 · ₩20,000/월</p>
          </div>
          <StatusBadge active={!!customCss} />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          CSS를 직접 편집하여 브랜드 색상과 스타일을 완벽히 맞춤화합니다.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={S.label}>커스텀 CSS</label>
          <textarea
            style={{ ...darkInput, resize: 'vertical', minHeight: 200, fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}
            value={customCss}
            onChange={e => setCustomCss(e.target.value)}
            placeholder={`:root { --primary-500: #your-color; }\n.chat-bubble { border-radius: 20px; }`}
          />
        </div>

        <button style={S.btnPrimary} onClick={saveTheme}>커스텀 CSS 저장</button>
      </div>
    </div>
  );
}
