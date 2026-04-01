// @task S1DS1 - 디자인 시스템 구축 (Light/Dark/System 3모드)
// (S1BI1 기반 확장 — darkMode: 'class' 유지, CSS 변수 토큰 추가)
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Design Token 색상 (CSS 변수 → Tailwind) ──────────────────
        // 패턴: rgb(var(--color-xxx) / <alpha-value>)
        // 사용 예: bg-primary, text-primary/50, border-border

        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover:   'rgb(var(--color-primary-hover) / <alpha-value>)',
          light:   'rgb(var(--color-primary-light) / <alpha-value>)',
        },

        bg: {
          base:   'rgb(var(--color-bg-base) / <alpha-value>)',
          subtle: 'rgb(var(--color-bg-subtle) / <alpha-value>)',
          muted:  'rgb(var(--color-bg-muted) / <alpha-value>)',
        },

        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          hover:   'rgb(var(--color-surface-hover) / <alpha-value>)',
        },

        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong:  'rgb(var(--color-border-strong) / <alpha-value>)',
        },

        text: {
          primary:   'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted:     'rgb(var(--color-text-muted) / <alpha-value>)',
        },

        // 상태 컬러
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error:   'rgb(var(--color-error) / <alpha-value>)',
        info:    'rgb(var(--color-info) / <alpha-value>)',

        // 챗봇 특화
        chat: {
          user:      'rgb(var(--color-chat-user) / <alpha-value>)',
          bot:       'rgb(var(--color-chat-bot) / <alpha-value>)',
          'user-text': 'rgb(var(--color-chat-user-text) / <alpha-value>)',
          'bot-text':  'rgb(var(--color-chat-bot-text) / <alpha-value>)',
        },

        // ── S1BI1 브랜드 컬러 (하위 호환 유지) ─────────────────────
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },

      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Malgun Gothic', 'Apple SD Gothic Neo', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Consolas', 'monospace'],
      },

      // ── 레이아웃 치수 (CSS 변수 연동) ─────────────────────────────
      width: {
        sidebar: 'var(--sidebar-width)',
      },
      height: {
        header: 'var(--header-height)',
      },
      minHeight: {
        header: 'var(--header-height)',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        header:  'var(--header-height)',
      },
    },
  },
  plugins: [],
};

export default config;
