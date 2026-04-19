'use client';

/**
 * @task S3F10 (React 전환)
 * @description 구봇구직 매칭 결과 페이지
 *
 * Vanilla 원본: pages/jobs/match.html
 * Route: /jobs/match?job_id={id}
 *
 * - job_id 파라미터로 일감 정보 요약 + 매칭된 봇 카드 목록 표시
 * - 매칭 알고리즘 설명 (접이식): skills 40% / rating 35% / salary 15% / category 10%
 * - 결과 없으면 POST /api/jobs/match 로 매칭 실행 후 재조회
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabase';

// ── 타입 ──────────────────────────────────────────────────────

interface JobPosting {
  id: string;
  title: string;
  description: string | null;
  required_skills: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
}

interface JobMatch {
  id: string;
  job_id: string;
  applicant_id: string;
  match_score: number;
  status: 'pending' | 'hired' | 'rejected';
  matched_at: string;
  reason?: string;
}

// ── 알고리즘 가중치 ───────────────────────────────────────────

const ALGO_FACTORS = [
  { label: '스킬 적합도',   weight: 40, color: '#818cf8' },
  { label: '평점 & 리뷰',   weight: 35, color: '#34d399' },
  { label: '가격 적합도',   weight: 15, color: '#f59e0b' },
  { label: '카테고리 일치', weight: 10, color: '#f87171' },
];

// ── 포맷 헬퍼 ─────────────────────────────────────────────────

function fmtBudget(min: number | null, max: number | null) {
  if (!min && !max) return '협의';
  if (min && max) return `₩${min.toLocaleString()} ~ ₩${max.toLocaleString()}`;
  if (min) return `₩${min.toLocaleString()} 이상`;
  return `₩${max!.toLocaleString()} 이하`;
}

function scoreColor(score: number) {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#818cf8';
  if (score >= 40) return '#f59e0b';
  return '#f87171';
}

function statusLabel(status: string) {
  if (status === 'hired')   return { text: '채용 확정', bg: 'rgba(52,211,153,0.15)', color: '#34d399' };
  if (status === 'rejected') return { text: '거절',    bg: 'rgba(248,113,113,0.15)', color: '#f87171' };
  return { text: '검토 중', bg: 'rgba(129,140,248,0.15)', color: '#818cf8' };
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function JobsMatchPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams?.get('job_id') ?? null;

  const [job, setJob]           = useState<JobPosting | null>(null);
  const [matches, setMatches]   = useState<JobMatch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState(false);
  const [error, setError]       = useState('');
  const [algoOpen, setAlgoOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 일감 + 매칭 결과 로드
  useEffect(() => {
    if (!jobId) { setError('job_id 파라미터가 없습니다.'); setLoading(false); return; }
    loadAll(jobId);
  }, [jobId]);

  async function loadAll(id: string) {
    setLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? '';
      setIsLoggedIn(!!token);

      // 일감 상세 (공개 API)
      const jobRes = await fetch(`/api/jobs/${id}`);
      if (!jobRes.ok) throw new Error('일감 정보를 불러올 수 없습니다.');
      const jobData = await jobRes.json();
      setJob(jobData.job ?? jobData);

      // 매칭 결과 (인증 필요)
      if (token) {
        const matchRes = await fetch(`/api/jobs/match?job_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatches(matchData.matches ?? []);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 매칭 실행 (POST)
  async function runMatching() {
    if (!jobId) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? '';
    if (!token) return;
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/jobs/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '매칭 실행에 실패했습니다.');
      setMatches(data.matches ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '매칭 실행 중 오류가 발생했습니다.');
    } finally {
      setRunning(false);
    }
  }

  // ── 공통 스타일 ────────────────────────────────────────────

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: 'rgb(var(--bg-base))',
    color: 'rgb(var(--text-primary))',
    paddingBottom: '4rem',
  };

  const container: React.CSSProperties = {
    maxWidth: 860,
    margin: '0 auto',
    padding: '2rem 1.25rem',
  };

  // ── 렌더 ──────────────────────────────────────────────────

  return (
    <div style={page}>
      <div style={container}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800,
              color: 'rgb(var(--text-primary))', marginBottom: '.375rem' }}>
              코코봇 매칭 결과
            </h1>
            <p style={{ fontSize: '.9375rem', color: 'rgb(var(--text-muted))' }}>
              일감에 가장 적합한 코코봇을 AI가 추천해드립니다.
            </p>
          </div>
          <Link href="/jobs" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.375rem',
            padding: '.5rem 1.125rem',
            border: '1.5px solid rgb(var(--border-subtle))',
            borderRadius: 999, fontSize: '.875rem', fontWeight: 600,
            color: 'rgb(var(--text-muted))', textDecoration: 'none',
          }}>
            ← 목록으로
          </Link>
        </div>

        {/* 오류 */}
        {error && (
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12,
            color: '#f87171', marginBottom: '1.5rem', fontSize: '.9rem' }}>
            {error}
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[100, 160, 160].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 14,
                background: 'rgb(var(--bg-surface))',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {!loading && job && (
          <>
            {/* 일감 요약 카드 */}
            <div style={{
              background: 'rgb(var(--bg-surface))',
              border: '1px solid rgb(var(--border-subtle))',
              borderRadius: 14, padding: '1.25rem 1.5rem',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
            }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700,
                  color: 'rgb(var(--text-primary))', marginBottom: '.625rem' }}>
                  {job.title}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                  {[
                    { icon: '💰', text: `예산: ${fmtBudget(job.budget_min, job.budget_max)}` },
                    { icon: '🔧', text: `스킬: ${job.required_skills?.join(', ') || '제한 없음'}` },
                    { icon: '📋', text: `상태: ${job.status === 'open' ? '모집 중' : job.status === 'filled' ? '마감' : '종료'}` },
                  ].map(tag => (
                    <span key={tag.text} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                      padding: '.25rem .75rem',
                      background: 'rgba(129,140,248,0.1)',
                      border: '1px solid rgba(129,140,248,0.2)',
                      borderRadius: 999, fontSize: '.8125rem',
                      color: 'rgb(var(--text-secondary))',
                    }}>
                      {tag.icon} {tag.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* 매칭 수 배지 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                padding: '.375rem .875rem',
                background: 'rgba(129,140,248,0.12)',
                border: '1px solid rgba(129,140,248,0.25)',
                borderRadius: 999, fontSize: '.875rem', fontWeight: 700,
                color: '#818cf8', whiteSpace: 'nowrap',
              }}>
                ✨ 매칭 {matches.length}건
              </div>
            </div>

            {/* 알고리즘 설명 (접이식) */}
            <div style={{
              background: 'rgb(var(--bg-surface))',
              border: '1px solid rgb(var(--border-subtle))',
              borderRadius: 14, marginBottom: '1.25rem', overflow: 'hidden',
            }}>
              <button
                onClick={() => setAlgoOpen(v => !v)}
                style={{
                  width: '100%', padding: '.875rem 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'rgb(var(--text-secondary))', fontSize: '.875rem', fontWeight: 600,
                }}
                aria-expanded={algoOpen}
              >
                <span>🧠 매칭 알고리즘이 궁금하신가요?</span>
                <span style={{ transition: 'transform .2s', display: 'inline-block',
                  transform: algoOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>

              {algoOpen && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgb(var(--border-subtle))' }}>
                  <p style={{ fontSize: '.875rem', color: 'rgb(var(--text-muted))',
                    margin: '.875rem 0 1rem' }}>
                    AI 매칭 알고리즘은 4가지 요소를 종합 분석하여 최적의 코코봇을 추천합니다.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {ALGO_FACTORS.map(f => (
                      <div key={f.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontSize: '.8125rem', fontWeight: 600, marginBottom: '.3rem' }}>
                          <span style={{ color: 'rgb(var(--text-secondary))' }}>{f.label}</span>
                          <span style={{ color: f.color }}>{f.weight}%</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                          <div style={{ height: '100%', width: `${f.weight}%`,
                            background: f.color, borderRadius: 4, transition: 'width .5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 매칭 결과 없음 → 실행 버튼 */}
            {matches.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '3rem 1rem',
                background: 'rgb(var(--bg-surface))',
                border: '1px solid rgb(var(--border-subtle))',
                borderRadius: 14,
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700,
                  color: 'rgb(var(--text-primary))', marginBottom: '.5rem' }}>
                  매칭 결과가 없습니다
                </h3>
                <p style={{ fontSize: '.9rem', color: 'rgb(var(--text-muted))',
                  marginBottom: '1.5rem', lineHeight: 1.7 }}>
                  {isLoggedIn
                    ? 'AI 매칭을 실행하여 적합한 코코봇을 찾아보세요.'
                    : '로그인 후 매칭을 실행할 수 있습니다.'}
                </p>
                {isLoggedIn ? (
                  <button
                    onClick={runMatching}
                    disabled={running}
                    style={{
                      padding: '.625rem 1.5rem',
                      background: running ? 'rgba(129,140,248,0.3)' : '#818cf8',
                      color: '#fff', border: 'none', borderRadius: 999,
                      fontSize: '.9rem', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {running ? '매칭 실행 중...' : '✨ AI 매칭 실행'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/jobs" style={{
                      padding: '.625rem 1.375rem', background: '#818cf8',
                      color: '#fff', borderRadius: 999, fontSize: '.875rem',
                      fontWeight: 700, textDecoration: 'none',
                    }}>코코봇 직접 찾기</Link>
                    <Link href="/login" style={{
                      padding: '.625rem 1.375rem', background: 'transparent',
                      color: '#818cf8', border: '1.5px solid #818cf8',
                      borderRadius: 999, fontSize: '.875rem', fontWeight: 700, textDecoration: 'none',
                    }}>로그인</Link>
                  </div>
                )}
              </div>
            )}

            {/* 매칭 카드 목록 */}
            {matches.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {matches.map((m, idx) => {
                  const st = statusLabel(m.status);
                  const sc = m.match_score ?? 0;
                  return (
                    <div key={m.id ?? m.applicant_id} style={{
                      background: 'rgb(var(--bg-surface))',
                      border: '1px solid rgb(var(--border-subtle))',
                      borderRadius: 14, padding: '1.25rem 1.5rem',
                    }}>
                      {/* 상단: 순위 + 점수 + 상태 */}
                      <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '1rem',
                        flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          {/* 순위 뱃지 */}
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: idx === 0 ? 'rgba(251,191,36,0.2)' : 'rgba(129,140,248,0.1)',
                            border: `2px solid ${idx === 0 ? '#fbbf24' : 'rgba(129,140,248,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '.875rem',
                            color: idx === 0 ? '#fbbf24' : '#818cf8',
                          }}>
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: '.8125rem', color: 'rgb(var(--text-muted))' }}>
                              지원자 ID
                            </div>
                            <div style={{ fontSize: '.9375rem', fontWeight: 700,
                              color: 'rgb(var(--text-primary))', fontFamily: 'monospace' }}>
                              {m.applicant_id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
                          {/* 상태 뱃지 */}
                          <span style={{
                            padding: '.25rem .75rem',
                            background: st.bg, color: st.color,
                            borderRadius: 999, fontSize: '.8rem', fontWeight: 600,
                          }}>{st.text}</span>

                          {/* 점수 원형 */}
                          <div style={{
                            width: 52, height: 52, borderRadius: '50%',
                            border: `3px solid ${scoreColor(sc)}`,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800,
                              color: scoreColor(sc), lineHeight: 1 }}>{sc}</span>
                            <span style={{ fontSize: '.5rem', color: 'rgb(var(--text-muted))',
                              lineHeight: 1 }}>점</span>
                          </div>
                        </div>
                      </div>

                      {/* 점수 바 */}
                      <div style={{ marginBottom: '.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          fontSize: '.75rem', color: 'rgb(var(--text-muted))',
                          marginBottom: '.3rem' }}>
                          <span>매칭 점수</span>
                          <span style={{ color: scoreColor(sc), fontWeight: 700 }}>{sc}%</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                          <div style={{
                            height: '100%', width: `${sc}%`,
                            background: scoreColor(sc),
                            borderRadius: 4, transition: 'width .6s ease',
                          }} />
                        </div>
                      </div>

                      {/* 매칭 이유 */}
                      {m.reason && (
                        <p style={{
                          fontSize: '.8125rem', color: 'rgb(var(--text-muted))',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8, padding: '.625rem .875rem',
                          lineHeight: 1.6, margin: 0,
                        }}>
                          💡 {m.reason}
                        </p>
                      )}

                      {/* 매칭 일시 */}
                      <div style={{ marginTop: '.75rem', fontSize: '.75rem',
                        color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
                        매칭: {new Date(m.matched_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* job_id 없을 때 */}
        {!loading && !job && !error && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem',
            color: 'rgb(var(--text-muted))' }}>
            <p>일감 ID가 필요합니다.</p>
            <Link href="/jobs" style={{
              display: 'inline-block', marginTop: '1rem',
              color: '#818cf8', textDecoration: 'none', fontWeight: 600,
            }}>← 구봇구직으로 이동</Link>
          </div>
        )}

      </div>
    </div>
  );
}
