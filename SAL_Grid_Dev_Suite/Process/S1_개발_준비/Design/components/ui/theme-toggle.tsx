// @task S1DS1 - 디자인 시스템 구축 (Light/Dark/System 3모드)
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeOption {
  value: ThemeMode;
  label: string;
  icon: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light',  label: '라이트', icon: '☀' },
  { value: 'dark',   label: '다크',   icon: '☽' },
  { value: 'system', label: '시스템', icon: '◑' },
];

/**
 * ThemeToggle — Light / Dark / System 3버튼 토글
 *
 * Hydration mismatch 방지: mounted 상태 확인 후 렌더링
 * 활성 버튼: design token 기반 primary 색상 강조
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 전에는 렌더링하지 않음 (SSR hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // 서버/하이드레이션 단계 — 스켈레톤 placeholder
    return (
      <div
        className="inline-flex rounded-lg border border-border bg-surface p-1 gap-1"
        aria-label="테마 선택"
        role="radiogroup"
      >
        {THEME_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className="h-8 w-16 rounded-md bg-bg-subtle animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-surface p-1 gap-1"
      aria-label="테마 선택"
      role="radiogroup"
    >
      {THEME_OPTIONS.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            aria-label={`${opt.label} 모드`}
            onClick={() => setTheme(opt.value)}
            className={[
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5',
              'text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:bg-bg-subtle hover:text-text-primary',
            ].join(' ')}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {opt.icon}
            </span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
