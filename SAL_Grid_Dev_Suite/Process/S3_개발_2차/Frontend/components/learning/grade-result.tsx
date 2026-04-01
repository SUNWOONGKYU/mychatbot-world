/**
 * @task S3FE1
 * @description 채점 결과 표시 컴포넌트 — 점수 게이지 (0~100), AI 피드백, 인증서 획득 메시지
 *
 * 85점 이상 시 인증서 획득 축하 메시지 표시.
 */

'use client';

import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 정의 ────────────────────────────────────────────────

export interface GradeResultProps {
  /** 점수 (0~100) */
  score: number;
  /** AI 피드백 텍스트 */
  feedback: string;
  /** 인증서 발급 여부 */
  certificationIssued: boolean;
  /** 발급된 인증서 ID (있을 경우) */
  certificationId?: string;
}

// ── 점수 게이지 ──────────────────────────────────────────────

interface ScoreGaugeProps {
  score: number;
}

function ScoreGauge({ score }: ScoreGaugeProps) {
  // 점수 구간별 색상
  const barColor =
    score >= 90 ? 'bg-success' :
    score >= 85 ? 'bg-info' :
    score >= 70 ? 'bg-warning' :
    'bg-error';

  const textColor =
    score >= 90 ? 'text-success' :
    score >= 85 ? 'text-info' :
    score >= 70 ? 'text-warning' :
    'text-error';

  const label =
    score >= 90 ? '최우수' :
    score >= 85 ? '우수 (인증서 획득)' :
    score >= 70 ? '양호' :
    '미흡';

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {/* 원형 점수 표시 */}
      <div
        className={clsx(
          'relative flex h-24 w-24 items-center justify-center rounded-full border-4',
          score >= 85 ? 'border-success' : score >= 70 ? 'border-warning' : 'border-error',
        )}
        role="img"
        aria-label={`점수 ${score}점`}
      >
        <span className={clsx('text-3xl font-bold tabular-nums', textColor)}>
          {score}
        </span>
        <span className="absolute bottom-3 text-xs text-text-muted font-medium">점</span>
      </div>

      {/* 등급 레이블 */}
      <span className={clsx('text-sm font-semibold', textColor)}>{label}</span>

      {/* 프로그레스 바 */}
      <div className="w-full">
        <div className="h-3 w-full rounded-full bg-bg-muted overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-700', barColor)}
            style={{ width: `${score}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {/* 85점 기준선 마커 */}
        <div className="relative mt-1">
          <div
            className="absolute -top-4 flex flex-col items-center"
            style={{ left: '85%', transform: 'translateX(-50%)' }}
          >
            <div className="h-4 w-px bg-text-muted/40" />
            <span className="text-xs text-text-muted whitespace-nowrap">85점</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 인증서 획득 배너 ─────────────────────────────────────────

interface CertBannerProps {
  certificationId?: string;
}

function CertBanner({ certificationId }: CertBannerProps) {
  return (
    <div
      className="rounded-xl border border-success/40 bg-success/5 p-5 space-y-3"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">🎉</span>
        <div>
          <p className="font-semibold text-success">인증서 획득!</p>
          <p className="text-sm text-text-secondary mt-0.5">
            85점 이상을 달성하여 인증서가 발급되었습니다. 수고하셨습니다!
          </p>
        </div>
      </div>

      {certificationId && (
        <p className="text-xs text-text-muted font-mono">
          인증서 ID: {certificationId.slice(0, 16)}...
        </p>
      )}

      <Link
        href="/learning/certificate"
        className={clsx(
          'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium',
          'bg-success text-white hover:bg-success/90 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success',
        )}
      >
        <span aria-hidden="true">🏆</span>
        <span>인증서 보러가기</span>
      </Link>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export function GradeResult({
  score,
  feedback,
  certificationIssued,
  certificationId,
}: GradeResultProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
      {/* 헤더 */}
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        채점 결과
      </h3>

      {/* 점수 게이지 */}
      <ScoreGauge score={score} />

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* AI 피드백 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">🤖</span>
          <h4 className="text-sm font-semibold text-text-primary">AI 피드백</h4>
        </div>
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {feedback}
        </p>
      </div>

      {/* 인증서 획득 배너 (85점 이상) */}
      {certificationIssued && (
        <CertBanner certificationId={certificationId} />
      )}

      {/* 85점 미만 격려 메시지 */}
      {!certificationIssued && score < 85 && (
        <div className="rounded-lg border border-border bg-bg-subtle p-4 text-sm text-text-secondary">
          <span className="mr-2" aria-hidden="true">💪</span>
          {score >= 70
            ? '조금 더 노력하면 인증서를 획득할 수 있습니다! 85점 이상이 목표입니다.'
            : '기초 개념을 다시 학습하고 재도전해보세요. 멘토 힌트를 활용해보세요.'}
        </div>
      )}
    </div>
  );
}
