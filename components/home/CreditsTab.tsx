'use client';

/**
 * @task S4BA2 / S5FE6
 * @description 크레딧 & 결제 탭
 *   - 잔액: /api/credits (Supabase mcw_credits)
 *   - 이번 달 사용량: messages 카운트 + creditsUsed 합계
 *   - 충전: 일단(₩9,900) / 이단(₩29,700) / 삼단(₩99,000) / 사단(₩297,000)
 *   - 결제 내역: mcw_payments
 */

import { useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabase';
import { S } from './ProfileTab';

// ── 요금제 정보 ─────────────────────────────────────────────────
const PLAN_PACKAGES = [
  { id: 'dan1', label: '일단 (Dan I)',   price: 9900,   credits: 2000,   popular: false },
  { id: 'dan2', label: '이단 (Dan II)',  price: 29700,  credits: 8000,   popular: false },
  { id: 'dan3', label: '삼단 (Dan III)', price: 99000,  credits: 30000,  popular: true  },
  { id: 'dan4', label: '사단 (Dan IV)',  price: 297000, credits: 120000, popular: false },
];

// 추가 충전 (정액 외 초과분 or 단건 충전)
const ADDON_PACKAGES = [
  { credits: 1000,  price: 1000  },
  { credits: 5000,  price: 5000  },
  { credits: 10000, price: 10000 },
  { credits: 50000, price: 50000 },
];

// 모델 티어별 크레딧 비용
const TIER_INFO = [
  { tier: 'Economy',   models: 'Gemini Flash Free',  cost: 8,  color: '#22c55e' },
  { tier: 'Standard',  models: 'Claude Haiku',        cost: 8,  color: '#818cf8' },
  { tier: 'Balanced',  models: 'Claude Sonnet',       cost: 32, color: '#f59e0b' },
  { tier: 'Premium',   models: 'GPT-4o / Opus',       cost: 80, color: '#f87171' },
];

interface PaymentRow {
  id: string;
  amount: number;
  credit_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  paid_at: string | null;
}

interface MonthlyUsage {
  totalCredits: number;
  messageCount: number;
}

export function CreditsTab({ user }: { user: any }) {
  const [balance, setBalance]           = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage>({ totalCredits: 0, messageCount: 0 });
  const [payments, setPayments]         = useState<PaymentRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeSection, setActiveSection] = useState<'addon' | 'plan'>('plan');
  const [selectedPkg, setSelectedPkg]   = useState<{ price: number; credits: number; label?: string } | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [toast, setToast]               = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  // ── 잔액 조회 (/api/credits) ──────────────────────────────────
  const fetchBalance = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/credits', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 0);
      }
    } catch {
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // ── 이번 달 사용량 (messages 기반) ────────────────────────────
  const fetchMonthlyUsage = useCallback(async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 이번 달 assistant 메시지 수 집계 (conversations를 통해 user_id 필터)
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'assistant')
        .gte('created_at', monthStart);

      const msgCount = count ?? 0;
      // 평균 Economy 기준 추정값 (실제 로그 없는 경우 추정)
      setMonthlyUsage({ totalCredits: msgCount * 8, messageCount: msgCount });
    } catch {
      // 집계 실패 시 0으로 유지
    }
  }, []);

  // ── 결제 내역 (mcw_payments) ──────────────────────────────────
  const fetchPayments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mcw_payments')
        .select('id, amount, credit_amount, status, created_at, paid_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) setPayments(data as PaymentRow[]);
    } catch {
      // 조회 실패 무시
    } finally {
      setLoadingHistory(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchBalance();
    fetchMonthlyUsage();
    fetchPayments();
  }, [fetchBalance, fetchMonthlyUsage, fetchPayments]);

  // ── 이번 달 사용량 게이지 (잔액 기준 단순 추정) ──────────────
  const usagePercent = balance !== null
    ? Math.min(100, Math.round((monthlyUsage.totalCredits / Math.max(monthlyUsage.totalCredits + balance, 1)) * 100))
    : 0;

  const statusColor = usagePercent >= 90 ? '#f87171' : usagePercent >= 70 ? '#f59e0b' : '#22c55e';

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: '#6366f1', color: 'white', padding: '12px 20px',
          borderRadius: 10, fontSize: '0.9rem', fontWeight: 500,
        }}>{toast}</div>
      )}

      <h1 style={S.h1}>🪙 크레딧 & 결제</h1>

      {/* ── 잔액 + 이번 달 사용량 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* 잔액 카드 */}
        <div style={{ ...S.card, margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>현재 잔액</div>
          {loadingBalance ? (
            <div style={{ height: 56, display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>조회 중...</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>
                  {(balance ?? 0).toLocaleString()}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>크레딧</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
                ≈ ₩{(balance ?? 0).toLocaleString()} (1크레딧 = 1원)
              </div>
            </>
          )}
          <button
            onClick={fetchBalance}
            style={{ marginTop: '1rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer' }}
          >새로고침</button>
        </div>

        {/* 이번 달 사용량 */}
        <div style={{ ...S.card, margin: 0 }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>이번 달 사용량</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: statusColor, lineHeight: 1 }}>
              {monthlyUsage.totalCredits.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>크레딧</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem' }}>
            대화 {monthlyUsage.messageCount.toLocaleString()}회 (이번 달 누적)
          </div>
          {/* 게이지 */}
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: statusColor, width: `${usagePercent}%`, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.4rem' }}>
            잔액 대비 사용 {usagePercent}%
          </div>
        </div>
      </div>

      {/* ── 모델 티어별 비용 안내 ── */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <h2 style={{ ...S.h2, marginBottom: '0.75rem' }}>대화당 크레딧 소비량</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {TIER_INFO.map((t) => (
            <div key={t.tier} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${t.color}30`,
              borderRadius: 12, padding: '0.9rem 1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.cost}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>크레딧/회</div>
              <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 700, marginTop: 6 }}>{t.tier}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{t.models}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 충전 섹션 ── */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ ...S.h2, margin: 0 }}>크레딧 충전</h2>
          {/* 탭 전환 */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3 }}>
            {(['plan', 'addon'] as const).map((sec) => (
              <button key={sec}
                onClick={() => { setActiveSection(sec); setSelectedPkg(null); }}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  background: activeSection === sec ? '#6366f1' : 'transparent',
                  color: activeSection === sec ? 'white' : 'rgba(255,255,255,0.5)',
                }}
              >{sec === 'plan' ? '정기 요금제' : '단건 충전'}</button>
            ))}
          </div>
        </div>

        {activeSection === 'plan' ? (
          <>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
              월정액 요금제 크레딧 (VAT 포함 · 무통장 입금)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {PLAN_PACKAGES.map((pkg) => (
                <div key={pkg.id}
                  onClick={() => setSelectedPkg({ price: pkg.price, credits: pkg.credits, label: pkg.label })}
                  style={{
                    position: 'relative',
                    background: selectedPkg?.price === pkg.price ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${selectedPkg?.price === pkg.price ? '#6366f1' : pkg.popular ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 16, padding: '1.25rem', cursor: 'pointer',
                  }}>
                  {pkg.popular && (
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>인기</span>
                  )}
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{pkg.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>₩{pkg.price.toLocaleString()}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>/월 · {pkg.credits.toLocaleString()} 크레딧 포함</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
              1크레딧 = 1원 · 유효기간 없음
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {ADDON_PACKAGES.map((pkg) => (
                <div key={pkg.price}
                  onClick={() => setSelectedPkg({ price: pkg.price, credits: pkg.credits })}
                  style={{
                    background: selectedPkg?.price === pkg.price ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${selectedPkg?.price === pkg.price ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 14, padding: '1.1rem', textAlign: 'center', cursor: 'pointer',
                  }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8' }}>₩{pkg.price.toLocaleString()}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{pkg.credits.toLocaleString()} 크레딧</div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          style={{ ...S.btnPrimary, marginTop: '1.5rem', width: '100%', opacity: selectedPkg ? 1 : 0.45, cursor: selectedPkg ? 'pointer' : 'not-allowed' }}
          disabled={!selectedPkg}
          onClick={() => { if (selectedPkg) setBankModalOpen(true); }}
        >
          {selectedPkg
            ? `₩${selectedPkg.price.toLocaleString()} 결제 → ${selectedPkg.credits.toLocaleString()} 크레딧 충전`
            : '패키지를 선택하세요'}
        </button>
      </div>

      {/* ── 결제 내역 ── */}
      <div style={S.card}>
        <h2 style={{ ...S.h2, marginBottom: '1rem' }}>결제 내역</h2>
        {loadingHistory ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', padding: '1rem 0' }}>불러오는 중...</div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem', fontSize: '0.9rem' }}>
            결제 내역이 없습니다.
          </div>
        ) : (
          <div>
            {payments.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < payments.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                      {(p.credit_amount ?? p.amount).toLocaleString()} 크레딧
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {new Date(p.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {p.paid_at && ` · 입금확인 ${new Date(p.paid_at).toLocaleDateString('ko-KR')}`}
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#22c55e' }}>
                  +₩{p.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 무통장 입금 모달 ── */}
      {bankModalOpen && selectedPkg && (
        <BankTransferModal
          amount={selectedPkg.price}
          credits={selectedPkg.credits}
          label={selectedPkg.label}
          user={user}
          onClose={() => setBankModalOpen(false)}
          onSuccess={() => {
            setBankModalOpen(false);
            setSelectedPkg(null);
            showToast('입금 신청 완료. 확인 후 크레딧이 충전됩니다.');
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}

// ── 상태 배지 ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: PaymentRow['status'] }) {
  const map = {
    pending:   { label: '입금 대기', bg: 'rgba(251,191,36,0.15)', color: '#f59e0b' },
    completed: { label: '충전 완료', bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
    cancelled: { label: '취소됨',   bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
      {s.label}
    </span>
  );
}

// ── 무통장 입금 모달 ───────────────────────────────────────────
function BankTransferModal({
  amount, credits, label, user, onClose, onSuccess,
}: {
  amount: number; credits: number; label?: string; user: any;
  onClose: () => void; onSuccess: () => void;
}) {
  const [depositorName, setDepositorName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const darkInput: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  };

  const submit = async () => {
    if (!depositorName.trim()) { setError('입금자명을 입력해주세요.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('로그인이 필요합니다.'); return; }

      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
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
      position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '2rem', width: '90%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem' }}>
          🏦 무통장 입금 안내
        </div>

        {/* 선택 패키지 요약 */}
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            {label ?? '단건 충전'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>₩{amount.toLocaleString()}</span>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>{credits.toLocaleString()} 크레딧</span>
          </div>
        </div>

        {/* 계좌 정보 */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          {[
            { label: '은행',    value: '하나은행' },
            { label: '계좌번호', value: '287-910921-40507' },
            { label: '예금주',  value: '파인더월드' },
          ].map((row, i, arr) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 0', fontSize: '0.9rem',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
              <span style={{ fontWeight: 700, color: 'white' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* 입금자명 */}
        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>입금자명</div>
        <input
          type="text" placeholder="실제 입금자 이름" maxLength={20}
          value={depositorName} onChange={e => setDepositorName(e.target.value)}
          style={{ ...darkInput, marginBottom: '1.25rem' }}
        />

        {error && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}
            onClick={onClose}
          >취소</button>
          <button
            style={{ flex: 1, ...S.btnPrimary, padding: '12px', opacity: submitting ? 0.7 : 1 }}
            onClick={submit} disabled={submitting}
          >{submitting ? '신청 중...' : '입금 완료 신청'}</button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginTop: '1rem', lineHeight: 1.6 }}>
          입금 후 영업일 기준 1~2시간 내 크레딧이 충전됩니다.<br />
          문의: support@mychatbot.world
        </p>
      </div>
    </div>
  );
}
