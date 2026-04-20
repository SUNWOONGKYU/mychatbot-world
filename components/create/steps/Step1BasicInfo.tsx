/**
 * @task S7FE6 — P1 리디자인: Create 위저드 Step 1
 * 기반: S7FE1 토큰 + S7FE2 Button + S7FE4 Typography
 * 변경: Semantic 토큰 적용, Step indicator 시각화, Card 감싸기, Field + Typography 개선
 * 비즈니스 로직 보존: koreanToUrl, handleNameChange, handleNext, usernameManual 그대로 유지
 */
'use client';

import { useState, useCallback } from 'react';
import type { WizardData } from '../CreateWizard';
import { MicButton } from '../ui';
import { Button } from '@/components/ui/button';

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
}

// 한글 → URL-safe 변환 (원본 보존)
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

// ── 필드 레이블 컴포넌트 ─────────────────────────────────────────
function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-text-primary mb-1.5 [word-break:keep-all]"
    >
      {children}
      {required && (
        <span className="ml-1 text-state-danger-fg" aria-label="필수">*</span>
      )}
    </label>
  );
}

// ── 입력 필드 공통 스타일 ─────────────────────────────────────────
const inputClass =
  'w-full h-11 px-4 rounded-lg text-sm text-text-primary ' +
  'bg-surface-2 border border-border-default ' +
  'placeholder:text-text-tertiary ' +
  'focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1 focus:ring-offset-surface-0 ' +
  'transition-colors [word-break:keep-all]';

export default function Step1BasicInfo({ data, onNext }: Props) {
  const [botName, setBotName] = useState(data.botName);
  const [botDesc, setBotDesc] = useState(data.botDesc);
  const [botUsername, setBotUsername] = useState(data.botUsername);
  const [usernameManual, setUsernameManual] = useState(false);

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
    if (!confirm(`사용자명(URL)을 "${username}"(으)로 하시겠습니까?\n\n코코봇 주소: cocobot.world/bot/${username}\n\n수정하려면 "취소"를 누르세요.`)) {
      setUsernameManual(true);
      return;
    }
    onNext({ botName: botName.trim(), botDesc: botDesc.trim(), botUsername: username });
  };

  return (
    <div className="space-y-6">
      {/* 단계 제목 */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-text-primary [word-break:keep-all]">
          코코봇의 기본 정보를 입력하세요
        </h2>
        <p className="text-sm text-text-secondary [word-break:keep-all]">
          옆 마이크를 누르면 음성으로 입력됩니다. 직접 텍스트로 입력해도 됩니다.
        </p>
      </div>

      {/* 카드 */}
      <div className="bg-surface-2 border border-border-default rounded-xl p-6 space-y-5">

        {/* 코코봇 이름 */}
        <div>
          <FieldLabel htmlFor="botName" required>코코봇 이름</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              id="botName"
              type="text"
              className={`${inputClass} flex-1`}
              value={botName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="예: 홍길동, 김변호사, 박의원, 최셰프"
              maxLength={30}
              aria-required="true"
            />
            <MicButton
              onResult={(text) => handleNameChange(botName + (botName ? ' ' : '') + text)}
            />
          </div>
        </div>

        {/* 한 줄 소개 */}
        <div>
          <FieldLabel htmlFor="botDesc">한 줄 소개</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              id="botDesc"
              type="text"
              className={`${inputClass} flex-1`}
              value={botDesc}
              onChange={e => setBotDesc(e.target.value)}
              placeholder="예: 나를 대신해 24시간 소통하는 AI 어시스턴트 코코봇"
              maxLength={100}
            />
            <MicButton
              onResult={(text) => setBotDesc(botDesc + (botDesc ? ' ' : '') + text)}
            />
          </div>
        </div>

        {/* 사용자명 (URL) */}
        <div>
          <FieldLabel htmlFor="botUsername">사용자명 (URL용)</FieldLabel>
          <div className="flex items-center gap-2">
            {/* URL prefix + 입력 합성 필드 */}
            <div className="flex flex-1 items-center h-11 rounded-lg
              bg-surface-2 border border-border-default
              focus-within:ring-2 focus-within:ring-ring-focus focus-within:ring-offset-1 focus-within:ring-offset-surface-0
              overflow-hidden transition-shadow">
              <span
                className="pl-4 pr-2 text-xs text-text-tertiary bg-surface-1 h-full flex items-center shrink-0
                  border-r border-border-default whitespace-nowrap"
                aria-hidden="true"
              >
                cocobot.world/bot/
              </span>
              <input
                id="botUsername"
                type="text"
                className="flex-1 h-full px-3 text-sm text-text-primary bg-transparent
                  placeholder:text-text-tertiary focus:outline-none [word-break:keep-all]"
                value={botUsername}
                onChange={e => { setBotUsername(e.target.value); setUsernameManual(true); }}
                onFocus={() => setUsernameManual(true)}
                placeholder="my-bot"
                maxLength={20}
                pattern="[a-z0-9-]+"
                aria-describedby="usernameHint"
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
          <p
            id="usernameHint"
            className="mt-1.5 text-xs text-text-tertiary [word-break:keep-all]"
          >
            음성 입력 시 한글은 자동으로 영문 변환됩니다
          </p>
        </div>

        {/* 다음 버튼 */}
        <Button
          variant="default"
          size="lg"
          className="w-full mt-2"
          onClick={handleNext}
          type="button"
        >
          다음: 페르소나 설정 →
        </Button>
      </div>
    </div>
  );
}
