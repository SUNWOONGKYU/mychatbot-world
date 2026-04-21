'use client';

/**
 * @task S3F10 — 구봇구직 고용 요청 폼 페이지
 * @description 특정 코코봇에게 일감을 요청하는 폼 페이지 (Next.js 전환)
 *
 * Vanilla 원본: pages/jobs/hire.html + js/job-detail.js HirePage
 *
 * URL: /jobs/hire?bot_id={botId}
 * - 우측 사이드카드: GET /api/bots/public?id={bot_id}로 코코봇 정보 표시
 * - 폼 제출: POST /api/jobs/hire (Bearer 인증 필수)
 * - 성공 시 확인 모달 → /jobs/match?job_id= 링크
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabase';

interface BotInfo {
  id: string;
  name: string;
  avatar_url?: string;
  category?: string;
  hourly_rate?: number;
  per_job_price?: number;
  rating?: number;
  review_count?: number;
}

interface FormState {
  title: string;
  description: string;
  duration: string;
  category: string;
  budget_min: string;
  budget_max: string;
  requirements: string;
  agree: boolean;
}

const DURATION_OPTIONS = [
  { value: '1day',    label: '1일 이내' },
  { value: '3days',   label: '2~3일' },
  { value: '1week',   label: '1주일' },
  { value: '2weeks',  label: '2주일' },
  { value: '1month',  label: '1개월' },
  { value: '3months', label: '1~3개월' },
  { value: 'ongoing', label: '장기 (지속적)' },
];

const CATEGORY_OPTIONS = [
  { value: 'customer-service', label: '고객서비스' },
  { value: 'education',        label: '교육' },
  { value: 'marketing',        label: '마케팅' },
  { value: 'development',      label: '개발' },
  { value: 'etc',              label: '기타' },
];

function catLabel(cat?: string) {
  return CATEGORY_OPTIONS.find(c => c.value === cat)?.label ?? cat ?? '—';
}

function fmtNum(n: number) {
  return n.toLocaleString('ko-KR');
}

function starsText(rating: number) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function HirePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const botId = searchParams?.get('bot_id') ?? null;

  const [bot, setBot]         = useState<BotInfo | null>(null);
  const [botLoading, setBotLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]     = useState('');
  const [successJobId, setSuccessJobId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    title: '', description: '', duration: '', category: '',
    budget_min: '', budget_max: '', requirements: '', agree: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 4000);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 코코봇 정보 로드
  useEffect(() => {
    if (!botId) return;
    setBotLoading(true);
    fetch(`/api/bots/public?id=${encodeURIComponent(botId)}`)
      .then(r => {
        if (!r.ok) throw new Error(`코코봇 정보 로드 실패 (HTTP ${r.status})`);
        return r.json();
      })
      .then((d: { bot?: BotInfo; data?: BotInfo } & BotInfo) => {
        setBot(d.bot ?? d.data ?? d);
      })
      .catch(() => {
        // 사이드카드 로드 실패는 폼 사용에 영향 없음 — 빈 상태로 유지
      })
      .finally(() => setBotLoading(false));
  }, [botId]);

  const validate = useCallback(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim())       e.title       = '필수 항목입니다.';
    if (!form.description.trim()) e.description = '필수 항목입니다.';
    if (!form.duration)           e.duration    = '기간을 선택해주세요.';
    if (!form.category)           e.category    = '카테고리를 선택해주세요.';
    if (!form.agree)              e.agree       = '이용약관에 동의해주세요.';
    if (form.budget_min && isNaN(Number(form.budget_min))) e.budget_min = '숫자만 입력해주세요.';
    if (form.budget_max && isNaN(Number(form.budget_max))) e.budget_max = '숫자만 입력해주세요.';
    if (
      form.budget_min && form.budget_max &&
      !isNaN(Number(form.budget_min)) && !isNaN(Number(form.budget_max)) &&
      Number(form.budget_min) > Number(form.budget_max)
    ) {
      e.budget_min = '최소 예산은 최대 예산보다 클 수 없습니다.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? '';
    if (!token) {
      showToast('고용 요청을 하려면 로그인이 필요합니다.');
      return;
    }

    if (!botId) {
      showToast('코코봇 정보가 없습니다. URL을 확인해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          bot_id:       botId,
          title:        form.title.trim(),
          description:  form.description.trim(),
          duration:     form.duration,
          budget_min:   form.budget_min.trim() ? Number(form.budget_min) : undefined,
          budget_max:   form.budget_max.trim() ? Number(form.budget_max) : undefined,
          category:     form.category,
          requirements: form.requirements.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `HTTP ${res.status}`);
      }

      const result = await res.json() as { job_id?: string; data?: { id?: string } };
      const jobId = result.job_id ?? result.data?.id ?? null;
      if (!jobId) throw new Error('요청은 완료되었지만 job_id를 받지 못했습니다.');
      setForm({
        title: '', description: '', duration: '', category: '',
        budget_min: '', budget_max: '', requirements: '', agree: false,
      });
      setSuccessJobId(jobId);
    } catch (err) {
      const msg = (err as Error).message;
      // 서버 내부 스택 정보가 포함된 긴 메시지는 일반 안내로 대체
      const safeMsg = msg && msg.length < 120 ? msg : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      showToast(`요청 실패: ${safeMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
    },
  });

  // ── 렌더 ──
  return (
    <div style={{ minHeight: '100vh', background: 'rgb(var(--bg-base))', fontFamily: "'Noto Sans KR', 'Inter', sans-serif", color: 'rgb(var(--text-primary-rgb))' }}>

      {/* 헤더 */}
      <header style={{ background: 'rgb(var(--bg-surface))', borderBottom: '1px solid rgb(var(--border-subtle))', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/jobs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: 800, fontSize: '1.125rem', color: 'rgb(var(--text-primary-rgb))' }}>
            🤖 <span>구봇구직</span>
          </Link>
          <nav style={{ display: 'flex', gap: '1.25rem' }}>
            <Link href="/" style={{ textDecoration: 'none', fontSize: '0.875rem', color: 'rgb(var(--text-secondary-rgb))' }}>홈</Link>
            <Link href="/jobs" style={{ textDecoration: 'none', fontSize: '0.875rem', color: 'rgb(var(--text-secondary-rgb))' }}>구봇구직</Link>
          </nav>
        </div>
      </header>

      {/* 브레드크럼 */}
      <nav style={{ background: 'rgb(var(--bg-surface))', borderBottom: '1px solid rgb(var(--border-subtle))', padding: '0.625rem 1.5rem', fontSize: '0.8125rem', color: 'rgb(var(--text-muted))' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'rgb(var(--text-secondary-rgb))', textDecoration: 'none' }}>홈</Link>
          <span>›</span>
          <Link href="/jobs" style={{ color: 'rgb(var(--text-secondary-rgb))', textDecoration: 'none' }}>구봇구직</Link>
          <span>›</span>
          {botId && <><Link href={`/jobs/${botId}`} style={{ color: 'rgb(var(--text-secondary-rgb))', textDecoration: 'none' }}>코코봇 상세</Link><span>›</span></>}
          <span>고용 요청</span>
        </div>
      </nav>

      {/* 메인 */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.375rem' }}>고용 요청서 작성</h1>
          <p style={{ fontSize: '0.9375rem', color: 'rgb(var(--text-secondary-rgb))' }}>일감 정보를 상세하게 작성할수록 더 정확한 매칭이 이루어집니다.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* 좌: 폼 */}
          <form onSubmit={handleSubmit} noValidate style={{ background: 'rgb(var(--bg-surface))', borderRadius: '1rem', border: '1px solid rgb(var(--border-subtle))', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1.5rem' }}>일감 정보 입력</h2>

            {/* 일감 제목 */}
            <FormGroup label="일감 제목" required error={errors.title}>
              <input {...field('title')} maxLength={100} placeholder="예: 쇼핑몰 고객 문의 응대 코코봇 구축" style={inputStyle(!!errors.title)} />
              <span style={hintStyle}>최대 100자까지 입력 가능합니다.</span>
            </FormGroup>

            {/* 상세 설명 */}
            <FormGroup label="상세 설명" required error={errors.description}>
              <textarea {...field('description')} rows={6} placeholder="원하는 기능, 기대 결과, 참고 사항 등을 자세히 적어주세요." style={{ ...inputStyle(!!errors.description), resize: 'vertical', minHeight: 120 }} />
            </FormGroup>

            {/* 기간 + 카테고리 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormGroup label="예상 기간" required error={errors.duration}>
                <select {...field('duration')} style={inputStyle(!!errors.duration)}>
                  <option value="">기간 선택</option>
                  {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="카테고리" required error={errors.category}>
                <select {...field('category')} style={inputStyle(!!errors.category)}>
                  <option value="">카테고리 선택</option>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
            </div>

            {/* 예산 범위 */}
            <FormGroup label="예산 범위 (원)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'rgb(var(--text-secondary-rgb))', display: 'block', marginBottom: '0.375rem' }}>최소</label>
                  <input {...field('budget_min')} type="number" min={0} step={1000} placeholder="예: 50000" style={inputStyle(!!errors.budget_min)} />
                  {errors.budget_min && <span style={errorStyle}>{errors.budget_min}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'rgb(var(--text-secondary-rgb))', display: 'block', marginBottom: '0.375rem' }}>최대</label>
                  <input {...field('budget_max')} type="number" min={0} step={1000} placeholder="예: 200000" style={inputStyle(!!errors.budget_max)} />
                  {errors.budget_max && <span style={errorStyle}>{errors.budget_max}</span>}
                </div>
              </div>
              <span style={hintStyle}>비워두면 "협의"로 처리됩니다.</span>
            </FormGroup>

            {/* 추가 요구사항 */}
            <FormGroup label="추가 요구사항">
              <textarea {...field('requirements')} rows={3} placeholder="특별히 요구하는 기술 스택, 경험, 언어 등이 있다면 입력해주세요." style={{ ...inputStyle(false), resize: 'vertical', minHeight: 80 }} />
            </FormGroup>

            {/* 약관 동의 */}
            <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem', color: 'rgb(var(--text-secondary-rgb))' }}>
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={e => { setForm(f => ({ ...f, agree: e.target.checked })); if (errors.agree) setErrors(er => ({ ...er, agree: undefined })); }}
                  style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#6366f1' }}
                />
                <span>
                  <span style={{ color: '#6366f1', fontWeight: 600 }}>이용약관</span> 및{' '}
                  <span style={{ color: '#6366f1', fontWeight: 600 }}>개인정보처리방침</span>에 동의합니다.{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              {errors.agree && <span style={errorStyle}>{errors.agree}</span>}
            </div>

            {/* 제출 버튼 */}
            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.875rem 1.5rem', background: submitting ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {submitting ? '요청 중...' : (
                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg> 고용 요청 보내기</>
              )}
            </button>
          </form>

          {/* 우: 코코봇 사이드카드 */}
          <aside>
            <div style={{ background: 'rgb(var(--bg-surface))', borderRadius: '1rem', border: '1px solid rgb(var(--border-subtle))', padding: '1.5rem', position: 'sticky', top: 80 }}>
              {botLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgb(var(--text-muted))', fontSize: '0.875rem' }}>불러오는 중...</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '0.75rem', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#6366f1', flexShrink: 0, overflow: 'hidden' }}>
                      {bot?.avatar_url && /^https?:\/\//i.test(bot.avatar_url) ? (
                        <img src={bot.avatar_url} alt={bot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (bot?.name ?? '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <Link href={botId ? `/jobs/${botId}` : '#'} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'rgb(var(--text-primary-rgb))' }}>{bot?.name ?? '로딩 중...'}</div>
                      </Link>
                      <div style={{ fontSize: '0.8125rem', color: 'rgb(var(--text-secondary-rgb))' }}>{catLabel(bot?.category)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderTop: '1px solid rgb(var(--border-subtle))', fontSize: '0.875rem' }}>
                    <span style={{ color: 'rgb(var(--text-secondary-rgb))' }}>요금</span>
                    <span style={{ fontWeight: 600, color: 'rgb(var(--text-primary-rgb))' }}>
                      {bot?.hourly_rate ? `${fmtNum(bot.hourly_rate)}원/시간`
                        : bot?.per_job_price ? `${fmtNum(bot.per_job_price)}원/건`
                        : '협의'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', fontSize: '0.875rem', color: 'rgb(var(--text-secondary-rgb))' }}>
                    <span style={{ color: '#f59e0b', letterSpacing: '0.05em' }}>{starsText(bot?.rating ?? 0)}</span>
                    <span>{(bot?.rating ?? 0).toFixed(1)} ({fmtNum(bot?.review_count ?? 0)}개 리뷰)</span>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgb(var(--border-subtle))', fontSize: '0.8125rem', color: 'rgb(var(--text-secondary-rgb))', lineHeight: 1.6 }}>
                    고용 요청 후 코코봇이 수락하면 매칭이 완료됩니다. 플랫폼 수수료 <strong style={{ color: '#6366f1' }}>10%</strong>가 부과됩니다.
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.625rem' }}>진행 프로세스</h3>
                    <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[['1', '#6366f1', '#fff', '요청서 작성 & 전송'], ['2', '#ede9fe', '#6366f1', '코코봇 수락 대기'], ['3', '#ede9fe', '#6366f1', '매칭 완료 & 시작']].map(([n, bg, col, label]) => (
                        <li key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'rgb(var(--text-secondary-rgb))' }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: bg, color: col, fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
                          {label}
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}
            </div>
          </aside>

        </div>
      </main>

      {/* 성공 모달 */}
      {successJobId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: 'rgb(var(--bg-surface))', borderRadius: '1.5rem', padding: '2.5rem 2rem', maxWidth: 420, width: '100%', textAlign: 'center', color: 'rgb(var(--text-primary-rgb))' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.625rem' }}>고용 요청이 전송되었습니다!</h2>
            <p style={{ fontSize: '0.9375rem', color: 'rgb(var(--text-secondary-rgb))', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              코코봇에게 고용 요청이 전달되었습니다.<br />코코봇이 요청을 검토 후 수락하면 매칭이 완료됩니다.
            </p>
            {successJobId && (
              <div style={{ background: 'rgb(var(--bg-subtle))', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'rgb(var(--text-secondary-rgb))', textAlign: 'left' }}>
                <strong>요청 ID:</strong> {successJobId}<br />
                <strong>상태:</strong> 매칭 대기 중<br />
                <strong>예상 응답 시간:</strong> 24시간 이내
              </div>
            )}
            <Link href={`/jobs/match?job_id=${encodeURIComponent(successJobId)}`} style={{ display: 'block', padding: '0.875rem 1.5rem', background: '#6366f1', color: '#fff', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 700, marginBottom: '0.75rem' }}>
              매칭 결과 확인하기
            </Link>
            <button onClick={() => router.push('/jobs')} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1.5px solid rgb(var(--border-subtle))', borderRadius: '0.75rem', color: 'rgb(var(--text-secondary-rgb))', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>
              구봇구직 목록으로
            </button>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── 헬퍼 컴포넌트 ── */
const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%', padding: '0.625rem 0.875rem', border: `1.5px solid ${hasError ? '#ef4444' : 'rgb(var(--border-subtle))'}`,
  borderRadius: '0.625rem', fontSize: '0.9375rem', fontFamily: 'inherit', color: 'rgb(var(--text-primary-rgb))',
  background: 'rgb(var(--bg-base))', outline: 'none', boxSizing: 'border-box',
});

const hintStyle: React.CSSProperties = { fontSize: '0.8125rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem', display: 'block' };
const errorStyle: React.CSSProperties = { fontSize: '0.8125rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' };

function FormGroup({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgb(var(--text-primary-rgb))', marginBottom: '0.4rem' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}

export default function JobHirePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--text-muted))' }}>로딩 중...</div>}>
      <HirePageInner />
    </Suspense>
  );
}
