'use client';

import { useState, useEffect } from 'react';
import { S } from './ProfileTab';

const darkInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgb(var(--bg-muted))', border: '1px solid rgb(var(--border))',
  borderRadius: 10, color: 'rgb(var(--text-primary-rgb))', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
};

type RevenueType = 'consulting' | 'reservation' | 'referral' | 'content';

interface RevenueItem { enabled: boolean; price: string; }
type RevenueSettings = Record<RevenueType, RevenueItem>;

const ACTIVITIES: { id: RevenueType; icon: string; name: string; desc: string; priceLabel: string; placeholder: string }[] = [
  { id: 'consulting', icon: '💬', name: '상담 중개', desc: '코코봇을 통한 유료 상담 연결', priceLabel: '상담 단가 (원/30분)', placeholder: '30000' },
  { id: 'reservation', icon: '📅', name: '예약 중개', desc: '서비스 예약 수수료 수익', priceLabel: '예약 단가 (원/건)', placeholder: '5000' },
  { id: 'referral', icon: '🎯', name: '추천 중개', desc: '제품/서비스 추천 커미션', priceLabel: '커미션 비율 (%)', placeholder: '10' },
  { id: 'content', icon: '📦', name: '콘텐츠 판매', desc: '디지털 자료 판매 연결', priceLabel: '결제 링크 (외부 결제 페이지)', placeholder: 'https://...' },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <span style={{
        position: 'absolute', inset: 0, background: checked ? '#6366f1' : 'rgb(var(--border))',
        borderRadius: 12, transition: '0.3s',
      }} />
      <span style={{
        position: 'absolute', width: 18, height: 18, top: 3,
        left: checked ? 23 : 3, background: 'white', borderRadius: '50%', transition: '0.3s',
      }} />
    </label>
  );
}

export function RevenueTab() {
  const defaultSettings: RevenueSettings = {
    consulting: { enabled: false, price: '30000' },
    reservation: { enabled: false, price: '5000' },
    referral:    { enabled: false, price: '10' },
    content:     { enabled: false, price: '' },
  };

  const [settings, setSettings] = useState<RevenueSettings>(defaultSettings);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mcw_revenue_settings') || '{}');
      setSettings(prev => {
        const merged = { ...prev };
        for (const key of Object.keys(defaultSettings) as RevenueType[]) {
          if (saved[key]) merged[key] = { ...merged[key], ...saved[key] };
        }
        return merged;
      });
    } catch { /* ignore */ }
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const toggleActivity = (id: RevenueType, enabled: boolean) => {
    setSettings(prev => ({ ...prev, [id]: { ...prev[id], enabled } }));
  };

  const setPrice = (id: RevenueType, price: string) => {
    setSettings(prev => ({ ...prev, [id]: { ...prev[id], price } }));
  };

  const save = () => {
    localStorage.setItem('mcw_revenue_settings', JSON.stringify(settings));
    showToast('수익활동 설정이 저장되었습니다.');
  };

  // 가상 수익 현황 (0으로 표시)
  const revenueTotal = 0;
  const revenueFee = 0;
  const revenueNet = 0;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: 'rgb(var(--color-primary))', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 500 }}>{toast}</div>
      )}

      <h1 style={S.h1}>💰 수익활동 관리</h1>

      {/* 수익활동 중개 */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>수익활동 중개 서비스</h2>
          <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.85rem', marginTop: 4 }}>
            CoCoBot가 중개하며, 발생 수익의 20%가 수수료로 차감됩니다.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {ACTIVITIES.map(act => (
            <div key={act.id} style={{
              background: 'rgb(var(--bg-subtle))', border: '1px solid rgb(var(--border-subtle-rgb))',
              borderRadius: 12, padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.5rem' }}>{act.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'rgb(var(--text-primary-rgb))', fontSize: '0.9rem' }}>{act.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: 2 }}>{act.desc}</div>
                  </div>
                </div>
                <ToggleSwitch checked={settings[act.id].enabled} onChange={v => toggleActivity(act.id, v)} />
              </div>

              {settings[act.id].enabled && (
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgb(var(--border-subtle-rgb))' }}>
                  <label style={{ ...S.label, fontSize: '0.8rem' }}>{act.priceLabel}</label>
                  <input
                    type={act.id === 'content' ? 'text' : 'number'}
                    style={darkInput}
                    value={settings[act.id].price}
                    onChange={e => setPrice(act.id, e.target.value)}
                    placeholder={act.placeholder}
                    min={act.id !== 'content' ? 0 : undefined}
                    max={act.id === 'referral' ? 50 : undefined}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button style={{ ...S.btnPrimary, marginTop: '1.5rem' }} onClick={save}>수익활동 설정 저장</button>
      </div>

      {/* 수익 현황 */}
      <div style={S.card}>
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>수익 현황 (이번 달)</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { value: `₩${revenueTotal.toLocaleString()}`, label: '총 수익' },
            { value: `₩${revenueFee.toLocaleString()}`, label: '수수료 (20%)' },
            { value: `₩${revenueNet.toLocaleString()}`, label: '정산 예정액' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgb(var(--bg-subtle))', border: '1px solid rgb(var(--border-subtle-rgb))',
              borderRadius: 12, padding: '1.25rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(var(--text-primary-rgb))' }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.8rem', marginTop: '1rem' }}>
          * 정산은 매월 말일 기준으로 익월 7일 지급됩니다.
        </p>
      </div>
    </div>
  );
}
