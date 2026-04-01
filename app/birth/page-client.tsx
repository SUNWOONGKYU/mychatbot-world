/**
 * @task S2FE5 - Birth 페이지 React 전환
 * @file app/birth/page-client.tsx
 * @description Birth 페이지 클라이언트 컴포넌트 — 애니메이션 오케스트레이션
 *
 * Server Component(page.tsx)에서 봇 데이터를 받아
 * BirthAnimation + 각 단계 컴포넌트를 조합.
 *
 * 애니메이션 5단계:
 *  Step 1 — 챗봇 아이콘 (avatarUrl 있으면 이미지, 없으면 이모지 폴백)
 *  Step 2 — "탄생했습니다!" + 봇 이름
 *  Step 3 — 배포 URL 텍스트
 *  Step 4 — QR코드
 *  Step 5 — 공유 버튼
 *
 * 디자인 토큰: bg-bg-base, text-primary, text-text-secondary, bg-surface
 */
'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { BirthAnimation } from '@/components/birth/animation';
import { QrDisplay } from '@/components/birth/qr-display';
import { ShareButtons } from '@/components/birth/share-buttons';

/** BirthPageClient Props */
interface BirthPageClientProps {
  /** 봇 데이터 (page.tsx에서 서버사이드 페칭) */
  bot: {
    id: string;
    name: string;
    description: string;
    avatarUrl?: string;
    createdAt: string;
  };
  /** 배포 URL */
  deployUrl: string;
}

// ─────────────────────────────────────────────
// Step 1: 챗봇 아이콘
// ─────────────────────────────────────────────

/** BotIcon — avatarUrl 있으면 이미지, 없으면 로봇 이모지 */
function BotIcon({ avatarUrl, name }: { avatarUrl?: string; name: string }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        'w-28 h-28 rounded-3xl',
        'bg-primary/10 border-4 border-primary/20',
        'shadow-xl shadow-primary/10',
        'overflow-hidden',
      )}
      aria-label={`${name} 챗봇 아이콘`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={112}
          height={112}
          className="object-cover w-full h-full"
          priority
        />
      ) : (
        <span className="text-5xl select-none" role="img" aria-label="로봇">
          🤖
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 2: 탄생 타이틀
// ─────────────────────────────────────────────

/** BirthTitle — "탄생했습니다!" + 봇 이름 */
function BirthTitle({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-lg font-semibold text-success">
        ✨ 탄생했습니다!
      </p>
      <h1 className="text-3xl font-bold text-text-primary tracking-tight">
        {name}
      </h1>
      <p className="text-sm text-text-secondary max-w-xs">
        AI 챗봇이 성공적으로 생성되었습니다.
        <br />아래 URL로 바로 대화할 수 있어요.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 3: URL 표시 (텍스트 배지)
// ─────────────────────────────────────────────

/** DeployUrlBadge — 배포 URL을 강조 배지로 표시 */
function DeployUrlBadge({ deployUrl }: { deployUrl: string }) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-4 py-2.5 rounded-full',
        'bg-primary/10 border border-primary/20',
        'max-w-sm overflow-hidden',
      )}
    >
      <span className="text-primary text-sm shrink-0" aria-hidden="true">🔗</span>
      <span
        className="text-sm font-mono text-primary truncate"
        title={deployUrl}
      >
        {deployUrl}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Client Component
// ─────────────────────────────────────────────

/**
 * BirthPageClient — 탄생 페이지 클라이언트 렌더러
 *
 * 5단계 순서형 애니메이션을 BirthAnimation에 위임.
 * 레이아웃: 중앙 정렬 세로 스택, 최대 너비 sm.
 *
 * @example
 * // page.tsx (Server Component)에서:
 * <BirthPageClient bot={bot} deployUrl={deployUrl} />
 */
export function BirthPageClient({ bot, deployUrl }: BirthPageClientProps) {
  /** 5단계 애니메이션 콘텐츠 배열 */
  const animationSteps: React.ReactNode[] = [
    // Step 1: 아이콘
    <BotIcon key="icon" avatarUrl={bot.avatarUrl} name={bot.name} />,

    // Step 2: 타이틀
    <BirthTitle key="title" name={bot.name} />,

    // Step 3: URL 배지
    <DeployUrlBadge key="url" deployUrl={deployUrl} />,

    // Step 4: QR코드
    <QrDisplay key="qr" deployUrl={deployUrl} size={180} />,

    // Step 5: 공유 버튼
    <ShareButtons key="share" deployUrl={deployUrl} botName={bot.name} />,
  ];

  return (
    <div
      className={clsx(
        'min-h-[calc(100vh-var(--header-height))]',
        'flex flex-col items-center justify-center',
        'px-4 py-12',
        'bg-bg-base',
      )}
    >
      {/* 카드 컨테이너 */}
      <div
        className={clsx(
          'w-full max-w-sm',
          'bg-surface rounded-3xl',
          'border border-border',
          'shadow-2xl shadow-primary/5',
          'p-8 pb-10',
        )}
      >
        {/* 상단 완료 배지 */}
        <div className="flex justify-center mb-8">
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full',
              'bg-success/10 text-success text-xs font-semibold',
              'border border-success/20',
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            생성 완료
          </span>
        </div>

        {/* 순서형 애니메이션 */}
        <BirthAnimation
          steps={animationSteps}
          stepDelayMs={400}
        />

        {/* 하단 안내 텍스트 */}
        <p className="text-center text-xs text-text-muted mt-8">
          QR코드를 스캔하거나 URL을 공유해 챗봇을 알려보세요.
        </p>
      </div>
    </div>
  );
}
