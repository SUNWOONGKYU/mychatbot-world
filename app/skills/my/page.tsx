/**
 * @task S7FE6 — P1 리디자인: 내 스킬 관리 페이지
 * 기반: S7FE1 토큰 + S7FE2 Button + S7FE4 PageToolbar/Badge/EmptyState
 * 변경: PageToolbar, Badge 활성/비활성 상태, EmptyState, 카드 밀도 개선
 * 비즈니스 로직 보존: useSkillsStore, toggle, remove 그대로 유지
 * Route: /skills/my
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { fetchSkillsFromAPI, type SkillItem } from '@/lib/skills-data';
import { useSkillsStore } from '@/lib/use-skills-store';
import { PageToolbar, Breadcrumb, BreadcrumbItem } from '@/components/ui/page-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

// ── Toast ─────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState('');
  const [vis, setVis] = useState(false);
  const show = useCallback((m: string) => {
    setMsg(m);
    setVis(true);
    setTimeout(() => setVis(false), 3000);
  }, []);
  return { vis, msg, show };
}

// ── 내 스킬 아이템 행 ─────────────────────────────────────────────
interface MySkillItemProps {
  skill: SkillItem;
  active: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string, name: string) => void;
}

function MySkillItem({ skill, active, onToggle, onRemove }: MySkillItemProps) {
  return (
    <div
      className={`flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl
        border transition-all duration-200
        ${active
          ? 'bg-surface-2 border-border-default hover:border-interactive-primary/30'
          : 'bg-surface-1 border-border-subtle opacity-60'
        }`}
    >
      {/* 왼쪽: 아이콘 + 정보 */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span
          className="w-10 h-10 rounded-lg bg-interactive-secondary flex items-center justify-center text-xl shrink-0 mt-0.5"
          aria-hidden="true"
        >
          {skill.icon}
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text-primary [word-break:keep-all]">
              {skill.name}
            </p>
            <Badge
              variant={active ? 'success' : 'neutral'}
              tone="subtle"
              size="sm"
            >
              {active ? '활성' : '비활성'}
            </Badge>
          </div>
          <p className="text-xs text-text-tertiary [word-break:keep-all]">
            {skill.category}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 [word-break:keep-all]">
            {skill.description}
          </p>
        </div>
      </div>

      {/* 오른쪽: 액션 버튼 */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggle(skill.id)}
          aria-label={active ? `${skill.name} 비활성화` : `${skill.name} 활성화`}
        >
          {active ? '끄기' : '켜기'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(skill.id, skill.name)}
          aria-label={`${skill.name} 제거`}
          className="text-state-danger-fg hover:bg-state-danger-bg hover:text-state-danger-fg"
        >
          제거
        </Button>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function MySkillsPage() {
  const { installedIds, remove } = useSkillsStore();
  const { vis: toastVis, msg: toastMsg, show: showToast } = useToast();

  const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
  const [inactiveIds, setInactiveIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSkillsFromAPI().then(setAllSkills);
  }, []);

  const installedSkills: SkillItem[] = allSkills.filter(s => installedIds.includes(s.id));

  const handleToggle = useCallback((skillId: string) => {
    setInactiveIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
    const skill = allSkills.find(s => s.id === skillId);
    const willBeActive = inactiveIds.includes(skillId);
    showToast(`"${skill?.name}" 스킬을 ${willBeActive ? '활성화' : '비활성화'}했습니다.`);
  }, [inactiveIds, showToast, allSkills]);

  const handleRemove = useCallback((skillId: string, name: string) => {
    remove(skillId);
    setInactiveIds(prev => prev.filter(id => id !== skillId));
    showToast(`"${name}" 스킬을 제거했습니다.`);
  }, [remove, showToast]);

  const activeCount = installedSkills.filter(s => !inactiveIds.includes(s.id)).length;

  return (
    <div className="flex flex-col min-h-full">
      {/* PageToolbar */}
      <PageToolbar
        title="내 스킬"
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbItem href="/">홈</BreadcrumbItem>
            <BreadcrumbItem href="/skills">스킬 마켓</BreadcrumbItem>
            <BreadcrumbItem current>내 스킬</BreadcrumbItem>
          </Breadcrumb>
        }
        actions={
          installedSkills.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Badge variant="success" tone="subtle" size="sm">
                활성 {activeCount}개
              </Badge>
              <span className="text-text-tertiary">/ 총 {installedSkills.length}개</span>
            </div>
          ) : undefined
        }
        divider
      />

      <main className="flex-1 px-4 py-5 sm:px-6 max-w-3xl mx-auto w-full">
        {installedSkills.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7" aria-hidden="true">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            }
            title="설치된 스킬이 없습니다"
            description="스킬 마켓에서 원하는 스킬을 찾아 설치해보세요."
            action={
              <Button asChild variant="default" size="md">
                <Link href="/skills">스킬 마켓 보기</Link>
              </Button>
            }
            size="lg"
          />
        ) : (
          <div className="space-y-3">
            {installedSkills.map(skill => (
              <MySkillItem
                key={skill.id}
                skill={skill}
                active={!inactiveIds.includes(skill.id)}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            ))}

            {/* 더 추가 버튼 */}
            <div className="pt-4 flex justify-center">
              <Button asChild variant="outline" size="md">
                <Link href="/skills">+ 스킬 더 추가하기</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toastVis && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9998]
            bg-state-success-bg border border-state-success-border text-state-success-fg
            px-6 py-3 rounded-full text-sm font-semibold
            shadow-[var(--shadow-lg)] backdrop-blur-sm whitespace-nowrap pointer-events-none"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
