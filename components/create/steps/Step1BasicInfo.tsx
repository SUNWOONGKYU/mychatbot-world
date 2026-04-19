/**
 * Step 1: 기본정보 — 코코봇 이름, 한줄소개, URL 사용자명 (음성입력 포함)
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WizardData } from '../CreateWizard';
import { MicButton, formCard, stepTitle, stepDesc, formGroup, formLabel, formInput } from '../ui';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
}

// 한글 → URL-safe 변환
function koreanToUrl(text: string): string {
  const CHO = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
  const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
  const JONG = ['','g','kk','gs','n','nj','nh','d','l','lg','lm','lb','ls','lt','lp','lh','m','b','bs','s','ss','ng','j','ch','k','t','p','h'];

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;
      result += CHO[cho] + JUNG[jung] + JONG[jong];
    } else {
      result += text[i];
    }
  }
  return result
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Step1BasicInfo({ data, onNext }: Props) {
  const [botName, setBotName] = useState(data.botName);
  const [botDesc, setBotDesc] = useState(data.botDesc);
  const [botUsername, setBotUsername] = useState(data.botUsername);
  const [usernameManual, setUsernameManual] = useState(false);

  // 이름 자동 URL 생성
  const handleNameChange = useCallback((v: string) => {
    setBotName(v);
    if (!usernameManual) {
      setBotUsername(koreanToUrl(v));
    }
  }, [usernameManual]);

  const handleNext = () => {
    if (!botName.trim()) { alert('코코봇 이름을 입력해주세요'); return; }
    let username = botUsername.trim();
    if (!username) {
      username = koreanToUrl(botName);
      setBotUsername(username);
    }
    if (!confirm(`사용자명(URL)을 "${username}"(으)로 하시겠습니까?\n\n코코봇 주소: mychatbot.world/bot/${username}\n\n수정하려면 "취소"를 누르세요.`)) {
      setUsernameManual(true);
      return;
    }
    onNext({ botName: botName.trim(), botDesc: botDesc.trim(), botUsername: username });
  };

  return (
    <div>
      <h2 style={stepTitle}>코코봇의 기본 정보를 입력하세요</h2>
      <p style={stepDesc}>🎤 옆 마이크를 누르면 음성으로 입력됩니다. 직접 텍스트로 입력해도 됩니다.</p>

      <div style={formCard}>
        <div style={formGroup}>
          <label style={formLabel}>코코봇 이름 *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              style={{ ...formInput, flex: 1 }}
              value={botName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="예: 홍길동, 김변호사, 박의원, 최셰프"
              maxLength={30}
            />
            <MicButton onResult={(text) => handleNameChange(botName + (botName ? ' ' : '') + text)} />
          </div>
        </div>

        <div style={formGroup}>
          <label style={formLabel}>한 줄 소개</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              style={{ ...formInput, flex: 1 }}
              value={botDesc}
              onChange={e => setBotDesc(e.target.value)}
              placeholder="예: 나를 대신해 24시간 소통하는 AI 코코봇"
              maxLength={100}
            />
            <MicButton onResult={(text) => setBotDesc(botDesc + (botDesc ? ' ' : '') + text)} />
          </div>
        </div>

        <div style={formGroup}>
          <label style={formLabel}>사용자명 (URL용)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              overflow: 'hidden',
              flex: 1,
            }}>
              <span style={{
                padding: '0 12px',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,0.04)',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
              }}>
                mychatbot.world/bot/
              </span>
              <input
                type="text"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  padding: '0 12px',
                  fontSize: '0.9rem',
                  height: '48px',
                }}
                value={botUsername}
                onChange={e => { setBotUsername(e.target.value); setUsernameManual(true); }}
                onFocus={() => setUsernameManual(true)}
                placeholder="my-bot"
                maxLength={20}
                pattern="[a-z0-9-]+"
              />
            </div>
            <MicButton
              onResult={(text) => {
                const url = koreanToUrl(text);
                setBotUsername(url);
                setUsernameManual(true);
              }}
            />
          </div>
          <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
            음성 입력 시 한글은 자동으로 영문 변환됩니다
          </small>
        </div>

        <button
          onClick={handleNext}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          다음: 페르소나 설정 →
        </button>
      </div>
    </div>
  );
}
