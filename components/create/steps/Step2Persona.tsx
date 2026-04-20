/**
 * Step 2: 대표 페르소나 설정
 * 이름, 사용자 호칭, 역할설명, 감정슬라이더(IQ↔EQ), AI 두뇌 모델
 */
'use client';

import { useState, useCallback } from 'react';
import type { WizardData, PersonaData, PersonaType } from '../CreateWizard';
import { MicButton, stepTitle, stepDesc, formGroup, formLabel, formInput, StepActions } from '../ui';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

// ── 6-preset 분류 (SVG 다이어그램과 동일) ──────────────────────────────────
interface Preset {
  id: string;
  icon: string;
  label: string;
  suggestName: string;
  suggestUserTitle: string;
  suggestRole: string;
}

const AVATAR_PRESETS: Preset[] = [
  { id: 'executive',    icon: '🏢', label: '기업경영자',    suggestName: '대표 비서',     suggestUserTitle: '고객님',   suggestRole: '회사 소개와 비전을 안내합니다.' },
  { id: 'smallbiz',     icon: '🍱', label: '소상공인',      suggestName: '가게 안내',     suggestUserTitle: '손님',     suggestRole: '가게 메뉴·예약·문의를 안내합니다.' },
  { id: 'professional', icon: '⚖️', label: '전문직 종사자', suggestName: '전문 상담',     suggestUserTitle: '의뢰인',   suggestRole: '전문 영역 상담과 업무 안내를 제공합니다.' },
  { id: 'freelancer',   icon: '🎨', label: '프리랜서',      suggestName: '포트폴리오',    suggestUserTitle: '클라이언트', suggestRole: '작업물 소개와 협업 문의를 응대합니다.' },
  { id: 'politician',   icon: '🗳️', label: '정치인',        suggestName: '의정 안내',     suggestUserTitle: '주민',     suggestRole: '공약·활동·민원을 안내합니다.' },
  { id: 'other',        icon: '⚙️', label: '기타',          suggestName: '',              suggestUserTitle: '',         suggestRole: '' },
];

const HELPER_PRESETS: Preset[] = [
  { id: 'work',     icon: '💼', label: '업무', suggestName: '업무 도우미', suggestUserTitle: '대표님',   suggestRole: '문서 작성과 업무 효율을 돕습니다.' },
  { id: 'learning', icon: '📚', label: '학습', suggestName: '학습 코치',   suggestUserTitle: '학생',     suggestRole: '공부와 과제 수행을 지원합니다.' },
  { id: 'creative', icon: '🎨', label: '창작', suggestName: '창작 파트너', suggestUserTitle: '작가님',   suggestRole: '아이디어와 글쓰기를 함께합니다.' },
  { id: 'health',   icon: '💪', label: '건강', suggestName: '건강 코치',   suggestUserTitle: '회원님',   suggestRole: '운동·식단·건강 관리를 돕습니다.' },
  { id: 'life',     icon: '🏠', label: '생활', suggestName: '생활 도우미', suggestUserTitle: '사용자',   suggestRole: '일상·민원·정보를 안내합니다.' },
  { id: 'other',    icon: '⚙️', label: '기타', suggestName: '',            suggestUserTitle: '',         suggestRole: '' },
];

const SLIDER_PREVIEWS = [
  { max: 10, text: '힘드셨죠... 제가 도와드릴게요.' },
  { max: 30, text: '걱정되시죠? 함께 해결해볼게요.' },
  { max: 60, text: '객관적으로 보면서도, 마음은 이해합니다.' },
  { max: 80, text: '분석 결과를 바탕으로 설명해드리겠습니다.' },
  { max: 100, text: '정확한 데이터 기반으로 답변드리겠습니다.' },
];

const MODEL_OPTIONS = [
  { value: 'logic', label: '🧠 논리파' },
  { value: 'emotion', label: '💖 감성파' },
  { value: 'fast', label: '⚡ 속도파' },
  { value: 'creative', label: '🎨 창작파' },
];

function getSliderLabel(val: number) {
  if (val <= 20) return '감성 중심';
  if (val <= 40) return '감성 우세';
  if (val <= 60) return '균형';
  if (val <= 80) return '논리 우세';
  return '논리 중심';
}

function getSliderPreview(val: number) {
  return SLIDER_PREVIEWS.find(p => val <= p.max)?.text ?? SLIDER_PREVIEWS[4].text;
}

export default function Step2Persona({ data, onNext, onBack }: Props) {
  const [persona, setPersona] = useState<PersonaData>(data.persona);
  const [presetOpen, setPresetOpen] = useState<boolean>(!persona.presetId);

  const personaType: PersonaType = persona.type ?? 'avatar';
  const presets = personaType === 'avatar' ? AVATAR_PRESETS : HELPER_PRESETS;
  const currentPreset = presets.find(p => p.id === persona.presetId);

  const update = useCallback((patch: Partial<PersonaData>) => {
    setPersona(prev => ({ ...prev, ...patch }));
  }, []);

  const setType = (type: PersonaType) => {
    update({ type, presetId: undefined });
    setPresetOpen(true);
  };

  const selectPreset = (p: Preset) => {
    update({
      presetId: p.id,
      name: p.suggestName || persona.name,
      userTitle: p.suggestUserTitle || persona.userTitle,
      role: p.suggestRole || persona.role,
    });
    setPresetOpen(false);
  };

  const handleNext = () => {
    if (!persona.name.trim()) { alert('대표 페르소나의 이름을 입력해주세요'); return; }
    onNext({ persona });
  };

  return (
    <div>
      <h2 style={stepTitle}>대표 페르소나를 설정하세요</h2>
      <p style={stepDesc}>
        🎤 마이크 버튼으로 음성 입력 또는 직접 텍스트 입력이 가능합니다.<br />
        페르소나는 총 9개까지 추가할 수 있으며, 마이페이지에서 별도로 설정합니다.
      </p>

      {/* ── 분류 토글 (아바타형 / 도우미형) ──────────────────────────── */}
      <div style={{
        display: 'flex', gap: '8px', padding: '4px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', marginBottom: '1rem',
      }}>
        {(['avatar', 'helper'] as PersonaType[]).map(t => {
          const active = personaType === t;
          const title = t === 'avatar' ? '🧑 아바타형' : '🤖 도우미형';
          const desc  = t === 'avatar' ? '나를 대신해 고객 응대' : '나를 도와 업무 수행';
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '10px',
                border: 'none', cursor: 'pointer',
                background: active ? '#6366f1' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{title}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 500, opacity: active ? 0.9 : 0.7 }}>{desc}</span>
            </button>
          );
        })}
      </div>

      {/* ── Option C: 접힘형 6-preset 카드 ──────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setPresetOpen(o => !o)}
          aria-expanded={presetOpen}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: '0.9rem', fontWeight: 600, textAlign: 'left',
          }}
        >
          <span>
            {currentPreset
              ? <>선택한 프리셋: <span style={{ color: '#a5b4fc' }}>{currentPreset.icon} {currentPreset.label}</span></>
              : '프리셋을 선택하면 이름·호칭·역할이 자동 채워집니다'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
            {presetOpen ? '접기 ▲' : '펼치기 ▼'}
          </span>
        </button>

        {presetOpen && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
            padding: '0 12px 12px',
          }}>
            {presets.map(p => {
              const active = persona.presetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPreset(p)}
                  style={{
                    padding: '14px 8px', borderRadius: '10px', cursor: 'pointer',
                    background: active ? 'rgba(99,102,241,0.25)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${active ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? 'white' : 'rgba(255,255,255,0.85)',
                    fontSize: '0.8rem', fontWeight: 600, textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px', lineHeight: 1 }}>{p.icon}</div>
                  <div>{p.label}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 대표 페르소나 배지 */}
      <div style={{
        display: 'inline-block',
        padding: '8px 16px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 600,
        background: 'rgba(99,102,241,0.15)',
        color: '#818cf8',
        border: '1px solid rgba(99,102,241,0.3)',
        marginBottom: '1.5rem',
      }}>
        대표 페르소나를 설정하세요
      </div>

      {/* 페르소나 카드 */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '3px solid #818cf8',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        {/* 카드 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '0.65rem',
            fontWeight: 700,
            background: 'rgba(99,102,241,0.2)',
            color: '#a5b4fc',
          }}>{personaType === 'avatar' ? '아바타형' : '도우미형'}</span>
          <span style={{ color: 'white', fontWeight: 700 }}>대표 페르소나</span>
        </div>

        {/* 페르소나 이름 */}
        <div style={formGroup}>
          <label style={formLabel}>페르소나 이름 *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              style={{ ...formInput, flex: 1, background: 'rgba(0,0,0,0.2)' }}
              value={persona.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="예: 고객 상담, 전문 컨설팅"
            />
            <MicButton onResult={text => update({ name: persona.name + (persona.name ? ' ' : '') + text })} />
          </div>
        </div>

        {/* 사용자 호칭 */}
        <div style={formGroup}>
          <label style={formLabel}>사용자 호칭 *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              style={{ ...formInput, flex: 1, background: 'rgba(0,0,0,0.2)' }}
              value={persona.userTitle}
              onChange={e => update({ userTitle: e.target.value })}
              placeholder="예: 고객님, 대표님, 선생님"
            />
            <MicButton onResult={text => update({ userTitle: text })} />
          </div>
        </div>

        {/* 역할/전문성 설명 */}
        <div style={formGroup}>
          <label style={formLabel}>역할/전문성 설명</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <textarea
              style={{ ...formInput, flex: 1, background: 'rgba(0,0,0,0.2)', minHeight: '60px', resize: 'vertical' }}
              value={persona.role}
              onChange={e => update({ role: e.target.value })}
              placeholder="이 페르소나의 역할을 설명해주세요"
              rows={2}
            />
            <MicButton onResult={text => update({ role: persona.role + (persona.role ? ' ' : '') + text })} />
          </div>
        </div>

        {/* 감정 슬라이더 */}
        <div style={formGroup}>
          <label style={formLabel}>감정 슬라이더 (IQ ↔ EQ)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', minWidth: '50px' }}>
              💖 감성
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={persona.iqEq}
              onChange={e => update({ iqEq: parseInt(e.target.value, 10) })}
              style={{ flex: 1, accentColor: '#6366f1', height: '8px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
              🧠 논리
            </span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            {persona.iqEq} — {getSliderLabel(persona.iqEq)}
          </div>
          <div style={{
            marginTop: '8px',
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}>
            &ldquo;{getSliderPreview(persona.iqEq)}&rdquo;
          </div>
        </div>

        {/* AI 두뇌 모델 */}
        <div style={formGroup}>
          <label style={formLabel}>AI 두뇌 모델</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {MODEL_OPTIONS.map(opt => (
              <label
                key={opt.value}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  padding: '8px',
                  background: persona.model === opt.value ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${persona.model === opt.value ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  color: persona.model === opt.value ? 'white' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="persona-model"
                  value={opt.value}
                  checked={persona.model === opt.value}
                  onChange={() => update({ model: opt.value as PersonaData['model'] })}
                  style={{ display: 'none' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <StepActions onBack={onBack} onNext={handleNext} nextLabel="다음: 인터뷰 →" />
    </div>
  );
}
