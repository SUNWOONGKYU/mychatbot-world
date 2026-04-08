/**
 * @task S3F12
 * @description 내 스킬 관리 페이지 — Vanilla my.html 완전 이식
 * - 설치된 스킬 목록 (이모지 아이콘, 이름, 카테고리, 설명)
 * - 활성/비활성 토글
 * - 제거 버튼
 * - 빈 상태
 * - Toast 알림
 * Route: /skills/my
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { SKILLS, type SkillItem } from '@/lib/skills-data';
import { useSkillsStore } from '@/lib/use-skills-store';

// ── Toast ─────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState('');
  const [vis, setVis] = useState(false);
  const show = useCallback((m: string) => {
    setMsg(m); setVis(true);
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
    <div className={`sk-my-item${active ? '' : ' sk-my-item--inactive'}`}>
      <div className="sk-my-item-left">
        <span className="sk-my-icon" aria-hidden="true">{skill.icon}</span>
        <div className="sk-my-info">
          <p className="sk-my-name">{skill.name}</p>
          <p className="sk-my-cat">{skill.category}</p>
          <p className="sk-my-desc">{skill.description}</p>
        </div>
      </div>

      <div className="sk-my-item-right">
        <span className={`sk-my-status${active ? ' active' : ' inactive'}`}>
          {active ? '활성' : '비활성'}
        </span>
        <button
          className="sk-my-toggle-btn"
          onClick={() => onToggle(skill.id)}
          type="button"
          aria-label={active ? `${skill.name} 비활성화` : `${skill.name} 활성화`}
        >
          {active ? '끄기' : '켜기'}
        </button>
        <button
          className="sk-my-remove-btn"
          onClick={() => onRemove(skill.id, skill.name)}
          type="button"
          aria-label={`${skill.name} 제거`}
        >
          제거
        </button>
      </div>
    </div>
  );
}

// ── 빈 상태 ──────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="sk-empty">
      <div className="sk-empty-icon">📦</div>
      <h3 className="sk-empty-title">설치된 스킬이 없습니다</h3>
      <p className="sk-empty-desc">스킬 마켓에서 원하는 스킬을 찾아 설치해보세요.</p>
      <Link href="/skills" className="sk-empty-btn">
        스킬 마켓 보기
      </Link>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function MySkillsPage() {
  const { installedIds, remove } = useSkillsStore();
  const { vis: toastVis, msg: toastMsg, show: showToast } = useToast();

  // 활성/비활성 상태 (로컬 — localStorage 확장 가능)
  const [inactiveIds, setInactiveIds] = useState<string[]>([]);

  const installedSkills: SkillItem[] = SKILLS.filter(s => installedIds.includes(s.id));

  const handleToggle = useCallback((skillId: string) => {
    setInactiveIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
    const skill = SKILLS.find(s => s.id === skillId);
    const willBeActive = inactiveIds.includes(skillId);
    showToast(`"${skill?.name}" 스킬을 ${willBeActive ? '활성화' : '비활성화'}했습니다.`);
  }, [inactiveIds, showToast]);

  const handleRemove = useCallback((skillId: string, name: string) => {
    remove(skillId);
    setInactiveIds(prev => prev.filter(id => id !== skillId));
    showToast(`"${name}" 스킬을 제거했습니다.`);
  }, [remove, showToast]);

  const activeCount = installedSkills.filter(s => !inactiveIds.includes(s.id)).length;

  return (
    <>
      {/* 뒤로가기 */}
      <div className="sk-back-bar">
        <div className="container">
          <Link href="/skills" className="sk-back-link">
            ← 스킬 마켓으로
          </Link>
        </div>
      </div>

      {/* 헤더 */}
      <section className="sk-my-hero">
        <div className="container">
          <h1 className="sk-my-title">내 스킬</h1>
          <p className="sk-my-subtitle">
            설치된 스킬 {installedSkills.length}개 · 활성 {activeCount}개
          </p>
        </div>
      </section>

      {/* 스킬 목록 */}
      <main className="sk-my-main">
        <div className="container">
          {installedSkills.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="sk-my-list">
              {installedSkills.map(skill => (
                <MySkillItem
                  key={skill.id}
                  skill={skill}
                  active={!inactiveIds.includes(skill.id)}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {installedSkills.length > 0 && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link href="/skills" className="sk-my-btn" style={{ display: 'inline-flex' }}>
                + 스킬 더 추가하기
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toastVis && (
        <div className="sk-toast" role="alert" aria-live="assertive">
          {toastMsg}
        </div>
      )}
    </>
  );
}
