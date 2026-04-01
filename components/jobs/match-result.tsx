/**
 * @task S3FE3
 * @description AI 매칭 결과 컴포넌트
 *
 * - 매칭 점수 게이지 (0~100%)
 * - 매칭 이유(reason) 텍스트 표시
 * - "매칭 요청" 버튼 → POST /api/jobs/match
 * - 기존 매칭 결과 조회 → GET /api/jobs/match?job_id=
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

// ── 타입 ─────────────────────────────────────────────────────

interface MatchResultItem {
  id?: string;
  job_id?: string;
  applicant_id?: string;
  match_score?: number;
  score?: number;          // POST 응답 형식 (MatchResult)
  reason?: string;
  matched_at?: string;
  status?: 'pending' | 'hired' | 'rejected';
}

interface MatchResultProps {
  jobId: string;
  /**
   * true이면 컴포넌트 마운트 시 자동으로 기존 매칭 결과를 로드합니다.
   */
  autoLoad?: boolean;
}

// ── 점수 컬러 ─────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-error';
}

function getGaugeColor(score: number): string {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-error';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '최적 매칭';
  if (score >= 75) return '높은 매칭';
  if (score >= 60) return '보통 매칭';
  if (score >= 40) return '낮은 매칭';
  return '미흡';
}

// ── 점수 게이지 ──────────────────────────────────────────────

interface ScoreGaugeProps {
  score: number;
}

function ScoreGauge({ score }: ScoreGaugeProps) {
  return (
    <div className="flex items-center gap-4">
      {/* 원형 표시 */}
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          {/* 배경 트랙 */}
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            strokeWidth="6"
            className="stroke-bg-muted"
          />
          {/* 점수 호 */}
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            strokeWidth="6"
            strokeDasharray={`${(score / 100) * 163.36} 163.36`}
            strokeLinecap="round"
            className={score >= 80 ? 'stroke-success' : score >= 60 ? 'stroke-warning' : 'stroke-error'}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </span>
          <span className={`text-xs font-medium ${getScoreColor(score)}`}>{score}%</span>
        </div>
        {/* 바 게이지 */}
        <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${getGaugeColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-text-muted text-xs mt-1">AI 매칭 점수</p>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export function MatchResult({ jobId, autoLoad = false }: MatchResultProps) {
  const [results, setResults] = useState<MatchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 기존 매칭 결과 조회
  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sb-access-token') ?? '';
      const res = await fetch(`/api/jobs/match?job_id=${jobId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // 인증 오류 시 조용히 처리
        if (res.status === 401) {
          setLoaded(true);
          return;
        }
        throw new Error(body.error ?? '매칭 결과를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setResults(data.matches ?? []);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // 매칭 요청
  const requestMatch = async () => {
    setRequesting(true);
    setError(null);
    try {
      const token = localStorage.getItem('sb-access-token') ?? '';
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }
      const res = await fetch('/api/jobs/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_id: jobId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '매칭 요청에 실패했습니다.');
      }
      const data = await res.json();
      // POST 결과로 matches 업데이트
      if (data.matches) {
        setResults(data.matches);
      } else {
        // 결과 재조회
        await loadResults();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setRequesting(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !loaded) {
      loadResults();
    }
  }, [autoLoad, loaded, loadResults]);

  // 나의 매칭 점수 (가장 높은 점수 표시)
  const myBestMatch = results.reduce<MatchResultItem | null>((best, m) => {
    const score = m.match_score ?? m.score ?? 0;
    const bestScore = best ? (best.match_score ?? best.score ?? 0) : -1;
    return score > bestScore ? m : best;
  }, null);

  const displayScore = myBestMatch
    ? (myBestMatch.match_score ?? myBestMatch.score ?? 0)
    : null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">AI 매칭 점수</h2>
        <button
          onClick={requestMatch}
          disabled={requesting || loading}
          className="text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {requesting ? '요청 중...' : '매칭 요청'}
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-muted rounded animate-pulse w-3/4" />
            <div className="h-2 bg-bg-muted rounded animate-pulse" />
            <div className="h-3 bg-bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
      )}

      {/* 점수 없음 (미로드 또는 매칭 없음) */}
      {!loading && displayScore === null && (
        <div className="text-center py-6 text-text-muted">
          {!loaded ? (
            <>
              <p className="text-2xl mb-2">🤖</p>
              <p className="text-sm mb-3">AI가 이 공고와 나의 매칭 점수를 분석합니다.</p>
              <button
                onClick={() => { loadResults(); }}
                className="text-xs text-primary hover:underline"
              >
                결과 불러오기
              </button>
            </>
          ) : (
            <>
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm">아직 매칭 점수가 없습니다.</p>
              <p className="text-xs mt-1 text-text-muted">위의 &quot;매칭 요청&quot; 버튼을 눌러 점수를 확인하세요.</p>
            </>
          )}
        </div>
      )}

      {/* 점수 표시 */}
      {!loading && displayScore !== null && (
        <div className="space-y-4">
          <ScoreGauge score={displayScore} />

          {/* 매칭 이유 */}
          {myBestMatch?.reason && (
            <div className="bg-bg-subtle border border-border rounded-xl p-3">
              <p className="text-xs font-medium text-text-secondary mb-1">매칭 분석</p>
              <p className="text-sm text-text-primary leading-relaxed">{myBestMatch.reason}</p>
            </div>
          )}

          {/* 상태 배지 */}
          {myBestMatch?.status && myBestMatch.status !== 'pending' && (
            <div
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                myBestMatch.status === 'hired'
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-error/10 text-error border border-error/20'
              }`}
            >
              {myBestMatch.status === 'hired' ? '✓ 채용 확정' : '✗ 불합격'}
            </div>
          )}

          {/* 여러 매칭 결과 (고용주 뷰) */}
          {results.length > 1 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-text-secondary mb-3">
                지원자 매칭 결과 ({results.length}명)
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {results
                  .sort((a, b) => ((b.match_score ?? b.score ?? 0) - (a.match_score ?? a.score ?? 0)))
                  .map((m, i) => {
                    const s = m.match_score ?? m.score ?? 0;
                    return (
                      <div key={m.id ?? i} className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-4">{i + 1}</span>
                        <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getGaugeColor(s)}`}
                            style={{ width: `${s}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium w-8 text-right ${getScoreColor(s)}`}>
                          {s}
                        </span>
                        {m.status && m.status !== 'pending' && (
                          <span
                            className={`text-xs ${m.status === 'hired' ? 'text-success' : 'text-text-muted'}`}
                          >
                            {m.status === 'hired' ? '확정' : ''}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
