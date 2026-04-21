// @task S1DS1 - 디자인 시스템 구축 (Light/Dark/System 3모드)
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * ThemeProvider — next-themes 래퍼
 *
 * - attribute="class"        : <html class="dark"> 방식으로 다크모드 토글
 * - defaultTheme="dark"      : 최초 방문 시 무조건 다크 (브랜드 기본 = 다크)
 * - enableSystem              : System 모드 활성화
 * - disableTransitionOnChange : 테마 전환 시 CSS transition 깜빡임 방지
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
