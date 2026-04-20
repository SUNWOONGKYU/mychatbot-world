/**
 * @description 마이페이지 탭 — 코코봇 상점 (페르소나 팩 / 음성 팩 / 아바타 팩)
 * Tab7Credits 에서 분리. 무통장 결제 흐름은 동일.
 */
'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { authHeaders } from '@/lib/auth-client';

const BANK_INFO = {
  bank: '하나은행',
  account: '287-910921-40507',
  holder: '파인더월드',
};

const PERSONA_TEMPLATES = [
  { id: 'pt-legal',     emoji: '⚖️', name: '법률 전문가 팩',  description: '계약서 검토, 법적 상담, 분쟁 해결 페르소나 5종', price: 30000 },
  { id: 'pt-medical',   emoji: '🏥', name: '의료 상담 팩',    description: '증상 체크, 건강 가이드, 복약 정보 페르소나 5종', price: 30000 },
  { id: 'pt-finance',   emoji: '📈', name: '금융·투자 팩',    description: '주식, ETF, 자산관리, 부동산 투자 페르소나 5종',   price: 30000 },
  { id: 'pt-education', emoji: '📚', name: '교육·튜터링 팩',  description: '수학, 언어, 과학, 논술 지도 페르소나 5종',       price: 30000 },
  { id: 'pt-business',  emoji: '💼', name: '비즈니스·마케팅 팩', description: '카피라이팅, 전략 기획, 데이터 분석 페르소나 5종', price: 30000 },
  { id: 'pt-hr',        emoji: '👥', name: 'HR·채용 팩',      description: '이력서 검토, 면접 코칭, 인재 평가 페르소나 5종',   price: 30000 },
];

const VOICE_PACKS = [
  { id: 'vp-basic',     emoji: '🎙️', name: '기본 AI 음성 팩',    description: '남성·여성 2종 AI 음성, 코코봇 응답 TTS 지원',  price: 15000 },
  { id: 'vp-pro',       emoji: '🎤', name: '프로 AI 음성 팩',    description: '감정 표현 가능한 AI 음성 5종, 자연스러운 억양', price: 30000 },
  { id: 'vp-character', emoji: '🗣️', name: '캐릭터 음성 팩',     description: '귀엽고 개성 있는 캐릭터 스타일 음성 3종',       price: 20000 },
];

const AVATAR_PACKS = [
  { id: 'ap-basic',    emoji: '🖼️', name: '기본 아바타 팩',       description: '다양한 스타일 코코봇 아바타 이미지 10종',     price: 15000 },
  { id: 'ap-business', emoji: '👔', name: '비즈니스 아바타 팩',   description: '전문직 콘셉트 고화질 캐릭터 아바타 10종',     price: 20000 },
  { id: 'ap-anime',    emoji: '✨', name: '애니메이션 아바타 팩', description: '일러스트 스타일 귀여운 캐릭터 아바타 10종',   price: 20000 },
];

export default function Tab8Shop() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateDepositor, setTemplateDepositor] = useState('');
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [templateError, setTemplateError] = useState('');

  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);
  const [addonDepositor, setAddonDepositor] = useState('');
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [addonSuccess, setAddonSuccess] = useState('');
  const [addonError, setAddonError] = useState('');

  async function handleTemplateSubmit() {
    if (!selectedTemplateId) { setTemplateError('구매할 템플릿 팩을 선택해주세요.'); return; }
    if (!templateDepositor.trim()) { setTemplateError('입금자명을 입력해주세요.'); return; }
    const item = PERSONA_TEMPLATES.find((t) => t.id === selectedTemplateId)!;
    setTemplateSubmitting(true);
    setTemplateError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount: item.price,
          depositor_name: templateDepositor.trim(),
          description: `[페르소나 템플릿] ${item.name}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setTemplateSuccess(`"${item.name}" 구매 신청이 완료되었습니다. 입금 확인 후 24시간 이내 템플릿이 지급됩니다.`);
      setTemplateDepositor('');
      setSelectedTemplateId(null);
      setTimeout(() => setTemplateSuccess(''), 8000);
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : '신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setTemplateSubmitting(false);
    }
  }

  async function handleAddonSubmit() {
    if (!selectedAddonId) { setAddonError('아이템을 선택해주세요.'); return; }
    if (!addonDepositor.trim()) { setAddonError('입금자명을 입력해주세요.'); return; }
    const item = [...VOICE_PACKS, ...AVATAR_PACKS].find((t) => t.id === selectedAddonId)!;
    setAddonSubmitting(true);
    setAddonError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount: item.price,
          depositor_name: addonDepositor.trim(),
          description: `[부가기능] ${item.name}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAddonSuccess(`"${item.name}" 구매 신청이 완료되었습니다. 입금 확인 후 24시간 이내 적용됩니다.`);
      setAddonDepositor('');
      setSelectedAddonId(null);
      setTimeout(() => setAddonSuccess(''), 8000);
    } catch (err: unknown) {
      setAddonError(err instanceof Error ? err.message : '신청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAddonSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">코코봇 상점</h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          내 코코봇에 페르소나·음성·아바타 팩을 장착하세요. 모두 일회성 구매 · 영구 사용.
        </p>
      </div>

      {/* 페르소나 템플릿 팩 */}
      <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">전문 분야별 페르소나 템플릿</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            전문가 수준의 코코봇 페르소나 세트. 팩당 30,000원
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PERSONA_TEMPLATES.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTemplateId(selectedTemplateId === item.id ? null : item.id)}
              className={clsx(
                'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
                selectedTemplateId === item.id
                  ? 'border-accent bg-accent/10 shadow-accent-glow'
                  : 'border-[var(--border-default)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
              )}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{item.name}</span>
              <span className="text-[11px] text-[var(--text-tertiary)] leading-snug">{item.description}</span>
              <span className={clsx(
                'mt-1 text-sm font-bold',
                selectedTemplateId === item.id ? 'text-[var(--interactive-primary)]' : 'text-[var(--text-secondary)]',
              )}>
                {item.price.toLocaleString('ko-KR')}원
              </span>
            </button>
          ))}
        </div>

        {selectedTemplateId && (() => {
          const item = PERSONA_TEMPLATES.find((t) => t.id === selectedTemplateId)!;
          return (
            <div className="bg-[var(--surface-2)] rounded-xl border border-accent/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                선택: {item.emoji} {item.name} — {item.price.toLocaleString('ko-KR')}원
              </p>
              <BankInfoBlock />
              <DepositorInput value={templateDepositor} onChange={setTemplateDepositor} />
              {templateError && <p className="text-sm text-error">{templateError}</p>}
              {templateSuccess && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                  {templateSuccess}
                </div>
              )}
              <button
                onClick={handleTemplateSubmit}
                disabled={templateSubmitting || !templateDepositor.trim()}
                className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {templateSubmitting ? '처리 중...' : `${item.price.toLocaleString('ko-KR')}원 무통장 입금 신청`}
              </button>
              <p className="text-xs text-[var(--text-tertiary)] text-center">
                입금 확인 후 24시간 이내 템플릿이 지급됩니다. 문의: support@cocobot.world
              </p>
            </div>
          );
        })()}

        {!selectedTemplateId && templateSuccess && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
            {templateSuccess}
          </div>
        )}
      </div>

      {/* 음성 & 아바타 팩 */}
      <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-default)] p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">음성 & 아바타 팩</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            내 코코봇에 AI 음성과 고유 아바타를 장착하세요.
          </p>
        </div>

        {/* 음성 팩 */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">🎙️ 음성 팩</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {VOICE_PACKS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAddonId(selectedAddonId === item.id ? null : item.id)}
                className={clsx(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
                  selectedAddonId === item.id
                    ? 'border-accent bg-accent/10 shadow-accent-glow'
                    : 'border-[var(--border-default)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
                )}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{item.name}</span>
                <span className="text-[11px] text-[var(--text-tertiary)] leading-snug">{item.description}</span>
                <span className={clsx('mt-1 text-sm font-bold', selectedAddonId === item.id ? 'text-[var(--interactive-primary)]' : 'text-[var(--text-secondary)]')}>
                  {item.price.toLocaleString('ko-KR')}원
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 아바타 팩 */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">🖼️ 아바타 팩</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {AVATAR_PACKS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAddonId(selectedAddonId === item.id ? null : item.id)}
                className={clsx(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all',
                  selectedAddonId === item.id
                    ? 'border-accent bg-accent/10 shadow-accent-glow'
                    : 'border-[var(--border-default)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
                )}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{item.name}</span>
                <span className="text-[11px] text-[var(--text-tertiary)] leading-snug">{item.description}</span>
                <span className={clsx('mt-1 text-sm font-bold', selectedAddonId === item.id ? 'text-[var(--interactive-primary)]' : 'text-[var(--text-secondary)]')}>
                  {item.price.toLocaleString('ko-KR')}원
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedAddonId && (() => {
          const item = [...VOICE_PACKS, ...AVATAR_PACKS].find((t) => t.id === selectedAddonId)!;
          return (
            <div className="bg-[var(--surface-2)] rounded-xl border border-accent/30 p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                선택: {item.emoji} {item.name} — {item.price.toLocaleString('ko-KR')}원
              </p>
              <BankInfoBlock />
              <DepositorInput value={addonDepositor} onChange={setAddonDepositor} />
              {addonError && <p className="text-sm text-error">{addonError}</p>}
              {addonSuccess && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                  {addonSuccess}
                </div>
              )}
              <button
                onClick={handleAddonSubmit}
                disabled={addonSubmitting || !addonDepositor.trim()}
                className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {addonSubmitting ? '처리 중...' : `${item.price.toLocaleString('ko-KR')}원 무통장 입금 신청`}
              </button>
              <p className="text-xs text-[var(--text-tertiary)] text-center">
                입금 확인 후 24시간 이내 적용됩니다. 문의: support@cocobot.world
              </p>
            </div>
          );
        })()}

        {!selectedAddonId && addonSuccess && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm text-center">
            {addonSuccess}
          </div>
        )}
      </div>
    </div>
  );
}

function BankInfoBlock() {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="bg-[var(--surface-2)] rounded-lg p-3">
        <p className="text-xs text-[var(--text-tertiary)] mb-1">은행</p>
        <p className="font-semibold text-[var(--text-primary)]">{BANK_INFO.bank}</p>
      </div>
      <div className="bg-[var(--surface-2)] rounded-lg p-3">
        <p className="text-xs text-[var(--text-tertiary)] mb-1">계좌번호</p>
        <p className="font-semibold text-[var(--text-primary)] text-xs">{BANK_INFO.account}</p>
      </div>
      <div className="bg-[var(--surface-2)] rounded-lg p-3">
        <p className="text-xs text-[var(--text-tertiary)] mb-1">예금주</p>
        <p className="font-semibold text-[var(--text-primary)]">{BANK_INFO.holder}</p>
      </div>
    </div>
  );
}

function DepositorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">입금자명 (필수)</label>
      <input
        type="text"
        placeholder="입금자명을 정확히 입력하세요"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--interactive-primary)]"
      />
    </div>
  );
}
