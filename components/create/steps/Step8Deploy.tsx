/**
 * @task S7FE6 — P1 리디자인: Create 위저드 Step 8 (배포)
 * 기반: S7FE1 토큰 + S7FE2 Button + S7FE4 Badge
 * 변경: Semantic 토큰 적용, Badge 활용, Button 위계, 온보딩 카드 색상 토큰화
 * 비즈니스 로직 보존: 채널 선택, URL 복사, QR 다운로드 그대로 유지
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import type { WizardData } from '../CreateWizard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authHeaders } from '@/lib/auth-client';

interface Props {
  data: WizardData;
  onFinish: (finalData: Partial<WizardData>) => void;
}

const CHANNELS = [
  { value: 'web', icon: '🌐', label: '웹', desc: 'cocobot.world' },
  { value: 'kakao', icon: '💬', label: '카카오톡', desc: '카카오 채널 연동' },
  { value: 'telegram', icon: '✈️', label: '텔레그램', desc: '텔레그램 봇 연동' },
];

const ONBOARDING_CARDS = [
  { icon: '💬', title: '지금 대화해보기', desc: '코코봇과 첫 대화', variant: 'brand' as const },
  { icon: '❓', title: 'FAQ 추가하기', desc: '자주 묻는 질문 관리', variant: 'info' as const },
  { icon: '⚡', title: '스킬 장착하기', desc: '코코봇 능력 강화', variant: 'success' as const },
];

// ── 온보딩 카드 ──────────────────────────────────────────────────
function OnboardingCard({
  icon,
  title,
  desc,
  href,
  variant,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
  variant: 'brand' | 'info' | 'success';
}) {
  const colorMap = {
    brand: 'bg-interactive-secondary border-interactive-primary/20 hover:border-interactive-primary/50',
    info:  'bg-state-info-bg border-state-info-border hover:border-state-info-fg/50',
    success: 'bg-state-success-bg border-state-success-border hover:border-state-success-fg/50',
  };

  return (
    <a
      href={href}
      className={`block p-4 rounded-xl border text-center no-underline
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus
        ${colorMap[variant]}`}
    >
      <div className="text-3xl mb-2" aria-hidden="true">{icon}</div>
      <div className="text-sm font-semibold text-text-primary mb-1 [word-break:keep-all]">
        {title}
      </div>
      <div className="text-xs text-text-tertiary [word-break:keep-all]">{desc}</div>
    </a>
  );
}

export default function Step8Deploy({ data, onFinish }: Props) {
  const [channels, setChannels] = useState<string[]>(
    data.deployChannels?.length ? data.deployChannels : ['web']
  );
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(!data.botId);
  const [createError, setCreateError] = useState<string>('');
  const [createdBot, setCreatedBot] = useState<{ botId: string; deployUrl: string; qrSvg: string } | null>(
    data.botId
      ? { botId: data.botId, deployUrl: data.deployUrl ?? '', qrSvg: data.qrSvg ?? '' }
      : null
  );
  const didCreateRef = useRef(false);

  // 마운트 시 1회만 실제 생성 호출
  useEffect(() => {
    if (didCreateRef.current || data.botId) return;
    didCreateRef.current = true;

    (async () => {
      setCreating(true);
      setCreateError('');
      try {
        console.info('[create-bot] 전송 시작', { botName: data.botName, hasBotDesc: !!data.botDesc });
        const res = await fetch('/api/create-bot', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            botName: data.botName,
            botDesc: data.botDesc,
            botUsername: data.botUsername,
            persona: data.persona,
            greeting: data.greeting,
            faqs: data.faqs,
            voice: data.voice,
            interviewText: data.interviewText,
            avatarEmoji: data.avatarEmoji,
            avatarImageData: data.avatarImageData,
            themeMode: data.themeMode,
            themeColor: data.themeColor,
          }),
        });
        const json = await res.json().catch(() => ({}));
        console.info('[create-bot] 응답', { status: res.status, ok: res.ok, json });
        if (!res.ok || !json.success || !json.data?.botId) {
          const msg = json.error || `생성 실패 (HTTP ${res.status})`;
          console.error('[create-bot] 저장 실패:', msg, json);
          setCreateError(msg);
          return;
        }
        console.info('[create-bot] 저장 성공! botId =', json.data.botId);
        setCreatedBot({
          botId: json.data.botId,
          deployUrl: json.data.deployUrl ?? '',
          qrSvg: json.data.qrSvg ?? '',
        });
        // 방어적 draft 제거 — onFinish의 clearDraft가 타이밍 이슈로 누락되는 케이스 대비
        try { sessionStorage.removeItem('mcw_create_draft_v2'); } catch {}
        onFinish({
          botId: json.data.botId,
          deployUrl: json.data.deployUrl ?? null,
          qrSvg: json.data.qrSvg ?? null,
        });
      } catch (e) {
        setCreateError(e instanceof Error ? e.message : '네트워크 오류가 발생했습니다.');
      } finally {
        setCreating(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deployUrl = createdBot?.deployUrl
    || data.deployUrl
    || `${typeof window !== 'undefined' ? window.location.origin : 'https://cocobot.world'}/bot/${data.botUsername || data.botId || 'my-bot'}`;

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('input');
      el.value = deployUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = async () => {
    const svg = createdBot?.qrSvg || data.qrSvg;
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatbot-qr.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deployUrl)}`;
  const botId = createdBot?.botId || data.botId || 'new';
  const botUsername = data.botUsername || botId;
  const qrSvg = createdBot?.qrSvg || data.qrSvg;

  // 생성 중: 로딩 화면
  if (creating) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="text-5xl animate-bounce" aria-hidden="true">⚙️</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-primary [word-break:keep-all]">
            코코봇을 생성하고 있어요...
          </h2>
          <p className="text-sm text-text-tertiary [word-break:keep-all]">
            아바타·테마·목소리를 모두 적용하고 있습니다. 잠시만 기다려주세요.
          </p>
        </div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce { animation: bounce 1s ease infinite; }
        `}</style>
      </div>
    );
  }

  // 생성 실패: 에러 + 재시도
  if (createError && !createdBot) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="text-5xl" aria-hidden="true">⚠️</div>
        <h2 className="text-xl font-bold text-text-primary [word-break:keep-all]">
          코코봇 생성에 실패했습니다
        </h2>
        <div className="mx-auto max-w-md bg-state-danger-bg border border-state-danger-border rounded-lg p-4 text-left">
          <p className="text-sm font-semibold text-state-danger-fg mb-2">에러 메시지</p>
          <p className="text-sm text-state-danger-fg [word-break:keep-all] whitespace-pre-wrap break-words">
            {createError}
          </p>
          <p className="text-xs text-text-tertiary mt-3">
            F12 → Console 탭에서 더 자세한 로그를 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              didCreateRef.current = false;
              setCreateError('');
              setCreating(true);
              window.location.reload();
            }}
          >
            다시 시도
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/mypage">마이 페이지로</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 완료 축하 헤더 */}
      <div className="text-center space-y-3 py-2">
        <div className="text-5xl animate-bounce" aria-hidden="true">🎉</div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-primary [word-break:keep-all]">
            축하합니다! 코코봇 생성 완료!
          </h2>
          <Badge variant="success" tone="subtle" size="md">
            배포 준비 완료
          </Badge>
        </div>
      </div>

      {/* 배포 채널 선택 */}
      <div className="bg-surface-2 border border-border-default rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-text-primary [word-break:keep-all]">
          배포 채널 선택
        </p>
        <div
          className="grid grid-cols-3 gap-3"
          role="group"
          aria-label="배포 채널 선택"
        >
          {CHANNELS.map(ch => {
            const isSelected = channels.includes(ch.value);
            return (
              <label
                key={ch.value}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl
                  border-2 cursor-pointer text-center
                  transition-all duration-200
                  focus-within:ring-2 focus-within:ring-ring-focus
                  ${isSelected
                    ? 'bg-interactive-secondary border-interactive-primary'
                    : 'bg-surface-1 border-border-default hover:border-border-strong'
                  }`}
              >
                <input
                  type="checkbox"
                  name="deployChannel"
                  value={ch.value}
                  checked={isSelected}
                  onChange={() => toggleChannel(ch.value)}
                  className="sr-only"
                  aria-label={ch.label}
                />
                <span className="text-2xl" aria-hidden="true">{ch.icon}</span>
                <span className="text-sm font-semibold text-text-primary [word-break:keep-all]">
                  {ch.label}
                </span>
                <span className="text-xs text-text-tertiary [word-break:keep-all]">
                  {ch.desc}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* URL + QR 섹션 */}
      <div className="bg-surface-2 border border-border-default rounded-xl p-5 space-y-4">
        {/* URL 복사 */}
        <div>
          <label
            htmlFor="deployUrlInput"
            className="block text-sm font-medium text-text-secondary mb-1.5 [word-break:keep-all]"
          >
            코코봇 URL
          </label>
          <div className="flex gap-2">
            <input
              id="deployUrlInput"
              type="text"
              readOnly
              value={deployUrl}
              className="flex-1 h-10 px-3 rounded-lg text-sm text-text-primary
                bg-surface-1 border border-border-default
                focus:outline-none focus:ring-2 focus:ring-ring-focus focus:ring-offset-1 focus:ring-offset-surface-0
                [word-break:break-all]"
              aria-label="배포 URL"
            />
            <Button
              variant={copied ? 'secondary' : 'default'}
              size="sm"
              onClick={handleCopyUrl}
              className="shrink-0"
              aria-label={copied ? 'URL 복사됨' : 'URL 복사'}
            >
              {copied ? '✓ 복사됨' : '복사'}
            </Button>
          </div>
        </div>

        {/* QR 코드 */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-48 h-48 bg-text-inverted rounded-xl overflow-hidden flex items-center justify-center
              border border-border-default shadow-[var(--shadow-sm)]"
            aria-label="QR 코드"
          >
            {qrSvg ? (
              <div
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                className="w-full h-full"
                aria-hidden="true"
              />
            ) : (
              <img
                src={qrImageUrl}
                alt="코코봇 QR 코드"
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQR}
            aria-label="QR 코드 다운로드"
          >
            QR 코드 다운로드
          </Button>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3 flex-wrap justify-center">
        <Button asChild variant="default" size="lg">
          <a href={`/bot/${botUsername}`} aria-label="코코봇과 대화하기">
            코코봇과 대화하기
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="/mypage" aria-label="마이 페이지로 이동">
            마이 페이지로 가기
          </a>
        </Button>
      </div>

      {/* 온보딩 카드 */}
      <div className="pt-4 border-t border-border-subtle">
        <h3 className="text-base font-semibold text-text-primary text-center mb-4 [word-break:keep-all]">
          다음 단계로 이동하세요
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ONBOARDING_CARDS.map((card, idx) => (
            <OnboardingCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              desc={card.desc}
              href={idx === 0 ? `/bot/${botUsername}` : '/mypage'}
              variant={card.variant}
            />
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-text-tertiary [word-break:keep-all]">
        마이페이지에서 지식베이스, 스킬, 코코봇 스쿨을 관리할 수 있습니다.
      </p>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce { animation: bounce 1s ease infinite; }
      `}</style>
    </div>
  );
}
