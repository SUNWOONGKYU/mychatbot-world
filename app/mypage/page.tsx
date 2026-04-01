/**
 * @task S4FE2
 * @description MyPage — 프로필 관리, 피상속 설정, 피상속 수락
 *
 * Route: /mypage
 * APIs: /api/credits, /api/credits/history, /api/payments
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 정의 ────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  notification_enabled: boolean;
  language: 'ko' | 'en';
}

interface CreditInfo {
  balance: number;
  total_charged: number;
}

interface PaymentHistory {
  id: string;
  amount: number;
  credits: number;
  method: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  depositor_name: string | null;
  created_at: string;
}

type EditMode = 'none' | 'profile' | 'charge';

// ── 유틸 ──────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) return name.trim()[0].toUpperCase();
  return email[0].toUpperCase();
}

function getToken(): string {
  return (
    localStorage.getItem('mcw_access_token') ||
    sessionStorage.getItem('mcw_access_token') ||
    ''
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

// ── 상수 ──────────────────────────────────────────────────────

const CREDIT_PACKAGES = [
  { credits: 100,  price: 10000,  label: '스타터' },
  { credits: 300,  price: 28000,  label: '기본' },
  { credits: 700,  price: 60000,  label: '프로' },
  { credits: 1500, price: 120000, label: '비즈니스' },
];

const BANK_INFO = {
  bank: '카카오뱅크',
  account: '3333-04-7654321',
  holder: '(주)마이챗봇월드',
};

// ── 서브 컴포넌트 ─────────────────────────────────────────────

/** 상태 뱃지 */
function StatusBadge({ status }: { status: PaymentHistory['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: '입금 대기', cls: 'bg-warning/15 text-warning border-warning/30' },
    confirmed: { label: '완료',     cls: 'bg-success/15 text-success border-success/30' },
    cancelled: { label: '취소',     cls: 'bg-error/15 text-error border-error/30' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-bg-muted text-text-muted border-border' };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', cls)}>
      {label}
    </span>
  );
}

/** 아바타 */
function Avatar({ profile }: { profile: UserProfile }) {
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt="프로필"
        className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
      />
    );
  }
  return (
    <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-bold text-primary">
      {getInitials(profile.full_name, profile.email)}
    </div>
  );
}

/** 링크 카드 */
function LinkCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary group-hover:text-primary transition-colors">{title}</p>
        <p className="text-sm text-text-secondary mt-0.5">{desc}</p>
      </div>
      <span className="text-text-muted group-hover:text-primary transition-colors">→</span>
    </Link>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function MyPage() {
  const router = useRouter();

  // ── 상태 ──
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credit, setCredit] = useState<CreditInfo | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<EditMode>('none');

  // 프로필 편집 폼
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editNotification, setEditNotification] = useState(true);
  const [editLanguage, setEditLanguage] = useState<'ko' | 'en'>('ko');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // 충전 폼
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [depositorName, setDepositorName] = useState('');
  const [chargeError, setChargeError] = useState('');
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);

  // 이미지 업로드
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── 초기화 ──
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, creditRes, paymentsRes] = await Promise.all([
        fetch('/api/auth/me', { headers: authHeaders() }),
        fetch('/api/credits', { headers: authHeaders() }),
        fetch('/api/payments?limit=10', { headers: authHeaders() }),
      ]);

      if (profileRes.status === 401) {
        router.replace('/login');
        return;
      }

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user ?? data);
      }
      if (creditRes.ok) {
        const data = await creditRes.json();
        setCredit(data);
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(Array.isArray(data) ? data : (data.payments ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── 프로필 편집 시작 ──
  function startEditProfile() {
    if (!profile) return;
    setEditName(profile.full_name ?? '');
    setEditBio(profile.bio ?? '');
    setEditNotification(profile.notification_enabled);
    setEditLanguage(profile.language);
    setSaveError('');
    setEditMode('profile');
  }

  function cancelEdit() {
    setEditMode('none');
    setSaveError('');
    setChargeError('');
    setChargeSuccess(false);
  }

  // ── 프로필 저장 ──
  async function saveProfile() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          full_name: editName.trim() || null,
          bio: editBio.trim() || null,
          notification_enabled: editNotification,
          language: editLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setProfile(prev => prev ? { ...prev, ...data } : data);
      setEditMode('none');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  // ── 아바타 업로드 ──
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('이미지 파일은 5MB 이하여야 합니다.');
      return;
    }
    setUploadingAvatar(true);
    setSaveError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const token = getToken();
      const res = await fetch('/api/auth/me/avatar', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '업로드 실패');
      setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : prev);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── 무통장 충전 요청 ──
  async function requestCharge() {
    if (!depositorName.trim()) {
      setChargeError('입금자명을 입력해주세요.');
      return;
    }
    setChargeLoading(true);
    setChargeError('');
    const pkg = CREDIT_PACKAGES[selectedPackage];
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          credits: pkg.credits,
          amount: pkg.price,
          method: 'bank_transfer',
          depositor_name: depositorName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '요청 실패');
      setChargeSuccess(true);
      // 결제 내역 새로고침
      const pr = await fetch('/api/payments?limit=10', { headers: authHeaders() });
      if (pr.ok) {
        const pd = await pr.json();
        setPayments(Array.isArray(pd) ? pd : (pd.payments ?? []));
      }
    } catch (err: unknown) {
      setChargeError(err instanceof Error ? err.message : '충전 요청에 실패했습니다.');
    } finally {
      setChargeLoading(false);
    }
  }

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl mb-2">⚠️</p>
          <p className="text-text-secondary">프로필 정보를 불러올 수 없습니다.</p>
          <button
            onClick={loadAll}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* ── 헤더 ── */}
      <div className="pb-5 border-b border-border">
        <h1 className="text-2xl font-bold text-text-primary">마이페이지</h1>
        <p className="text-sm text-text-secondary mt-1">프로필 관리 및 계정 설정</p>
      </div>

      {/* ── 프로필 카드 ── */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-start gap-5 mb-5">
          {/* 아바타 */}
          <div className="relative flex-shrink-0">
            <Avatar profile={profile} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors disabled:opacity-50"
              title="프로필 이미지 변경"
            >
              {uploadingAvatar ? '...' : '+'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* 기본 정보 */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-text-primary truncate">
              {profile.full_name || '이름 미설정'}
            </p>
            <p className="text-sm text-text-secondary mt-0.5 truncate">{profile.email}</p>
            <p className="text-xs text-text-muted mt-1">
              가입일: {formatDate(profile.created_at)}
            </p>
            {profile.bio && (
              <p className="text-sm text-text-secondary mt-2 line-clamp-2">{profile.bio}</p>
            )}
          </div>

          {/* 편집 버튼 */}
          {editMode !== 'profile' && (
            <button
              onClick={startEditProfile}
              className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors"
            >
              편집
            </button>
          )}
        </div>

        {/* 프로필 편집 폼 */}
        {editMode === 'profile' && (
          <div className="border-t border-border pt-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">이름</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={50}
                placeholder="이름을 입력하세요"
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">소개</label>
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="간단한 소개를 입력하세요 (최대 200자)"
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors resize-none"
              />
            </div>

            {/* 계정 설정 */}
            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-sm font-semibold text-text-secondary">계정 설정</p>

              {/* 알림 설정 */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-text-primary">이메일 알림 수신</span>
                <button
                  type="button"
                  onClick={() => setEditNotification(v => !v)}
                  className={clsx(
                    'relative w-11 h-6 rounded-full transition-colors',
                    editNotification ? 'bg-primary' : 'bg-border-strong',
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      editNotification && 'translate-x-5',
                    )}
                  />
                </button>
              </label>

              {/* 언어 설정 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">언어</span>
                <div className="flex gap-2">
                  {(['ko', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setEditLanguage(lang)}
                      className={clsx(
                        'px-3 py-1 text-sm rounded-lg border font-medium transition-colors',
                        editLanguage === lang
                          ? 'bg-primary text-white border-primary'
                          : 'bg-bg-subtle text-text-secondary border-border hover:border-primary/40',
                      )}
                    >
                      {lang === 'ko' ? '한국어' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{saveError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold hover:bg-bg-subtle transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 크레딧 & 충전 ── */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-primary">크레딧</h2>
          {editMode !== 'charge' && (
            <button
              onClick={() => { setChargeSuccess(false); setChargeError(''); setDepositorName(''); setSelectedPackage(0); setEditMode('charge'); }}
              className="px-3 py-1.5 text-sm font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors"
            >
              충전
            </button>
          )}
        </div>

        {/* 잔액 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl">💎</div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{(credit?.balance ?? 0).toLocaleString()}</p>
            <p className="text-xs text-text-secondary">크레딧 잔액</p>
          </div>
          {credit?.total_charged != null && credit.total_charged > 0 && (
            <div className="ml-auto text-right">
              <p className="text-sm font-semibold text-text-secondary">{credit.total_charged.toLocaleString()}</p>
              <p className="text-xs text-text-muted">총 충전</p>
            </div>
          )}
        </div>

        {/* 무통장 충전 폼 */}
        {editMode === 'charge' && (
          <div className="border-t border-border pt-4 space-y-4">
            {chargeSuccess ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-bold text-text-primary mb-1">충전 요청 완료</p>
                <p className="text-sm text-text-secondary mb-1">아래 계좌로 입금 후 확인까지 최대 1 영업일 소요됩니다.</p>
                <div className="mt-3 p-3 bg-bg-subtle rounded-xl text-sm text-left space-y-1">
                  <p><span className="text-text-muted">은행:</span> <span className="font-semibold">{BANK_INFO.bank}</span></p>
                  <p><span className="text-text-muted">계좌:</span> <span className="font-semibold">{BANK_INFO.account}</span></p>
                  <p><span className="text-text-muted">예금주:</span> <span className="font-semibold">{BANK_INFO.holder}</span></p>
                </div>
                <button onClick={cancelEdit} className="mt-4 px-4 py-2 text-sm font-semibold text-text-secondary border border-border rounded-lg hover:bg-bg-subtle transition-colors">
                  닫기
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-text-secondary">패키지 선택</p>
                <div className="grid grid-cols-2 gap-2">
                  {CREDIT_PACKAGES.map((pkg: any, idx: any) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPackage(idx)}
                      className={clsx(
                        'p-3 rounded-xl border text-left transition-colors',
                        selectedPackage === idx
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-bg-subtle hover:border-primary/40',
                      )}
                    >
                      <p className="text-xs text-text-muted font-medium">{pkg.label}</p>
                      <p className="font-bold text-text-primary">{pkg.credits.toLocaleString()} 크레딧</p>
                      <p className="text-sm text-text-secondary">{formatCurrency(pkg.price)}</p>
                    </button>
                  ))}
                </div>

                {/* 계좌 안내 */}
                <div className="p-3 bg-bg-subtle rounded-xl text-sm space-y-1">
                  <p className="font-semibold text-text-secondary mb-1">입금 계좌</p>
                  <p><span className="text-text-muted">은행:</span> {BANK_INFO.bank}</p>
                  <p><span className="text-text-muted">계좌번호:</span> {BANK_INFO.account}</p>
                  <p><span className="text-text-muted">예금주:</span> {BANK_INFO.holder}</p>
                </div>

                {/* 입금자명 */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">입금자명</label>
                  <input
                    type="text"
                    value={depositorName}
                    onChange={e => setDepositorName(e.target.value)}
                    placeholder="실제 입금자 이름을 정확히 입력하세요"
                    className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
                  />
                </div>

                {chargeError && (
                  <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{chargeError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={requestCharge}
                    disabled={chargeLoading}
                    className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    {chargeLoading ? '요청 중...' : '충전 요청'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold hover:bg-bg-subtle transition-colors"
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── 결제 내역 ── */}
      {payments.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold text-text-primary mb-4">결제 내역</h2>
          <div className="space-y-2">
            {payments.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between py-3 border-b border-border/60 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {p.credits.toLocaleString()} 크레딧
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(p.created_at)}
                    {p.depositor_name && ` · ${p.depositor_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text-secondary">
                    {formatCurrency(p.amount)}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 바로가기 링크 카드 ── */}
      <section className="space-y-3">
        <h2 className="font-bold text-text-primary">설정</h2>
        <div className="grid gap-3">
          <LinkCard
            href="/mypage/inheritance"
            icon="🔒"
            title="피상속 설정"
            desc="피상속인을 지정하고 조건을 설정하세요"
          />
          <LinkCard
            href="/mypage/inheritance-accept"
            icon="📬"
            title="피상속 수락"
            desc="내게 온 피상속 동의 요청을 확인하세요"
          />
          <LinkCard
            href="/home?tab=settings"
            icon="⚙️"
            title="구독 관리"
            desc="플랜 및 구독 설정을 관리하세요"
          />
        </div>
      </section>
    </div>
  );
}
