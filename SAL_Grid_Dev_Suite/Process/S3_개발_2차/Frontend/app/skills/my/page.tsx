/**
 * @task S3FE2
 * @description 내 스킬 페이지 — 설치된 스킬 목록, 실행 횟수, 마지막 사용일, 제거
 * Route: /skills/my
 * API:
 *   GET    /api/skills/my
 *   DELETE /api/skills/install  { skill_id }
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

// ── 타입 ────────────────────────────────────────────────────────

interface InstalledSkill {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  rating: number;
  thumbnail_url: string | null;
  installed_at: string;
  last_used_at: string | null;
  usage_count: number;
  version: string;
}

// ── 서브 컴포넌트 ────────────────────────────────────────────────

function InstalledSkillRow({
  skill,
  onUninstall,
  removing,
}: {
  skill: InstalledSkill;
  onUninstall: (skillId: string) => void;
  removing: boolean;
}) {
  const lastUsed = skill.last_used_at
    ? new Date(skill.last_used_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '사용 기록 없음';

  const installedDate = new Date(skill.installed_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row items-start sm:items-center gap-4',
        'rounded-xl border border-border bg-surface p-4',
        'hover:border-primary/30 transition-colors',
      )}
    >
      {/* 아이콘 */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {skill.thumbnail_url ? (
          <img
            src={skill.thumbnail_url}
            alt={skill.name}
            className="w-full h-full rounded-xl object-cover"
          />
        ) : (
          <span className="text-xl">⚡</span>
        )}
      </div>

      {/* 메타 */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/skills/${skill.skill_id}`}
            className="font-medium text-sm text-text-primary hover:text-primary transition-colors truncate"
          >
            {skill.name}
          </Link>
          <span className="text-xs text-text-muted bg-bg-subtle px-2 py-0.5 rounded-full shrink-0">
            v{skill.version}
          </span>
        </div>
        <p className="text-xs text-text-secondary truncate">{skill.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>설치: {installedDate}</span>
          <span>마지막 사용: {lastUsed}</span>
          <span className="font-medium text-primary">실행 {skill.usage_count.toLocaleString()}회</span>
        </div>
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/skills/${skill.skill_id}?tab=run`}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium',
            'bg-primary text-white',
            'hover:bg-primary-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          실행
        </Link>
        <button
          onClick={() => onUninstall(skill.skill_id)}
          disabled={removing}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium',
            'border border-border text-text-secondary',
            'hover:bg-surface-hover hover:border-error/40 hover:text-error transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {removing ? '...' : '제거'}
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-5xl mb-4">📦</span>
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        설치된 스킬이 없습니다
      </h3>
      <p className="text-sm text-text-secondary mb-6">
        스킬 마켓에서 원하는 스킬을 찾아 설치해보세요.
      </p>
      <Link
        href="/skills"
        className={clsx(
          'px-5 py-2.5 rounded-lg text-sm font-medium',
          'bg-primary text-white',
          'hover:bg-primary-hover transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        스킬 마켓 보기
      </Link>
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────

export default function MySkillsPage() {
  const [skills, setSkills] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const fetchMySkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/skills/my');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSkills(data?.skills ?? data?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '내 스킬 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySkills();
  }, [fetchMySkills]);

  const handleUninstall = async (skillId: string) => {
    if (!confirm('이 스킬을 제거하시겠습니까?')) return;
    setRemovingId(skillId);
    setRemoveError(null);
    try {
      const res = await fetch('/api/skills/install', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : '스킬 제거에 실패했습니다.');
    } finally {
      setRemovingId(null);
    }
  };

  // ── 통계 요약 ─────────────────────────────────────────────

  const totalUsage = skills.reduce((sum, s) => sum + s.usage_count, 0);

  // ── 렌더 ────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/skills"
              className="text-sm text-text-muted hover:text-primary transition-colors"
            >
              스킬 마켓
            </Link>
            <span className="text-text-muted">/</span>
            <h1 className="text-lg font-bold text-text-primary">내 스킬</h1>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            설치된 스킬을 관리하고 실행하세요.
          </p>
        </div>
        <Link
          href="/skills"
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-primary text-white',
            'hover:bg-primary-hover transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
        >
          <span>+</span>
          <span>스킬 추가</span>
        </Link>
      </div>

      {/* 통계 카드 */}
      {!loading && skills.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{skills.length}</p>
            <p className="text-xs text-text-muted mt-1">설치된 스킬</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">
              {totalUsage.toLocaleString()}
            </p>
            <p className="text-xs text-text-muted mt-1">총 실행 횟수</p>
          </div>
          <div className="hidden sm:block rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">
              {skills.filter((s) => s.last_used_at).length}
            </p>
            <p className="text-xs text-text-muted mt-1">사용한 스킬</p>
          </div>
        </div>
      )}

      {/* 에러 */}
      {(error || removeError) && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
          {error || removeError}
          {error && (
            <button onClick={fetchMySkills} className="ml-3 underline hover:no-underline">
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* 스킬 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-xl bg-bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-bg-muted rounded w-1/3" />
                <div className="h-3 bg-bg-muted rounded w-1/2" />
                <div className="h-3 bg-bg-muted rounded w-1/4" />
              </div>
              <div className="h-8 w-20 bg-bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => (
            <InstalledSkillRow
              key={skill.id}
              skill={skill}
              onUninstall={handleUninstall}
              removing={removingId === skill.skill_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
