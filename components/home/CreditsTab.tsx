'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { S } from './ProfileTab';

const darkInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface-1)', border: '1px solid var(--border-default)',
  borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
};

const PACKAGES = [
  { credits: 5000,  price: 5000,  popular: false },
  { credits: 10000, price: 10000, popular: true  },
  { credits: 30000, price: 30000, popular: false },
  { credits: 50000, price: 50000, popular: false },
];

interface CreditHistory { type: 'charge' | 'use'; amount: number; note: string; timestamp: string; }

export function CreditsTab({ user }: { user: any }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<{ price: number; credits: number } | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const credits = parseInt(localStorage.getItem('mcw_credits') || '0');
    setBalance(credits);
    const h: CreditHistory[] = JSON.parse(localStorage.getItem('mcw_credit_history') || '[]');
    setHistory(h);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const USAGE_ITEMS = [
    { icon: '🤖', label: 'AI 대화', cost: '1 크레딧/회' },
    { icon: '💾', label: 'DB 저장', cost: '0.1 크레딧/KB' },
    { icon: '🔊', label: '음성 합성', cost: '5 크레딧/분' },
    { icon: '🎤', label: '음성 인식', cost: '3 크레딧/분' },
  ];

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: 'rgb(var(--color-primary))', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 500 }}>{toast}</div>
      )}

      <h1 style={S.h1}>🪙 크레딧 & 결제</h1>

      {/* 크레딧 현황 */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>현재 크레딧 잔액</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#818cf8' }}>{balance.toLocaleString()}</div>
          <div style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>크레딧</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {USAGE_ITEMS.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface-1)', border: '1px solid var(--border-default)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{item.cost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 크레딧 충전 */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>크레딧 충전</h2>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
          무통장 입금 방식으로 충전합니다. 입금 확인 후 크레딧이 지급됩니다.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {PACKAGES.map((pkg, i) => (
            <div key={i}
              role="radio"
              aria-checked={selectedPkg?.price === pkg.price}
              aria-label={`${pkg.credits.toLocaleString()} 크레딧 ${pkg.price.toLocaleString()}원`}
              tabIndex={0}
              onClick={() => setSelectedPkg({ price: pkg.price, credits: pkg.credits })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPkg({ price: pkg.price, credits: pkg.credits });
                }
              }}
              style={{
                position: 'relative', background: 'var(--surface-1)',
                border: `2px solid ${selectedPkg?.price === pkg.price ? '#6366f1' : pkg.popular ? 'rgba(251,191,36,0.4)' : 'var(--border-default)'}`,
                borderRadius: 16, padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
              }}>
              {pkg.popular && (
                <span style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: '#f59e0b', color: 'white', fontSize: '0.7rem', fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                }}>인기</span>
              )}
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                {pkg.credits.toLocaleString()} 크레딧
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>
                ₩{pkg.price.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>1원 = 1크레딧</div>
            </div>
          ))}
        </div>
        <button
          style={{ ...S.btnPrimary, marginTop: '1.5rem', width: '100%', opacity: selectedPkg ? 1 : 0.5, cursor: selectedPkg ? 'pointer' : 'not-allowed' }}
          disabled={!selectedPkg}
          onClick={() => { if (selectedPkg) setBankModalOpen(true); }}
        >
          {selectedPkg
            ? `₩${selectedPkg.price.toLocaleString()}으로 ${selectedPkg.credits.toLocaleString()} 크레딧 충전`
            : '패키지를 선택하세요'}
        </button>
      </div>

      {/* 사용 내역 */}
      <div style={S.card}>
        <div style={S.sectionHeader}>
          <h2 style={S.h2}>크레딧 사용 내역</h2>
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' }}>
            아직 사용 내역이 없습니다.
          </div>
        ) : (
          history.slice(0, 20).map((h, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: i < Math.min(history.length, 20) - 1 ? '1px solid var(--border-default)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{h.note || ''}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {new Date(h.timestamp).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: h.type === 'charge' ? '#22c55e' : '#f87171' }}>
                {h.type === 'charge' ? '+' : '-'}{h.amount.toLocaleString()} 크레딧
              </span>
            </div>
          ))
        )}
      </div>

      {/* 무통장 입금 모달 */}
      {bankModalOpen && selectedPkg && (
        <BankTransferModal
          amount={selectedPkg.price}
          credits={selectedPkg.credits}
          user={user}
          onClose={() => setBankModalOpen(false)}
          onSuccess={() => {
            setBankModalOpen(false);
            setSelectedPkg(null);
            showToast('입금 신청이 완료되었습니다. 입금 확인 후 크레딧이 충전됩니다.');
          }}
        />
      )}
    </div>
  );
}

// ── 무통장 입금 모달 ──────────────────────────────────────────
function BankTransferModal({
  amount, credits, user, onClose, onSuccess,
}: {
  amount: number; credits: number; user: any;
  onClose: () => void; onSuccess: () => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState(amount);
  const [depositorName, setDepositorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const AMOUNTS = [5000, 10000, 30000, 50000];

  const submit = async () => {
    if (!selectedAmount) { setError('입금 금액을 선택해주세요.'); return; }
    if (!depositorName.trim()) { setError('입금자명을 입력해주세요.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('로그인이 필요합니다.'); return; }

      const res = await fetch('/api/Backend_APIs/credit-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: selectedAmount, depositor_name: depositorName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '입금 신청에 실패했습니다.'); return; }
      onSuccess();
    } catch {
      setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))',
        borderRadius: 20, padding: '2rem', width: '90%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'rgb(var(--text-primary-rgb))', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          🏦 무통장 입금 안내
        </div>

        {/* 계좌 정보 */}
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          {[
            { label: '은행', value: '하나은행' },
            { label: '계좌번호', value: '287-910921-40507' },
            { label: '예금주', value: '파인더월드' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', fontSize: '0.9rem',
              borderBottom: i < 2 ? '1px solid rgb(var(--border-subtle-rgb))' : 'none',
            }}>
              <span style={{ color: 'rgb(var(--text-muted))' }}>{row.label}</span>
              <span style={{ fontWeight: 700, color: 'rgb(var(--text-primary-rgb))' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* 금액 선택 */}
        <div style={{ fontSize: '0.82rem', color: 'rgb(var(--text-secondary-rgb))', marginBottom: '0.6rem' }}>입금 금액 선택</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {AMOUNTS.map(amt => (
            <div key={amt} onClick={() => setSelectedAmount(amt)} style={{
              background: selectedAmount === amt ? 'rgba(99,102,241,0.12)' : 'rgb(var(--bg-subtle))',
              border: `2px solid ${selectedAmount === amt ? '#6366f1' : 'rgb(var(--bg-muted))'}`,
              borderRadius: 12, padding: '0.9rem 1rem', textAlign: 'center', cursor: 'pointer',
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8' }}>₩{amt.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: 3 }}>{amt.toLocaleString()} 크레딧</div>
            </div>
          ))}
        </div>

        {/* 입금자명 */}
        <div style={{ fontSize: '0.82rem', color: 'rgb(var(--text-secondary-rgb))', marginBottom: '0.5rem' }}>입금자명</div>
        <input type="text" placeholder="실제 입금자 이름을 입력하세요" maxLength={20}
          value={depositorName} onChange={e => setDepositorName(e.target.value)}
          style={{ ...darkInput, marginBottom: '1.25rem' }} />

        {error && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</div>}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ flex: 1, padding: '12px', background: 'rgb(var(--bg-muted))', color: 'rgb(var(--text-secondary-rgb))', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}
            onClick={onClose}>취소</button>
          <button style={{ flex: 1, ...S.btnPrimary, padding: '12px', opacity: submitting ? 0.7 : 1 }}
            onClick={submit} disabled={submitting}>
            {submitting ? '신청 중...' : '입금 완료 신청'}
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'rgb(var(--text-muted))', marginTop: '1rem', lineHeight: 1.6 }}>
          입금 후 영업일 기준 1~2시간 내 확인 후 크레딧이 충전됩니다.<br />
          문의: support@cocobot.world
        </p>
      </div>
    </div>
  );
}
