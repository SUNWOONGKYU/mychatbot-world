/**
 * @task S3FE1
 * @description 시나리오 학습 세션 컴포넌트 — 시나리오 표시, 답변 입력, 채점, 멘토 힌트
 *
 * 사용 API:
 * - POST /api/school/grade  — 채점 요청
 * - POST /api/school/mentor — 멘토 힌트 요청
 */

'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { GradeResult } from './grade-result';

// ── 타입 정의 ────────────────────────────────────────────────

export interface SessionProps {
  /** 학습 세션 ID */
  sessionId: string;
  /** 시나리오 텍스트 (AI 생성) */
  scenario: string;
  /** 커리큘럼 ID (채점 기준 제목으로 활용) */
  curriculumId?: string;
}

export interface GradeData {
  score: number;
  feedback: string;
  session_id: string;
  certification_issued: boolean;
  certification_id?: string;
}

interface MentorResponse {
  hint: string;
  guidance: string;
  follow_up_questions: string[];
}

// ── 멘토 힌트 패널 ───────────────────────────────────────────

interface MentorPanelProps {
  mentor: MentorResponse;
  onClose: () => void;
}

function MentorPanel({ mentor, onClose }: MentorPanelProps) {
  return (
    <div className="rounded-xl border border-info/30 bg-info/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">💡</span>
          <h3 className="text-sm font-semibold text-info">멘토 힌트</h3>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors text-sm"
          aria-label="멘토 힌트 닫기"
        >
          ✕
        </button>
      </div>

      {/* 힌트 */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">힌트</p>
        <p className="text-sm text-text-primary">{mentor.hint}</p>
      </div>

      {/* 가이드 */}
      {mentor.guidance && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">가이드</p>
          <p className="text-sm text-text-primary">{mentor.guidance}</p>
        </div>
      )}

      {/* 후속 질문 */}
      {mentor.follow_up_questions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">생각해볼 질문</p>
          <ul className="space-y-1.5">
            {mentor.follow_up_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                <span className="text-info mt-0.5 shrink-0">›</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

export function LearningSession({ sessionId, scenario, curriculumId }: SessionProps) {
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<GradeData | null>(null);
  const [mentor, setMentor] = useState<MentorResponse | null>(null);

  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);

  // ── 채점 요청 ──────────────────────────────────────────────

  const handleGrade = useCallback(async () => {
    if (!answer.trim()) return;

    setGrading(true);
    setGradeError(null);
    setMentor(null); // 재채점 시 힌트 패널 닫기

    try {
      const res = await fetch('/api/school/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_answer: answer,
          criteria: curriculumId
            ? `커리큘럼 "${curriculumId}" 기준으로 평가해주세요.`
            : '전반적인 이해도와 답변 완성도를 기준으로 평가해주세요.',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      const data: GradeData = await res.json();
      setGrade(data);
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : '채점 중 오류가 발생했습니다.');
    } finally {
      setGrading(false);
    }
  }, [answer, sessionId, curriculumId]);

  // ── 멘토 힌트 요청 ─────────────────────────────────────────

  const handleMentor = useCallback(async () => {
    if (!answer.trim()) return;

    setMentorLoading(true);
    setMentorError(null);

    try {
      const res = await fetch('/api/school/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question: answer || '이 시나리오에 대해 어떻게 접근해야 할까요?',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      const data: MentorResponse = await res.json();
      setMentor(data);
    } catch (err) {
      setMentorError(err instanceof Error ? err.message : '멘토 힌트를 불러오지 못했습니다.');
    } finally {
      setMentorLoading(false);
    }
  }, [answer, sessionId]);

  const canSubmit = answer.trim().length > 0 && !grading;

  return (
    <div className="space-y-6">

      {/* 시나리오 카드 */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">📋</span>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            시나리오
          </h2>
        </div>
        <p className="text-text-primary leading-relaxed whitespace-pre-wrap text-sm">
          {scenario}
        </p>
      </div>

      {/* 멘토 힌트 패널 */}
      {mentor && (
        <MentorPanel mentor={mentor} onClose={() => setMentor(null)} />
      )}

      {/* 멘토 에러 */}
      {mentorError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-xs text-error">
          {mentorError}
        </div>
      )}

      {/* 답변 입력 영역 */}
      <div className="space-y-2">
        <label
          htmlFor="answer-textarea"
          className="text-sm font-medium text-text-primary"
        >
          내 답변
        </label>
        <textarea
          id="answer-textarea"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={grading}
          placeholder="시나리오에 대한 답변을 작성하세요..."
          rows={8}
          className={clsx(
            'w-full rounded-xl border bg-surface text-text-primary text-sm',
            'px-4 py-3 placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'resize-y transition-colors',
            grading
              ? 'opacity-60 cursor-not-allowed border-border'
              : 'border-border hover:border-border-strong',
          )}
        />
        <p className="text-xs text-text-muted text-right">
          {answer.length} 자
        </p>
      </div>

      {/* 채점 에러 */}
      {gradeError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-xs text-error">
          {gradeError}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 멘토 힌트 버튼 */}
        <button
          onClick={handleMentor}
          disabled={mentorLoading || !answer.trim()}
          className={clsx(
            'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'border border-border bg-surface transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            mentorLoading || !answer.trim()
              ? 'opacity-50 cursor-not-allowed text-text-muted'
              : 'text-text-primary hover:bg-surface-hover',
          )}
        >
          {mentorLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>힌트 요청 중...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">💡</span>
              <span>멘토 힌트 요청</span>
            </>
          )}
        </button>

        {/* 채점 버튼 */}
        <button
          onClick={handleGrade}
          disabled={!canSubmit}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            canSubmit
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'bg-bg-muted text-text-muted cursor-not-allowed',
          )}
        >
          {grading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>채점 중...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">✓</span>
              <span>채점 요청</span>
            </>
          )}
        </button>
      </div>

      {/* 채점 결과 */}
      {grade && (
        <GradeResult
          score={grade.score}
          feedback={grade.feedback}
          certificationIssued={grade.certification_issued}
          certificationId={grade.certification_id}
        />
      )}
    </div>
  );
}
