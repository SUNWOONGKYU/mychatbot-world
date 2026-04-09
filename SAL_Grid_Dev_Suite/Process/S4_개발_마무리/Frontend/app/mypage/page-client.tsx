/**
 * @task S4FE2
 * @description MyPage 클라이언트 컴포넌트
 *
 * Route: /mypage
 * Tabs:
 *   - 회원 정보 관리 (프로필 편집, 아바타)
 *   - 챗봇 및 운영 관리 (봇 목록, 설정 모달, 삭제)
 *   - 유료 스킬 설정 (목소리 복제, 3D 아바타, 커스텀 테마)
 *   - 수익활동 관리 (상담/예약/추천/콘텐츠 토글, 수익 현황)
 *   - 크레딧 & 결제 (잔액, 충전 패키지, 사용 내역)
 *   - 계정 보안 설정 (비밀번호 변경)
 *
 * APIs:
 *   /api/auth/me           — 프로필 조회/수정
 *   /api/auth/me/avatar    — 아바타 업로드
 *   /api/auth/password     — 비밀번호 변경
 *   /api/bots              — 내 챗봇 목록/삭제
 *   /api/settings          — 봇 설정 CRUD
 *   /api/inheritance       — 피상속인 현황
 *   /api/credits           — 크레딧 잔액
 *   /api/payments          — 결제 내역
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

interface BotItem {
  id: string;
  name: string;
  description: string | null;
  emoji?: string | null;
  deploy_url: string | null;
  created_at: string;
}

interface BotSettings {
  chatbot_id: string;
  persona: string;
  greeting: string;
  model: string;
  temperature: number;
  max_tokens: number;
  language: string;
  fallback_message: string;
  use_kb: boolean;
  kb_top_k: number;
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

interface InheritanceInfo {
  heir: {
    email: string;
    status: 'pending' | 'accepted' | 'declined';
    invitedAt: string;
  } | null;
  personas: Array<{ id: string; name: string; allowed: boolean }>;
}

interface PremiumSkills {
  elevenLabsKey: string;
  rpmAvatarUrl: string;
  customCss: string;
}

type RevenueType = 'consulting' | 'reservation' | 'referral' | 'content';

interface RevenueSetting {
  enabled: boolean;
  price: string;
}

type RevenueSettings = Record<RevenueType, RevenueSetting>;

type TabId = 'profile' | 'bots' | 'premium-skills' | 'revenue' | 'credits' | 'security';

// ── 유틸 ──────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatCurrency(n: number): string {
  return '₩' + n.toLocaleString('ko-KR');
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
  { credits: 5000,  price: 5000,  label: '베이직' },
  { credits: 10000, price: 10000, label: '인기', popular: true },
  { credits: 30000, price: 30000, label: '프로' },
  { credits: 50000, price: 50000, label: '비즈니스' },
];

const BANK_INFO = {
  bank: '하나은행',
  account: '287-910921-40507',
  holder: '파인더월드',
};

const MODELS = [
  { value: 'gpt-4o',       label: 'GPT-4o' },
  { value: 'gpt-4o-mini',  label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo',  label: 'GPT-4 Turbo' },
];

const NAV_ITEMS: { id: TabId; icon: string; label: string }[] = [
  { id: 'profile',        icon: '👤', label: '회원 정보 관리' },
  { id: 'bots',           icon: '🤖', label: '챗봇 및 운영 관리' },
  { id: 'premium-skills', icon: '💎', label: '유료 스킬 설정' },
  { id: 'revenue',        icon: '💰', label: '수익활동 관리' },
  { id: 'credits',        icon: '🪙', label: '크레딧 & 결제' },
  { id: 'security',       icon: '🔒', label: '계정 보안 설정' },
];

// ── 서브 컴포넌트 ─────────────────────────────────────────────

/** 결제 상태 뱃지 */
function PaymentStatusBadge({ status }: { status: PaymentHistory['status'] }) {
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

/** 상속 상태 뱃지 */
function InheritanceBadge({ status }: { status: 'pending' | 'accepted' | 'declined' }) {
  const map = {
    pending:  { label: '대기 중',  cls: 'bg-warning/15 text-warning border-warning/30' },
    accepted: { label: '수락됨',  cls: 'bg-success/15 text-success border-success/30' },
    declined: { label: '거절됨',  cls: 'bg-error/15 text-error border-error/30' },
  };
  const { label, cls } = map[status];
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

/** 스킬 뱃지 */
function SkillBadge({ active }: { active: boolean }) {
  return (
    <span className={clsx(
      'text-xs font-semibold px-2.5 py-1 rounded-full border',
      active
        ? 'bg-success/15 text-success border-success/30'
        : 'bg-bg-muted text-text-muted border-border',
    )}>
      {active ? '활성' : '미설정'}
    </span>
  );
}

/** 토글 스위치 */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-border-strong',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}

// ── 봇 설정 편집 모달 ─────────────────────────────────────────

function BotSettingsModal({
  bot,
  onClose,
}: {
  bot: BotItem;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<Partial<BotSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/settings?chatbot_id=${bot.id}`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data?.data?.settings ?? {});
        }
      } catch {
        setError('설정을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bot.id]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ chatbot_id: bot.id, ...settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, node: React.ReactNode) {
    return (
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">{label}</label>
        {node}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-bold text-text-primary">{bot.emoji ?? '🤖'} {bot.name}</h3>
            <p className="text-xs text-text-secondary mt-0.5">봇 설정 편집</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors"
          >
            ×
          </button>
        </div>

        {/* 바디 */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {field('AI 모델',
                <select
                  value={settings.model ?? 'gpt-4o-mini'}
                  onChange={e => setSettings(p => ({ ...p, model: e.target.value }))}
                  className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
                >
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              )}

              {field('온도 (창의성)',
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0} max={2} step={0.1}
                    value={settings.temperature ?? 0.7}
                    onChange={e => setSettings(p => ({ ...p, temperature: parseFloat(e.target.value) }))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-semibold text-text-primary w-8 text-right">
                    {(settings.temperature ?? 0.7).toFixed(1)}
                  </span>
                </div>
              )}

              {field('인사말',
                <textarea
                  value={settings.greeting ?? ''}
                  onChange={e => setSettings(p => ({ ...p, greeting: e.target.value }))}
                  rows={2}
                  maxLength={1000}
                  placeholder="챗봇 첫 인사말"
                  className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors resize-none"
                />
              )}

              {field('페르소나 (역할 프롬프트)',
                <textarea
                  value={settings.persona ?? ''}
                  onChange={e => setSettings(p => ({ ...p, persona: e.target.value }))}
                  rows={3}
                  maxLength={5000}
                  placeholder="챗봇의 성격과 역할을 정의하세요"
                  className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors resize-none"
                />
              )}

              {field('답변 불가 메시지',
                <input
                  type="text"
                  value={settings.fallback_message ?? ''}
                  onChange={e => setSettings(p => ({ ...p, fallback_message: e.target.value }))}
                  maxLength={500}
                  placeholder="답변할 수 없을 때 표시할 메시지"
                  className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
                />
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-text-primary">Knowledge Base 사용</span>
                <ToggleSwitch
                  checked={settings.use_kb ?? true}
                  onChange={v => setSettings(p => ({ ...p, use_kb: v }))}
                />
              </div>

              {error && (
                <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">저장되었습니다.</p>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        {!loading && (
          <div className="flex gap-3 p-5 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving || success}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : success ? '저장됨' : '저장'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold hover:bg-bg-subtle transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 봇 카드 ───────────────────────────────────────────────────

function BotCard({
  bot,
  onEdit,
  onDelete,
}: {
  bot: BotItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/bots?id=${bot.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        onDelete();
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-bg-subtle border border-border rounded-xl hover:border-primary/30 transition-colors">
      {/* 아이콘 */}
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl flex-shrink-0">
        {bot.emoji ?? '🤖'}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary truncate">{bot.name}</p>
        {bot.description && (
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{bot.description}</p>
        )}
        <p className="text-xs text-text-muted mt-1">{formatDate(bot.created_at)} 생성</p>
      </div>

      {/* 버튼 */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors"
        >
          설정
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 text-xs font-semibold text-error border border-error/40 rounded-lg hover:bg-error/10 transition-colors"
          >
            삭제
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1.5 text-xs font-semibold bg-error text-white rounded-lg hover:bg-error/80 transition-colors disabled:opacity-50"
            >
              {deleting ? '...' : '확인'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1.5 text-xs font-semibold border border-border text-text-secondary rounded-lg hover:bg-bg-subtle transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function MyPageClient() {
  const router = useRouter();

  // ── 탭 ──
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // ── 공통 데이터 ──
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bots, setBots] = useState<BotItem[]>([]);
  const [inheritanceInfo, setInheritanceInfo] = useState<InheritanceInfo | null>(null);
  const [credit, setCredit] = useState<CreditInfo | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // ── 봇 설정 모달 ──
  const [editingBot, setEditingBot] = useState<BotItem | null>(null);

  // ── 프로필 편집 ──
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editNotification, setEditNotification] = useState(true);
  const [editLanguage, setEditLanguage] = useState<'ko' | 'en'>('ko');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 유료 스킬 ──
  const [premiumSkills, setPremiumSkills] = useState<PremiumSkills>({
    elevenLabsKey: '',
    rpmAvatarUrl: '',
    customCss: '',
  });
  const [voiceSampleName, setVoiceSampleName] = useState('');
  const [skillSaveMsg, setSkillSaveMsg] = useState('');

  // ── 수익활동 ──
  const [revenueSettings, setRevenueSettings] = useState<RevenueSettings>({
    consulting:  { enabled: false, price: '30000' },
    reservation: { enabled: false, price: '5000' },
    referral:    { enabled: false, price: '10' },
    content:     { enabled: false, price: '' },
  });
  const [revenueSaveMsg, setRevenueSaveMsg] = useState('');

  // ── 크레딧 충전 ──
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [depositorName, setDepositorName] = useState('');
  const [chargeError, setChargeError] = useState('');
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(false);

  // ── 비밀번호 변경 ──
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // ── 초기화 ──
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    loadAll();

    // localStorage에서 유료 스킬/수익활동 설정 로드
    try {
      const storedSkills = JSON.parse(localStorage.getItem('mcw_premium_skills') || '{}');
      setPremiumSkills(prev => ({ ...prev, ...storedSkills }));
      const storedRevenue = JSON.parse(localStorage.getItem('mcw_revenue_settings') || '{}');
      if (Object.keys(storedRevenue).length > 0) {
        setRevenueSettings(prev => ({ ...prev, ...storedRevenue }));
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, botsRes, inheritanceRes, creditRes, paymentsRes] = await Promise.all([
        fetch('/api/auth/me', { headers: authHeaders() }),
        fetch('/api/bots?limit=50', { headers: authHeaders() }),
        fetch('/api/inheritance', { headers: authHeaders() }),
        fetch('/api/credits', { headers: authHeaders() }),
        fetch('/api/payments?limit=20', { headers: authHeaders() }),
      ]);

      if (profileRes.status === 401) {
        router.replace('/login');
        return;
      }

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user ?? data);
      }
      if (botsRes.ok) {
        const data = await botsRes.json();
        setBots(data?.data?.bots ?? data?.bots ?? []);
      }
      if (inheritanceRes.ok) {
        const data = await inheritanceRes.json();
        setInheritanceInfo(data?.data ?? null);
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

  // ── 프로필 편집 핸들러 ──
  function startEditProfile() {
    if (!profile) return;
    setEditName(profile.full_name ?? '');
    setEditBio(profile.bio ?? '');
    setEditNotification(profile.notification_enabled);
    setEditLanguage(profile.language);
    setSaveError('');
    setEditMode(true);
  }

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
      setEditMode(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

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

  // ── 유료 스킬 핸들러 ──
  function savePremiumSkill(key: keyof PremiumSkills, value: string, msgKey: string) {
    const updated = { ...premiumSkills, [key]: value };
    setPremiumSkills(updated);
    try {
      localStorage.setItem('mcw_premium_skills', JSON.stringify(updated));
    } catch { /* ignore */ }
    setSkillSaveMsg(msgKey);
    setTimeout(() => setSkillSaveMsg(''), 2500);
  }

  // ── 수익활동 핸들러 ──
  function toggleRevenue(type: RevenueType, enabled: boolean) {
    setRevenueSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled },
    }));
  }

  function updateRevenuePrice(type: RevenueType, price: string) {
    setRevenueSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], price },
    }));
  }

  function saveRevenueSettings() {
    try {
      localStorage.setItem('mcw_revenue_settings', JSON.stringify(revenueSettings));
    } catch { /* ignore */ }
    setRevenueSaveMsg('수익활동 설정이 저장되었습니다.');
    setTimeout(() => setRevenueSaveMsg(''), 2500);
  }

  // ── 충전 핸들러 ──
  async function requestCharge() {
    if (selectedPackage === null) {
      setChargeError('패키지를 선택해주세요.');
      return;
    }
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
      const pr = await fetch('/api/payments?limit=20', { headers: authHeaders() });
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

  function resetChargeForm() {
    setShowChargeForm(false);
    setChargeSuccess(false);
    setChargeError('');
    setDepositorName('');
    setSelectedPackage(null);
  }

  // ── 비밀번호 변경 핸들러 ──
  async function changePassword() {
    setPwError('');
    setPwSuccess(false);

    if (!newPw) { setPwError('새 비밀번호를 입력해주세요.'); return; }
    if (newPw.length < 6) { setPwError('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (newPw !== newPwConfirm) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setNewPwConfirm('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    localStorage.removeItem('mcw_access_token');
    sessionStorage.removeItem('mcw_access_token');
    router.replace('/login');
  }

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">불러오는 중...</p>
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

  // ── 렌더: 탭별 콘텐츠 ──────────────────────────────────────

  function renderProfile() {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">회원 정보 관리</h1>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          {/* 아바타 + 기본 정보 */}
          <div className="flex items-start gap-5 mb-5">
            <div className="relative flex-shrink-0">
              <Avatar profile={profile!} />
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

            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-text-primary truncate">
                {profile!.full_name || '이름 미설정'}
              </p>
              <p className="text-sm text-text-secondary mt-0.5 truncate">{profile!.email}</p>
              <p className="text-xs text-text-muted mt-1">
                가입일: {formatDate(profile!.created_at)}
              </p>
              {profile!.bio && (
                <p className="text-sm text-text-secondary mt-2 line-clamp-2">{profile!.bio}</p>
              )}
            </div>

            {!editMode && (
              <button
                onClick={startEditProfile}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors"
              >
                편집
              </button>
            )}
          </div>

          {/* 편집 폼 */}
          {editMode && (
            <div className="border-t border-border pt-5 space-y-4">
              <div>
                <label className="form-label block text-sm font-semibold text-text-secondary mb-1.5">이름 / 닉네임</label>
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
                  placeholder="간단한 소개 (최대 200자)"
                  className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 border-t border-border space-y-3">
                <p className="text-sm font-semibold text-text-secondary">계정 설정</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">이메일 알림 수신</span>
                  <ToggleSwitch checked={editNotification} onChange={setEditNotification} />
                </div>
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
                  {saving ? '저장 중...' : '프로필 저장하기'}
                </button>
                <button
                  onClick={() => { setEditMode(false); setSaveError(''); }}
                  className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold hover:bg-bg-subtle transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 피상속 설정 요약 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary">피상속 설정</h2>
            <Link
              href="/mypage/inheritance"
              className="px-3 py-1.5 text-sm font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors"
            >
              관리
            </Link>
          </div>

          {inheritanceInfo?.heir ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <div>
                  <p className="text-sm font-semibold text-text-primary">피상속인</p>
                  <p className="text-xs text-text-secondary mt-0.5">{inheritanceInfo.heir.email}</p>
                </div>
                <InheritanceBadge status={inheritanceInfo.heir.status} />
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  초대일: {formatDate(inheritanceInfo.heir.invitedAt)}
                </p>
                {inheritanceInfo.personas.length > 0 && (
                  <p className="text-xs text-text-muted mt-0.5">
                    허용된 챗봇: {inheritanceInfo.personas.filter(p => p.allowed).length} /
                    전체 {inheritanceInfo.personas.length}개
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-text-secondary mb-2">
                피상속인을 지정하면 긴급 상황 시 챗봇 자산을 이전할 수 있습니다.
              </p>
              <Link
                href="/mypage/inheritance"
                className="text-sm text-primary hover:underline font-semibold"
              >
                피상속인 지정하기 →
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderBots() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">챗봇 및 운영 관리</h1>
          <Link
            href="/home"
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            + 새 챗봇 생성
          </Link>
        </div>

        <div className="space-y-3">
          {bots.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center">
              <p className="text-4xl mb-3">🤖</p>
              <p className="font-semibold text-text-primary mb-1">아직 챗봇이 없습니다</p>
              <p className="text-sm text-text-secondary mb-4">챗봇을 만들어 시작해보세요.</p>
              <Link
                href="/home"
                className="inline-block px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors"
              >
                챗봇 만들기
              </Link>
            </div>
          ) : (
            bots.map(bot => (
              <BotCard
                key={bot.id}
                bot={bot}
                onEdit={() => setEditingBot(bot)}
                onDelete={() => setBots(prev => prev.filter(b => b.id !== bot.id))}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  function renderPremiumSkills() {
    const voiceActive = !!premiumSkills.elevenLabsKey;
    const avatarActive = !!premiumSkills.rpmAvatarUrl;
    const themeActive = !!premiumSkills.customCss;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">💎 유료 스킬 설정</h1>

        {skillSaveMsg && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-sm text-success">
            {skillSaveMsg}
          </div>
        )}

        {/* 목소리 복제 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-text-primary flex items-center gap-2">
                🎤 내 목소리 복제
              </h2>
              <p className="text-sm text-text-muted mt-1">ElevenLabs API 연동 · ₩50,000/월</p>
            </div>
            <SkillBadge active={voiceActive} />
          </div>
          <p className="text-sm text-text-secondary mb-4">
            3분 분량의 음성 샘플을 업로드하면 AI가 당신의 목소리를 학습합니다.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">ElevenLabs API 키</label>
              <input
                type="password"
                value={premiumSkills.elevenLabsKey}
                onChange={e => setPremiumSkills(prev => ({ ...prev, elevenLabsKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                음성 샘플 업로드 (MP3/WAV, 최대 30MB)
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <span className="text-3xl mb-2">🎙️</span>
                <p className="text-sm text-text-muted">클릭하여 음성 파일 업로드</p>
                {voiceSampleName && (
                  <p className="text-xs text-text-secondary mt-2">선택된 파일: {voiceSampleName}</p>
                )}
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setVoiceSampleName(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
                  }}
                />
              </label>
            </div>
            <button
              onClick={() => savePremiumSkill('elevenLabsKey', premiumSkills.elevenLabsKey, '목소리 복제 설정이 저장되었습니다.')}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              목소리 복제 설정 저장
            </button>
          </div>
        </div>

        {/* 3D 아바타 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-text-primary">👤 3D 아바타</h2>
              <p className="text-sm text-text-muted mt-1">Ready Player Me API 연동 · ₩30,000/월</p>
            </div>
            <SkillBadge active={avatarActive} />
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Ready Player Me를 통해 나만의 3D 아바타를 생성하고 챗봇에 적용합니다.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Ready Player Me 아바타 URL</label>
              <input
                type="text"
                value={premiumSkills.rpmAvatarUrl}
                onChange={e => setPremiumSkills(prev => ({ ...prev, rpmAvatarUrl: e.target.value }))}
                placeholder="https://models.readyplayer.me/..."
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.open('https://readyplayer.me', '_blank')}
                className="px-4 py-2 text-sm font-semibold border border-border text-text-secondary rounded-xl hover:bg-bg-subtle transition-colors"
              >
                Ready Player Me 열기
              </button>
              <button
                onClick={() => savePremiumSkill('rpmAvatarUrl', premiumSkills.rpmAvatarUrl, '3D 아바타 URL이 저장되었습니다.')}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors"
              >
                아바타 URL 저장
              </button>
            </div>
          </div>
        </div>

        {/* 커스텀 테마 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-text-primary">🎨 커스텀 테마</h2>
              <p className="text-sm text-text-muted mt-1">CSS 에디터 직접 편집 · ₩20,000/월</p>
            </div>
            <SkillBadge active={themeActive} />
          </div>
          <p className="text-sm text-text-secondary mb-4">
            CSS를 직접 편집하여 브랜드 색상과 스타일을 완벽히 맞춤화합니다.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">커스텀 CSS</label>
              <textarea
                value={premiumSkills.customCss}
                onChange={e => setPremiumSkills(prev => ({ ...prev, customCss: e.target.value }))}
                rows={8}
                placeholder={`:root { --primary-500: #your-color; }\n.chat-bubble { border-radius: 20px; }`}
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors resize-none font-mono"
              />
            </div>
            <button
              onClick={() => savePremiumSkill('customCss', premiumSkills.customCss, '커스텀 CSS가 저장되었습니다.')}
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              커스텀 CSS 저장
            </button>
          </div>
        </div>
      </div>
    );
  }

  const REVENUE_ITEMS: {
    type: RevenueType;
    icon: string;
    name: string;
    desc: string;
    priceLabel: string;
    pricePlaceholder?: string;
  }[] = [
    { type: 'consulting',  icon: '💬', name: '상담 중개',  desc: '챗봇을 통한 유료 상담 연결',  priceLabel: '상담 단가 (원/30분)' },
    { type: 'reservation', icon: '📅', name: '예약 중개',  desc: '서비스 예약 수수료 수익',      priceLabel: '예약 단가 (원/건)' },
    { type: 'referral',    icon: '🎯', name: '추천 중개',  desc: '제품/서비스 추천 커미션',      priceLabel: '커미션 비율 (%)' },
    { type: 'content',     icon: '📦', name: '콘텐츠 판매', desc: '디지털 자료 판매 연결',       priceLabel: '결제 링크 (외부 결제 페이지)', pricePlaceholder: 'https://...' },
  ];

  function renderRevenue() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">💰 수익활동 관리</h1>

        {revenueSaveMsg && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-sm text-success">
            {revenueSaveMsg}
          </div>
        )}

        {/* 수익활동 설정 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="font-bold text-text-primary">수익활동 중개 서비스</h2>
            <p className="text-sm text-text-muted mt-1">
              My Chatbot World가 중개하며, 발생 수익의 20%가 수수료로 차감됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REVENUE_ITEMS.map(item => {
              const setting = revenueSettings[item.type];
              return (
                <div
                  key={item.type}
                  className="bg-bg-subtle border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{item.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={setting.enabled}
                      onChange={v => toggleRevenue(item.type, v)}
                    />
                  </div>

                  {setting.enabled && (
                    <div className="pt-3 border-t border-border/60">
                      <label className="block text-xs text-text-muted mb-1">{item.priceLabel}</label>
                      <input
                        type={item.type === 'content' ? 'text' : 'number'}
                        value={setting.price}
                        onChange={e => updateRevenuePrice(item.type, e.target.value)}
                        placeholder={item.pricePlaceholder ?? '0'}
                        min={0}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={saveRevenueSettings}
            className="mt-5 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            수익활동 설정 저장
          </button>
        </div>

        {/* 수익 현황 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold text-text-primary mb-4">수익 현황 (이번 달)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '총 수익',     value: '₩0' },
              { label: '수수료 (20%)', value: '₩0' },
              { label: '정산 예정액',  value: '₩0' },
            ].map(stat => (
              <div key={stat.label} className="bg-bg-subtle border border-border rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3">
            * 정산은 매월 말일 기준으로 익월 7일 지급됩니다.
          </p>
        </div>
      </div>
    );
  }

  function renderCredits() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">🪙 크레딧 & 결제</h1>

        {/* 크레딧 현황 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold text-text-primary mb-4">현재 크레딧 잔액</h2>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-5xl font-extrabold text-primary">
              {(credit?.balance ?? 0).toLocaleString()}
            </span>
            <span className="text-text-muted">크레딧</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🤖', label: 'AI 대화',   cost: '1 크레딧/회' },
              { icon: '💾', label: 'DB 저장',   cost: '0.1 크레딧/KB' },
              { icon: '🔊', label: '음성 합성',  cost: '5 크레딧/분' },
              { icon: '🎤', label: '음성 인식',  cost: '3 크레딧/분' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 bg-bg-subtle border border-border rounded-xl px-3 py-2.5">
                <span className="text-xl">{item.icon}</span>
                <span className="flex-1 text-sm text-text-secondary">{item.label}</span>
                <span className="text-xs text-text-muted whitespace-nowrap">{item.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 크레딧 충전 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary">크레딧 충전</h2>
            {!showChargeForm && (
              <button
                onClick={() => setShowChargeForm(true)}
                className="px-3 py-1.5 text-sm font-semibold text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors"
              >
                충전하기
              </button>
            )}
          </div>
          <p className="text-sm text-text-muted mb-4">
            무통장 입금 방식으로 충전합니다. 입금 확인 후 크레딧이 지급됩니다.
          </p>

          {showChargeForm && (
            chargeSuccess ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-3">✅</p>
                <p className="font-bold text-text-primary mb-1">충전 요청 완료</p>
                <p className="text-sm text-text-secondary mb-4">
                  아래 계좌로 입금 후 확인까지 최대 1 영업일 소요됩니다.
                </p>
                <div className="p-4 bg-bg-subtle rounded-xl text-sm text-left space-y-1 mb-4">
                  <p><span className="text-text-muted">은행:</span> <span className="font-semibold">{BANK_INFO.bank}</span></p>
                  <p><span className="text-text-muted">계좌번호:</span> <span className="font-semibold">{BANK_INFO.account}</span></p>
                  <p><span className="text-text-muted">예금주:</span> <span className="font-semibold">{BANK_INFO.holder}</span></p>
                </div>
                <button
                  onClick={resetChargeForm}
                  className="px-4 py-2 text-sm font-semibold border border-border text-text-secondary rounded-lg hover:bg-bg-subtle transition-colors"
                >
                  닫기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 패키지 선택 */}
                <div className="grid grid-cols-2 gap-3">
                  {CREDIT_PACKAGES.map((pkg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPackage(idx)}
                      className={clsx(
                        'relative p-4 rounded-xl border text-center transition-colors',
                        selectedPackage === idx
                          ? 'border-primary bg-primary/10'
                          : pkg.popular
                            ? 'border-warning/40 hover:border-warning/60'
                            : 'border-border hover:border-primary/40',
                      )}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-warning text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                          인기
                        </span>
                      )}
                      <p className="font-bold text-text-primary">{pkg.credits.toLocaleString()} 크레딧</p>
                      <p className="text-lg font-extrabold text-primary mt-1">{formatCurrency(pkg.price)}</p>
                      <p className="text-xs text-text-muted mt-0.5">1원 = 1크레딧</p>
                    </button>
                  ))}
                </div>

                {/* 입금 계좌 */}
                <div className="p-4 bg-bg-subtle border border-border/60 rounded-xl space-y-1.5">
                  <p className="text-sm font-semibold text-text-secondary mb-2">입금 계좌 정보</p>
                  {[
                    { label: '은행', value: BANK_INFO.bank },
                    { label: '계좌번호', value: BANK_INFO.account },
                    { label: '예금주', value: BANK_INFO.holder },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-text-muted">{row.label}</span>
                      <span className="font-semibold text-text-primary">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* 입금자명 */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">입금자명</label>
                  <input
                    type="text"
                    value={depositorName}
                    onChange={e => setDepositorName(e.target.value)}
                    placeholder="실제 입금자 이름을 정확히 입력하세요"
                    maxLength={20}
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
                    {chargeLoading ? '요청 중...' : '입금 완료 신청'}
                  </button>
                  <button
                    onClick={resetChargeForm}
                    className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-semibold hover:bg-bg-subtle transition-colors"
                  >
                    취소
                  </button>
                </div>

                <p className="text-xs text-text-muted">
                  입금 후 영업일 기준 1~2시간 내 확인 후 크레딧이 충전됩니다.<br />
                  문의: support@mychatbot.world
                </p>
              </div>
            )
          )}
        </div>

        {/* 크레딧 사용 내역 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold text-text-primary mb-4">크레딧 사용 내역</h2>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">아직 사용 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-1">
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
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSecurity() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">계정 보안 설정</h1>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold text-text-primary pb-4 border-b border-border mb-5">비밀번호 변경</h2>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">현재 비밀번호</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">새 비밀번호</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">새 비밀번호 확인</label>
              <input
                type="password"
                value={newPwConfirm}
                onChange={e => setNewPwConfirm(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {pwError && (
              <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">
                비밀번호가 안전하게 변경되었습니다.
              </p>
            )}

            <button
              onClick={changePassword}
              disabled={pwLoading}
              className="px-5 py-2.5 border border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary/10 disabled:opacity-50 transition-colors"
            >
              {pwLoading ? '변경 중...' : '비밀번호 보안 업데이트'}
            </button>
          </div>
        </div>

        {/* 추가 설정 링크 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-bold text-text-primary mb-4">추가 설정</h2>
          <div className="space-y-2">
            {[
              { href: '/mypage/inheritance',        icon: '🔒', title: '피상속 설정',  desc: '피상속인을 지정하고 조건을 설정하세요' },
              { href: '/mypage/inheritance-accept', icon: '📬', title: '피상속 수락',  desc: '내게 온 피상속 동의 요청을 확인하세요' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 p-4 rounded-xl bg-bg-subtle border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{item.desc}</p>
                </div>
                <span className="text-text-muted group-hover:text-primary transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabContent: Record<TabId, React.ReactNode> = {
    'profile':        renderProfile(),
    'bots':           renderBots(),
    'premium-skills': renderPremiumSkills(),
    'revenue':        renderRevenue(),
    'credits':        renderCredits(),
    'security':       renderSecurity(),
  };

  return (
    <>
      {/* 봇 설정 모달 */}
      {editingBot && (
        <BotSettingsModal
          bot={editingBot}
          onClose={() => setEditingBot(null)}
        />
      )}

      {/* 레이아웃: 사이드바 + 메인 콘텐츠 */}
      <div className="flex min-h-screen">
        {/* ── 사이드바 ── */}
        <aside className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col fixed h-screen top-0 pt-16 z-10">
          <div className="p-6 pb-4">
            <p className="text-lg font-extrabold text-primary flex items-center gap-2">
              🤖 <span>마이 페이지</span>
            </p>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all',
                  activeTab === item.id
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-bg-subtle hover:text-text-primary',
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 space-y-1 border-t border-border">
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors"
            >
              🏠 <span>메인 화면으로 이동</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-muted hover:bg-bg-subtle hover:text-text-primary transition-colors"
            >
              🔌 <span>로그아웃</span>
            </button>
          </div>
        </aside>

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 ml-64 p-10 max-w-3xl">
          {tabContent[activeTab]}
        </main>
      </div>
    </>
  );
}
