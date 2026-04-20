/**
 * Step 6: 아바타 설정
 * - 기본 아바타 이모지 6종 (로봇, 남성, 여성, 인물, 비즈니스, 학술)
 * - 프로필 이미지 업로드 (최대 2MB, base64 저장)
 */
'use client';

import { useState, useRef } from 'react';
import type { WizardData } from '../CreateWizard';
import { stepTitle, stepDesc, formCard, formGroup, formLabel, StepActions } from '../ui';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

const AVATAR_EMOJIS = [
  { key: 'robot', icon: '🤖', label: '로봇' },
  { key: 'man', icon: '👨', label: '남성' },
  { key: 'woman', icon: '👩', label: '여성' },
  { key: 'person', icon: '🧑', label: '인물' },
  { key: 'business', icon: '👔', label: '비즈니스' },
  { key: 'academic', icon: '🎓', label: '학술' },
];

export default function Step6Avatar({ data, onNext, onBack }: Props) {
  const [selectedEmoji, setSelectedEmoji] = useState(data.avatarEmoji || 'robot');
  const [imageData, setImageData] = useState<string | null>(data.avatarImageData);
  const [imageError, setImageError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImageError('이미지 파일은 2MB 이하만 업로드 가능합니다.');
      return;
    }
    setImageError('');
    const reader = new FileReader();
    reader.onload = (ev) => setImageData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 style={stepTitle}>아바타를 설정하세요</h2>
      <p style={stepDesc}>코코봇의 얼굴이 될 아바타를 선택하거나 직접 업로드하세요 (선택사항)</p>

      <div style={formCard}>
        {/* 이모지 선택 */}
        <div style={formGroup}>
          <label style={formLabel}>기본 아바타 이모지</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '0.75rem',
          }}>
            {AVATAR_EMOJIS.map(em => (
              <div
                key={em.key}
                role="radio"
                aria-checked={selectedEmoji === em.key}
                aria-label={em.label}
                tabIndex={0}
                onClick={() => setSelectedEmoji(em.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedEmoji(em.key);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  background: selectedEmoji === em.key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${selectedEmoji === em.key ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>{em.icon}</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{em.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div style={{ ...formGroup, marginTop: '1.5rem' }}>
          <label style={formLabel}>프로필 이미지 업로드 (선택사항)</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            {imageData ? (
              <img
                src={imageData}
                alt="avatar"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '8px' }}>
                  클릭하여 이미지 업로드<br />JPG, PNG, GIF (최대 2MB)
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {imageError && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{imageError}</p>
          )}
          {imageData && (
            <button
              onClick={() => { setImageData(null); }}
              style={{
                marginTop: '8px',
                padding: '4px 12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              이미지 제거
            </button>
          )}
        </div>

        <StepActions
          onBack={onBack}
          onNext={() => onNext({ avatarEmoji: selectedEmoji, avatarImageData: imageData })}
          nextLabel="다음: 테마 선택 →"
        />
      </div>
    </div>
  );
}
