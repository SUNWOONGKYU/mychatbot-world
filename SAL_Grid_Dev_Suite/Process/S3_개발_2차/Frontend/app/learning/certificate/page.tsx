/**
 * @task S3FE1
 * @description 인증서 목록 페이지 — 획득한 인증서 목록, 상세 뷰 (날짜, 점수, 커리큘럼명)
 *
 * Route: /learning/certificate
 * - GET /api/school/grade  → certification_issued=true 인 결과를 인증서로 처리
 *   (별도 /api/school/certificate 엔드포인트 추가 전까지 session + grade 데이터 활용)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 정의 ────────────────────────────────────────────────

/** 인증서 데이터 (grade API 응답 + session 메타데이터 합산) */
interface Certificate {
  id: string;
  session_id: string;
  curriculum_id: string;
  score: number;
  issued_at: string;
  scenario_type: string;
}

// ── 헬퍼 ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 90 ? 'text-success' :
    score >= 85 ? 'text-info' :
    'text-warning';

  return (
    <span className={clsx('text-3xl font-bold tabular-nums', color)}>
      {score}
      <span className="text-base font-normal text-text-muted">점</span>
    </span>
  );
}

// ── 인증서 상세 모달 ─────────────────────────────────────────

interface CertificateDetailProps {
  cert: Certificate;
  onClose: () => void;
}

function CertificateDetail({ cert, onClose }: CertificateDetailProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="인증서 상세"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-8 space-y-6">
        {/* 인증서 헤더 */}
        <div className="text-center space-y-2">
          <div className="text-5xl" aria-hidden="true">🏆</div>
          <h2 className="text-xl font-bold text-text-primary">학습 인증서</h2>
          <p className="text-sm text-text-secondary">우수한 성적으로 커리큘럼을 완료했습니다.</p>
        </div>

        {/* 구분선 */}
        <div className="border-t border-border" />

        {/* 상세 정보 */}
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <dt className="text-text-secondary">커리큘럼</dt>
            <dd className="font-semibold text-text-primary">{cert.curriculum_id}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-text-secondary">세션 유형</dt>
            <dd className="font-medium text-text-primary capitalize">{cert.scenario_type}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-text-secondary">점수</dt>
            <dd>
              <ScoreGauge score={cert.score} />
            </dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-text-secondary">발급일</dt>
            <dd className="font-medium text-text-primary">{formatDate(cert.issued_at)}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-text-secondary">인증서 ID</dt>
            <dd className="font-mono text-xs text-text-muted">{cert.id.slice(0, 8)}...</dd>
          </div>
        </dl>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className={clsx(
            'w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
            'bg-bg-subtle text-text-primary hover:bg-bg-muted border border-border',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

// ── 인증서 카드 ─────────────────────────────────────────────

interface CertificateCardProps {
  cert: Certificate;
  onView: (cert: Certificate) => void;
}

function CertificateCard({ cert, onView }: CertificateCardProps) {
  return (
    <button
      onClick={() => onView(cert)}
      className={clsx(
        'group w-full text-left rounded-xl border border-border bg-surface p-5 space-y-3',
        'hover:border-primary/50 hover:bg-primary/5 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
            {cert.curriculum_id}
          </p>
          <p className="text-xs text-text-muted mt-0.5 capitalize">
            {cert.scenario_type}
          </p>
        </div>
        <span className="text-2xl shrink-0" aria-hidden="true">🏆</span>
      </div>

      <div className="flex items-center justify-between">
        <ScoreGauge score={cert.score} />
        <span className="text-xs text-text-muted">{formatDate(cert.issued_at)}</span>
      </div>

      <div
        className={clsx(
          'h-1.5 w-full rounded-full bg-bg-muted overflow-hidden',
        )}
      >
        <div
          className="h-full rounded-full bg-success"
          style={{ width: `${cert.score}%` }}
        />
      </div>
    </button>
  );
}

// ── 스켈레톤 ────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-5 space-y-3 animate-pulse"
        >
          <div className="h-4 bg-bg-muted rounded w-2/3" />
          <div className="h-8 bg-bg-muted rounded w-1/3" />
          <div className="h-1.5 bg-bg-muted rounded-full w-full" />
        </div>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export default function CertificatePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Certificate | null>(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // session 목록을 불러온 뒤 score >= 85 이고 completed인 것을 인증서로 취급
      const res = await fetch('/api/school/session');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const sessions: Array<{
        id: string;
        curriculum_id: string;
        scenario_type: string;
        status: string;
        score: number | null;
        completed_at: string | null;
      }> = data.sessions ?? [];

      // score >= 85 이고 완료된 세션 → 인증서로 변환
      const certs: Certificate[] = sessions
        .filter((s) => s.status === 'completed' && s.score !== null && s.score >= 85)
        .map((s) => ({
          id: s.id,
          session_id: s.id,
          curriculum_id: s.curriculum_id,
          score: s.score!,
          issued_at: s.completed_at ?? new Date().toISOString(),
          scenario_type: s.scenario_type,
        }));

      setCertificates(certs);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증서 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Link
            href="/learning"
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            aria-label="학습 대시보드로 돌아가기"
          >
            ← 대시보드
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text-primary">내 인증서</h1>
          <p className="text-sm text-text-secondary mt-1">
            85점 이상 획득한 학습 세션의 인증서입니다.
          </p>
        </div>

        {/* 에러 */}
        {error && (
          <div className="rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchCertificates}
              className="ml-4 text-xs underline hover:no-underline shrink-0"
            >
              재시도
            </button>
          </div>
        )}

        {/* 콘텐츠 */}
        {loading ? (
          <SkeletonGrid />
        ) : certificates.length === 0 && !error ? (
          <div className="rounded-xl border border-dashed border-border bg-bg-subtle p-12 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">🎓</div>
            <p className="text-text-secondary font-medium">아직 획득한 인증서가 없습니다.</p>
            <p className="text-xs text-text-muted mt-2">
              85점 이상을 받으면 인증서가 자동으로 발급됩니다.
            </p>
            <Link
              href="/learning/curriculum"
              className={clsx(
                'mt-4 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium',
                'bg-primary text-white hover:bg-primary-hover transition-colors',
              )}
            >
              커리큘럼 시작하기
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              총{' '}
              <span className="font-semibold text-text-primary">{certificates.length}</span>
              개의 인증서를 획득했습니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  onView={setSelected}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <CertificateDetail
          cert={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
