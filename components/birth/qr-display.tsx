/**
 * @task S2FE5 - Birth 페이지 React 전환
 * @file components/birth/qr-display.tsx
 * @description QR코드 + 배포 URL 표시 컴포넌트
 *
 * QR 생성: Google Charts API (npm 의존성 없음)
 * URL 형식: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodedUrl}
 *
 * 디자인 토큰: bg-surface, border-border, text-primary, text-text-secondary
 */
'use client';

import Image from 'next/image';
import clsx from 'clsx';

/** QrDisplay Props */
export interface QrDisplayProps {
  /** 배포 URL (QR 코드로 인코딩) */
  deployUrl: string;
  /** QR 이미지 크기 px (기본: 200) */
  size?: number;
  /** 추가 className */
  className?: string;
}

/**
 * QrDisplay — QR코드 이미지 + 배포 URL 표시
 *
 * goqr.me API (api.qrserver.com)를 사용해 서버사이드 QR 이미지 생성.
 * next/image로 최적화 렌더링.
 *
 * @example
 * <QrDisplay deployUrl="https://cocobot.world/bots/abc123" />
 */
export function QrDisplay({ deployUrl, size = 200, className }: QrDisplayProps) {
  const encodedUrl = encodeURIComponent(deployUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&margin=10&color=000000&bgcolor=ffffff`;

  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-4',
        className,
      )}
    >
      {/* QR 코드 이미지 카드 */}
      <div
        className={clsx(
          'p-4 rounded-2xl',
          'bg-white',               // QR은 항상 흰 배경
          'border-2 border-border',
          'shadow-md',
        )}
      >
        <Image
          src={qrImageUrl}
          alt={`QR코드 — ${deployUrl}`}
          width={size}
          height={size}
          className="block"
          priority
          unoptimized          // 외부 동적 URL이므로 Next.js 최적화 우회
        />
      </div>

      {/* 배포 URL 텍스트 */}
      <div className="flex flex-col items-center gap-1 text-center max-w-xs">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          배포 URL
        </span>
        <a
          href={deployUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'text-sm font-medium text-primary',
            'hover:text-primary-hover underline underline-offset-2',
            'transition-colors duration-150',
            'break-all',
          )}
        >
          {deployUrl}
        </a>
      </div>
    </div>
  );
}
