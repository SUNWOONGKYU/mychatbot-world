/**
 * @task S5FE6
 * @description 마이페이지 탭4 — 스킬 관리
 * 다운로드 스킬 목록, 활성/비활성 토글, 장착 봇 표시, 마켓 등록하기
 */
'use client';

import { useState, useRef } from 'react';
import clsx from 'clsx';
import { getToken, authHeaders } from '@/lib/auth-client';

// ── 타입 ─────────────────────────────────────────────────────────────────

interface AttachedBot {
  id: string;
  name: string;
  emoji?: string | null;
}

interface SkillItem {
  id: string;
  name: string;
  description: string | null;
  version: string;
  author: string;
  active: boolean;
  attached_bots: AttachedBot[];
  downloaded_at: string;
  icon?: string;
  category?: string;
}

// ── 유틸 ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// ── 토글 스위치 ───────────────────────────────────────────────────────────

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
        checked
          ? 'bg-[rgb(var(--color-primary))]'
          : 'bg-[rgb(var(--border-strong))]',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

// ── 스킬 아이템 행 ───────────────────────────────────────────────────────

function SkillRow({
  skill,
  onToggle,
  onRemove,
}: {
  skill: SkillItem;
  onToggle: (id: string, active: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await fetch(`/api/skills/${skill.id}/uninstall`, { method: 'DELETE', headers: authHeaders() });
      onRemove(skill.id);
    } catch { /* silent */ }
    setRemoving(false);
    setDelConfirm(false);
  };

  return (
    <div
      className={clsx(
        'rounded-[var(--radius-lg)] border transition-colors',
        skill.active
          ? 'border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))]'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-subtle))] opacity-75',
      )}
    >
      {/* 행 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* 아이콘 */}
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[rgb(var(--color-primary-muted))] flex items-center justify-center text-xl flex-shrink-0">
          {skill.icon ?? '⚡'}
        </div>

        {/* 스킬 정보 */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[rgb(var(--text-primary-rgb))]">{skill.name}</span>
            <span className={clsx(
              'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
              skill.active
                ? 'border-[rgb(var(--color-success)/0.4)] text-[rgb(var(--color-success))] bg-[rgb(var(--color-success)/0.1)]'
                : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-muted))]',
            )}>
              {skill.active ? '활성' : '비활성'}
            </span>
            {skill.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-muted))]">
                {skill.category}
              </span>
            )}
          </div>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
            v{skill.version} · {skill.author} · 설치: {formatDate(skill.downloaded_at)}
          </p>
        </div>

        {/* 토글 */}
        <ToggleSwitch
          checked={skill.active}
          onChange={v => onToggle(skill.id, v)}
        />
      </div>

      {/* 확장 콘텐츠 */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[rgb(var(--border))] pt-3 space-y-3">
          {/* 설명 */}
          {skill.description && (
            <p className="text-sm text-[rgb(var(--text-secondary-rgb))]">{skill.description}</p>
          )}

          {/* 장착된 봇 */}
          <div>
            <p className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide mb-2">
              장착된 코코봇
            </p>
            {skill.attached_bots.length === 0 ? (
              <p className="text-xs text-[rgb(var(--text-muted))]">아직 장착된 코코봇이 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skill.attached_bots.map(bot => (
                  <span
                    key={bot.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--text-secondary-rgb))]"
                  >
                    {bot.emoji ?? '🤖'} {bot.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 제거 */}
          <div className="flex gap-2 pt-1 border-t border-[rgb(var(--border))]">
            {delConfirm ? (
              <>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border',
                    'border-[rgb(var(--color-error)/0.5)] bg-[rgb(var(--color-error)/0.1)] text-[rgb(var(--color-error))]',
                    'disabled:opacity-50 transition-colors',
                  )}
                >
                  {removing ? '제거 중...' : '확인 제거'}
                </button>
                <button type="button" onClick={() => setDelConfirm(false)} className="text-sm text-[rgb(var(--text-muted))]">취소</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setDelConfirm(true)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-[var(--radius-md)] border',
                  'border-[rgb(var(--color-error)/0.3)] text-[rgb(var(--color-error))]',
                  'hover:bg-[rgb(var(--color-error)/0.1)] transition-colors',
                )}
              >
                스킬 제거
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 스킬 마켓 등록 모달 ───────────────────────────────────────────────────

function RegisterSkillModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    category: '',
    price: '0',
    file: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState('');
  const fileRef = useRef<any>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('version', form.version);
      formData.append('category', form.category);
      formData.append('price', form.price);
      if (form.file) formData.append('skill_file', form.file);
      const token = getToken();
      const res = await fetch('/api/skills/register', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('등록 실패');
      setResult('스킬이 마켓에 등록 심사 중입니다.');
      setStep(3);
    } catch {
      setResult('등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div
        className="relative w-full max-w-lg rounded-[var(--radius-2xl)] border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] p-6 space-y-5"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[rgb(var(--text-primary-rgb))]">스킬 마켓 등록</h2>
            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">내 스킬을 마켓에 등록해 수익을 창출하세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary-rgb))] text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                step >= s
                  ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]'
                  : 'bg-[rgb(var(--bg-subtle))] text-[rgb(var(--text-muted))]',
              )}>
                {s}
              </div>
              {s < 3 && <div className={clsx('flex-1 h-0.5', step > s ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--border))]')} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-[rgb(var(--text-muted))]">
          {step === 1 && '기본 정보 입력'}
          {step === 2 && '파일 업로드 및 가격 설정'}
          {step === 3 && '등록 완료'}
        </p>

        {/* 스텝 1: 기본 정보 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">스킬 이름 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="예: 고객응대 자동화"
                className={clsx(
                  'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                  'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary-rgb))] placeholder:text-[rgb(var(--text-muted))]',
                  'focus:outline-none focus:border-[rgb(var(--color-primary))]',
                )}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">설명</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="스킬에 대한 설명을 입력하세요"
                rows={3}
                className={clsx(
                  'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                  'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary-rgb))] placeholder:text-[rgb(var(--text-muted))]',
                  'focus:outline-none focus:border-[rgb(var(--color-primary))] resize-none',
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">버전</label>
                <input
                  type="text"
                  value={form.version}
                  onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                  placeholder="1.0.0"
                  className={clsx(
                    'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                    'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary-rgb))]',
                    'focus:outline-none focus:border-[rgb(var(--color-primary))]',
                  )}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">카테고리</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className={clsx(
                    'w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                    'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary-rgb))]',
                    'focus:outline-none focus:border-[rgb(var(--color-primary))]',
                  )}
                >
                  <option value="">선택</option>
                  <option value="customer">고객응대</option>
                  <option value="productivity">생산성</option>
                  <option value="education">교육</option>
                  <option value="sales">영업</option>
                  <option value="etc">기타</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 스텝 2: 파일 + 가격 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide block mb-2">스킬 파일 업로드 *</label>
              <div
                onClick={() => (fileRef as any).current?.click()}
                className={clsx(
                  'flex flex-col items-center justify-center gap-2 py-8 rounded-[var(--radius-lg)]',
                  'border-2 border-dashed border-[rgb(var(--border))] cursor-pointer',
                  'hover:border-[rgb(var(--color-primary)/0.5)] transition-colors',
                )}
              >
                <span className="text-3xl">{form.file ? '✅' : '📦'}</span>
                <p className="text-sm text-[rgb(var(--text-secondary-rgb))]">
                  {form.file ? form.file.name : '스킬 파일 (.zip, .json)'}
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".zip,.json"
                className="hidden"
                onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">가격 (원, 0 = 무료)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[rgb(var(--text-muted))]">₩</span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className={clsx(
                    'w-full pl-7 pr-3 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))]',
                    'bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary-rgb))]',
                    'focus:outline-none focus:border-[rgb(var(--color-primary))]',
                  )}
                />
              </div>
              {parseInt(form.price) > 0 && (
                <p className="text-xs text-[rgb(var(--color-accent))]">
                  판매가: ₩{parseInt(form.price).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 스텝 3: 완료 */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <p className="font-semibold text-[rgb(var(--text-primary-rgb))]">{result || '등록 신청 완료!'}</p>
            <p className="text-sm text-[rgb(var(--text-muted))] mt-2">검토 후 마켓에 공개됩니다. 보통 1~2 영업일 소요됩니다.</p>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-between gap-3 pt-2 border-t border-[rgb(var(--border))]">
          {step > 1 && step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
              className="px-4 py-2 text-sm rounded-[var(--radius-md)] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary-rgb))]"
            >
              이전
            </button>
          ) : (
            <div />
          )}
          {step < 2 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!form.name.trim()}
              className={clsx(
                'px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)]',
                'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
                'hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50',
              )}
            >
              다음
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim()}
              className={clsx(
                'px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)]',
                'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
                'hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50',
              )}
            >
              {submitting ? '등록 중...' : '마켓에 등록'}
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                'px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)]',
                'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
                'hover:bg-[rgb(var(--color-primary-hover))] transition-colors',
              )}
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────

interface Tab4SkillsProps {
  skills: SkillItem[];
  onSkillsChange: (skills: SkillItem[]) => void;
}

export default function Tab4Skills({ skills, onSkillsChange }: Tab4SkillsProps) {
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleToggle = async (id: string, active: boolean) => {
    // Optimistic update
    onSkillsChange(skills.map(s => s.id === id ? { ...s, active } : s));
    try {
      await fetch(`/api/skills/${id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ active }),
      });
    } catch {
      // Rollback
      onSkillsChange(skills.map(s => s.id === id ? { ...s, active: !active } : s));
    }
  };

  const handleRemove = (id: string) => {
    onSkillsChange(skills.filter(s => s.id !== id));
  };

  const activeCount = skills.filter(s => s.active).length;
  const inactiveCount = skills.filter(s => !s.active).length;

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="flex gap-4">
        <div className="px-4 py-3 rounded-[var(--radius-lg)] bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-center flex-1" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-2xl font-bold text-[rgb(var(--color-primary))]">{skills.length}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">전체 스킬</p>
        </div>
        <div className="px-4 py-3 rounded-[var(--radius-lg)] bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-center flex-1" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-2xl font-bold text-[rgb(var(--color-success))]">{activeCount}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">활성</p>
        </div>
        <div className="px-4 py-3 rounded-[var(--radius-lg)] bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border))] text-center flex-1" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-2xl font-bold text-[rgb(var(--text-muted))]">{inactiveCount}</p>
          <p className="text-xs text-[rgb(var(--text-muted))]">비활성</p>
        </div>
      </div>

      {/* 스킬 목록 */}
      <div className="space-y-3">
        {skills.length === 0 ? (
          <div className="text-center py-16 text-[rgb(var(--text-muted))]">
            <p className="text-4xl mb-3">⚡</p>
            <p className="font-medium">아직 다운로드한 스킬이 없습니다.</p>
            <p className="text-sm mt-1">
              <a href="/skills" className="text-[rgb(var(--color-primary))] hover:underline">스킬 마켓</a>에서 스킬을 찾아보세요.
            </p>
          </div>
        ) : (
          skills.map(skill => (
            <SkillRow
              key={skill.id}
              skill={skill}
              onToggle={handleToggle}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>

      {/* 마켓 등록 CTA */}
      <div
        className="rounded-[var(--radius-xl)] border border-dashed border-[rgb(var(--color-primary)/0.4)] bg-[rgb(var(--color-primary-muted)/0.5)] p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[rgb(var(--color-primary))]">스킬 마켓에 내 스킬 등록하기</h3>
            <p className="text-xs text-[rgb(var(--text-secondary-rgb))] mt-1">
              직접 만든 스킬을 마켓에 등록해 다른 회원들과 공유하고 수익을 창출하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold flex-shrink-0',
              'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]',
              'hover:bg-[rgb(var(--color-primary-hover))] transition-colors',
            )}
          >
            + 스킬 등록하기
          </button>
        </div>
      </div>

      {/* 마켓 등록 모달 */}
      {showRegisterModal && (
        <RegisterSkillModal onClose={() => setShowRegisterModal(false)} />
      )}
    </div>
  );
}
