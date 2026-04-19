/**
 * @task S2FE5 - Birth 페이지 React 전환
 * @file components/birth/share-buttons.tsx
 * @description 공유 버튼 그룹 (URL 복사, 카카오톡 공유, 링크 열기)
 *
 * 공유 방법:
 *  1) URL 복사   — navigator.clipboard.writeText
 *  2) 카카오 공유 — Kakao SDK sendDefault (SDK 미로딩 시 카카오 공유 URL 폴백)
 *  3) 링크 열기  — window.open (새 탭)
 *
 * 디자인 토큰: bg-primary, text-primary, border-border
 * 복사 완료 피드백: 2초간 "복사됨!" 표시
 */
'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';

/** ShareButtons Props */
export interface ShareButtonsProps {
  /** 공유할 배포 URL */
  deployUrl: string;
  /** 코코봇 이름 (카카오 공유 텍스트용) */
  botName: string;
  /** 추가 className */
  className?: string;
}

/**
 * 카카오 SDK 공유 폴백 URL 생성
 * SDK 미로드 시 카카오 공유 scheme URL로 대체
 */
function buildKakaoFallbackUrl(url: string, title: string): string {
  const params = new URLSearchParams({
    app_key: '',        // SDK 없이는 링크만 공유
    link: url,
    title: title,
  });
  // Web Share API 또는 카카오 웹 공유 URL
  return `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
}

/**
 * ShareButtons — URL 복사 / 카카오 / 링크 열기 버튼 그룹
 *
 * @example
 * <ShareButtons deployUrl="https://..." botName="내 코코봇" />
 */
export function ShareButtons({ deployUrl, botName, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  /**
   * URL 클립보드 복사
   * navigator.clipboard 미지원 시 execCommand 폴백
   */
  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(deployUrl);
      } else {
        // 구형 브라우저 폴백
        const textarea = document.createElement('textarea');
        textarea.value = deployUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ShareButtons] 클립보드 복사 실패:', err);
    }
  }, [deployUrl]);

  /**
   * 카카오톡 공유
   * window.Kakao SDK가 로드되어 있으면 SDK 사용, 아니면 URL 폴백
   */
  const handleKakao = useCallback(() => {
    const title = `${botName} — AI 코코봇`;
    const description = 'CoCoBot에서 만든 AI 코코봇입니다. 대화해 보세요!';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Kakao = (window as any).Kakao;

    if (Kakao && Kakao.isInitialized?.()) {
      try {
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description,
            imageUrl: `${window.location.origin}/og-image.png`,
            link: {
              mobileWebUrl: deployUrl,
              webUrl: deployUrl,
            },
          },
          buttons: [
            {
              title: '코코봇과 대화하기',
              link: { mobileWebUrl: deployUrl, webUrl: deployUrl },
            },
          ],
        });
      } catch (err) {
        console.warn('[ShareButtons] Kakao SDK 공유 실패, 폴백 사용:', err);
        window.open(buildKakaoFallbackUrl(deployUrl, title), '_blank', 'noopener,noreferrer');
      }
    } else {
      // SDK 미로드 — 카카오 스토리 공유 URL 폴백
      window.open(buildKakaoFallbackUrl(deployUrl, title), '_blank', 'noopener,noreferrer');
    }
  }, [deployUrl, botName]);

  /**
   * 새 탭으로 링크 열기
   */
  const handleOpenLink = useCallback(() => {
    window.open(deployUrl, '_blank', 'noopener,noreferrer');
  }, [deployUrl]);

  return (
    <div
      className={clsx('flex flex-wrap items-center justify-center gap-3', className)}
      role="group"
      aria-label="공유 옵션"
    >
      {/* URL 복사 버튼 */}
      <button
        type="button"
        onClick={handleCopy}
        className={clsx(
          'flex items-center gap-2 px-5 py-2.5 rounded-lg',
          'text-sm font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          copied
            ? 'bg-success/10 text-success border border-success/30'
            : 'bg-primary text-white hover:bg-primary-hover active:scale-95',
        )}
        aria-label={copied ? '복사됨' : 'URL 복사'}
      >
        {/* 아이콘: 복사 → 체크 */}
        <span className="text-base leading-none" aria-hidden="true">
          {copied ? '✓' : '⎘'}
        </span>
        <span>{copied ? '복사됨!' : 'URL 복사'}</span>
      </button>

      {/* 카카오톡 공유 버튼 */}
      <button
        type="button"
        onClick={handleKakao}
        className={clsx(
          'flex items-center gap-2 px-5 py-2.5 rounded-lg',
          'text-sm font-medium transition-all duration-200',
          'bg-[#FEE500] text-[#191919]',
          'hover:bg-[#F5DC00] active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEE500] focus-visible:ring-offset-2',
          'border border-[#F5DC00]',
        )}
        aria-label="카카오톡으로 공유"
      >
        <span className="text-base leading-none" aria-hidden="true">💬</span>
        <span>카카오톡 공유</span>
      </button>

      {/* 링크 열기 버튼 */}
      <button
        type="button"
        onClick={handleOpenLink}
        className={clsx(
          'flex items-center gap-2 px-5 py-2.5 rounded-lg',
          'text-sm font-medium transition-all duration-200',
          'bg-surface border border-border text-text-primary',
          'hover:bg-surface-hover hover:border-border-strong active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
        aria-label="새 탭에서 코코봇 열기"
      >
        <span className="text-base leading-none" aria-hidden="true">↗</span>
        <span>링크 열기</span>
      </button>
    </div>
  );
}
