/**
 * Step 7: 테마 선택
 * - 다크/라이트 모드 토글
 * - 5가지 주요 색상 (보라, 파랑, 초록, 빨강, 주황)
 * - 실시간 테마 미리보기 (챗 버블 색상 변경)
 */
'use client';

import { useState, useEffect } from 'react';
import type { WizardData } from '../CreateWizard';
import { stepTitle, stepDesc, formCard, formGroup, formLabel, StepActions } from '../ui';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

const THEME_COLORS: Record<string, string> = {
  purple: '#7c3aed',
  blue: '#2563eb',
  green: '#16a34a',
  red: '#dc2626',
  orange: '#ea580c',
};

const COLOR_LABELS: Record<string, string> = {
  purple: '보라',
  blue: '파랑',
  green: '초록',
  red: '빨강',
  orange: '주황',
};

export default function Step7Theme({ data, onNext, onBack }: Props) {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(data.themeMode || 'dark');
  const [themeColor, setThemeColor] = useState(data.themeColor || 'purple');

  const mainColor = THEME_COLORS[themeColor] || '#7c3aed';
  const isDark = themeMode === 'dark';

  return (
    <div>
      <h2 style={stepTitle}>테마를 선택하세요</h2>
      <p style={stepDesc}>코코봇 페이지의 디자인 테마를 선택하세요</p>

      <div style={formCard}>
        {/* 다크/라이트 모드 */}
        <div style={formGroup}>
          <label style={formLabel}>기본 모드</label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '0.75rem' }}>
            {([['dark', '🌙', '다크 모드'], ['light', '☀️', '라이트 모드']] as const).map(([mode, icon, label]) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px',
                  background: themeMode === mode ? 'rgba(99,102,241,0.15)' : 'var(--surface-2)',
                  border: `2px solid ${themeMode === mode ? '#6366f1' : 'var(--border-default)'}`,
                  borderRadius: '12px',
                  color: themeMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 색상 선택 */}
        <div style={{ ...formGroup, marginTop: '1.5rem' }}>
          <label style={formLabel}>주요 색상</label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(THEME_COLORS).map(([key, hex]) => (
              <div
                key={key}
                onClick={() => setThemeColor(key)}
                title={COLOR_LABELS[key]}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: hex,
                  cursor: 'pointer',
                  border: `3px solid ${themeColor === key ? 'var(--surface-0)' : 'transparent'}`,
                  boxShadow: themeColor === key ? '0 0 0 3px var(--text-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  transition: 'all 0.2s',
                  transform: themeColor === key ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {themeColor === key ? '✓' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* 미리보기 */}
        <div style={{ ...formGroup, marginTop: '1.5rem' }}>
          <label style={formLabel}>미리보기</label>
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            marginTop: '0.75rem',
          }}>
            {/* 헤더 */}
            <div style={{ padding: '12px 16px', fontWeight: 700, color: 'white', fontSize: '0.9rem', background: mainColor }}>
              {data.botName || '코코봇 이름'}
            </div>
            {/* 채팅 영역 */}
            <div style={{
              padding: '16px',
              background: isDark ? '#1a1a2e' : '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                maxWidth: '80%',
                alignSelf: 'flex-start',
                background: isDark ? '#2a2a3e' : '#ffffff',
                color: isDark ? 'rgba(255,255,255,0.9)' : '#333',
              }}>
                안녕하세요! 무엇이든 물어보세요.
              </div>
              <div style={{
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                maxWidth: '80%',
                alignSelf: 'flex-end',
                marginLeft: 'auto',
                background: mainColor,
                color: 'white',
              }}>
                안녕하세요!
              </div>
            </div>
          </div>
        </div>

        <StepActions
          onBack={onBack}
          onNext={() => onNext({ themeMode, themeColor })}
          nextLabel="다음: 생성 →"
        />
      </div>
    </div>
  );
}
