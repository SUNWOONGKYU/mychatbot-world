// @task S5FE1 - 디자인 시스템 구현 (tailwind.config — 다크/라이트 동시 지원)
// MCW Design System v2.0 — 퍼플 + 앰버 골드 시스템
// CSS 변수 → Tailwind 테마 완전 매핑
// 기반: P2 컬러시스템 (2026_04_07__P2_컬러시스템_디자인토큰.md)

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',   // next-themes attribute="class" 방식
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // .container → 자동 가운데 정렬 + 좌우 패딩
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
    extend: {
      // ── 색상 토큰 ─────────────────────────────────────────────────
      colors: {
        // Primary 팔레트 전체 (바이올렛 퍼플 — 50~950)
        primary: {
          50:      'rgb(var(--primary-50)  / <alpha-value>)',
          100:     'rgb(var(--primary-100) / <alpha-value>)',
          200:     'rgb(var(--primary-200) / <alpha-value>)',
          300:     'rgb(var(--primary-300) / <alpha-value>)',
          400:     'rgb(var(--primary-400) / <alpha-value>)',
          500:     'rgb(var(--primary-500) / <alpha-value>)',
          600:     'rgb(var(--primary-600) / <alpha-value>)',
          700:     'rgb(var(--primary-700) / <alpha-value>)',
          800:     'rgb(var(--primary-800) / <alpha-value>)',
          900:     'rgb(var(--primary-900) / <alpha-value>)',
          950:     'rgb(var(--primary-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover:   'rgb(var(--color-primary-hover) / <alpha-value>)',
          muted:   'rgb(var(--color-primary-muted) / <alpha-value>)',
        },

        // Accent 팔레트 (앰버 골드 — 50~900)
        accent: {
          50:      'rgb(var(--amber-50)  / <alpha-value>)',
          100:     'rgb(var(--amber-100) / <alpha-value>)',
          200:     'rgb(var(--amber-200) / <alpha-value>)',
          300:     'rgb(var(--amber-300) / <alpha-value>)',
          400:     'rgb(var(--amber-400) / <alpha-value>)',
          500:     'rgb(var(--amber-500) / <alpha-value>)',
          600:     'rgb(var(--amber-600) / <alpha-value>)',
          700:     'rgb(var(--amber-700) / <alpha-value>)',
          800:     'rgb(var(--amber-800) / <alpha-value>)',
          900:     'rgb(var(--amber-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover:   'rgb(var(--color-accent-hover) / <alpha-value>)',
          muted:   'rgb(var(--color-accent-muted) / <alpha-value>)',
        },

        // Neutral 팔레트 (슬레이트 — 0~950)
        neutral: {
          0:   'rgb(var(--neutral-0)   / <alpha-value>)',
          50:  'rgb(var(--neutral-50)  / <alpha-value>)',
          100: 'rgb(var(--neutral-100) / <alpha-value>)',
          200: 'rgb(var(--neutral-200) / <alpha-value>)',
          300: 'rgb(var(--neutral-300) / <alpha-value>)',
          400: 'rgb(var(--neutral-400) / <alpha-value>)',
          500: 'rgb(var(--neutral-500) / <alpha-value>)',
          600: 'rgb(var(--neutral-600) / <alpha-value>)',
          700: 'rgb(var(--neutral-700) / <alpha-value>)',
          800: 'rgb(var(--neutral-800) / <alpha-value>)',
          850: 'rgb(var(--neutral-850) / <alpha-value>)',
          900: 'rgb(var(--neutral-900) / <alpha-value>)',
          950: 'rgb(var(--neutral-950) / <alpha-value>)',
        },

        // 시맨틱 배경 토큰 (다크/라이트 자동 전환)
        bg: {
          base:            'rgb(var(--bg-base)           / <alpha-value>)',
          subtle:          'rgb(var(--bg-subtle)          / <alpha-value>)',
          muted:           'rgb(var(--bg-muted)           / <alpha-value>)',
          surface:         'rgb(var(--bg-surface)         / <alpha-value>)',
          'surface-hover':  'rgb(var(--bg-surface-hover)  / <alpha-value>)',
          'surface-raised': 'rgb(var(--bg-surface-raised) / <alpha-value>)',
        },

        // 시맨틱 텍스트 토큰
        text: {
          primary:      'rgb(var(--text-primary)    / <alpha-value>)',
          secondary:    'rgb(var(--text-secondary)  / <alpha-value>)',
          muted:        'rgb(var(--text-muted)       / <alpha-value>)',
          'on-primary': 'rgb(var(--text-on-primary) / <alpha-value>)',
          'on-accent':  'rgb(var(--text-on-accent)  / <alpha-value>)',
        },

        // 시맨틱 보더 토큰 (DEFAULT/subtle/strong = alpha 내장, primary = RGB 트리플렛)
        border: {
          DEFAULT: 'rgb(var(--border))',
          subtle:  'rgb(var(--border-subtle))',
          strong:  'rgb(var(--border-strong))',
          primary: 'rgb(var(--border-primary) / <alpha-value>)',
        },

        // 상태 컬러 (다크/라이트 자동 전환)
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error:   'rgb(var(--color-error)   / <alpha-value>)',
        info:    'rgb(var(--color-info)    / <alpha-value>)',

        // 챗봇 버블 토큰
        chat: {
          'user-bg':   'rgb(var(--chat-user-bg)   / <alpha-value>)',
          'user-text': 'rgb(var(--chat-user-text) / <alpha-value>)',
          'bot-bg':    'rgb(var(--chat-bot-bg)    / <alpha-value>)',
          'bot-text':  'rgb(var(--chat-bot-text)  / <alpha-value>)',
        },

        // ── 하위 호환성: S1DS1 기존 코드 지원 ──────────────────────
        // 기존 코드가 bg-bg-base, text-text-primary 등을 사용했을 때 호환
        // 추가로 S1~S4 코드에서 사용한 변수들 유지
        surface: {
          DEFAULT: 'rgb(var(--bg-surface)        / <alpha-value>)',
          hover:   'rgb(var(--bg-surface-hover)  / <alpha-value>)',
        },

        // 기존 brand 컬러 (S1BI1 하위 호환)
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

      // ── 폰트 ───────────────────────────────────────────────────────
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'PretendardVariable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'monospace',
        ],
      },

      // ── 타이포그래피 스케일 (Hero 대형 타이틀 포함) ────────────────
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.5',   letterSpacing: '0.01em'  }],
        'sm':   ['0.875rem', { lineHeight: '1.5',   letterSpacing: '0.005em' }],
        'base': ['1rem',     { lineHeight: '1.625', letterSpacing: '0'       }],
        'lg':   ['1.125rem', { lineHeight: '1.625', letterSpacing: '-0.005em'}],
        'xl':   ['1.25rem',  { lineHeight: '1.5',   letterSpacing: '-0.01em' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.375', letterSpacing: '-0.015em'}],
        '3xl':  ['1.875rem', { lineHeight: '1.25',  letterSpacing: '-0.02em' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.2',   letterSpacing: '-0.025em'}],
        '5xl':  ['3rem',     { lineHeight: '1.1',   letterSpacing: '-0.03em' }],
        '6xl':  ['3.75rem',  { lineHeight: '1.05',  letterSpacing: '-0.035em'}],
        '7xl':  ['4.5rem',   { lineHeight: '1',     letterSpacing: '-0.04em' }],
      },

      // ── Border Radius ────────────────────────────────────────────
      borderRadius: {
        none:  '0',
        sm:    '0.25rem',   /* 4px  */
        md:    '0.5rem',    /* 8px  */
        lg:    '0.75rem',   /* 12px */
        xl:    '1rem',      /* 16px */
        '2xl': '1.25rem',   /* 20px */
        '3xl': '1.5rem',    /* 24px */
        '4xl': '2rem',      /* 32px */
        full:  '9999px',
      },

      // ── Box Shadow (CSS 변수 연동 — 다크/라이트 자동 전환) ─────────
      boxShadow: {
        sm:             'var(--shadow-sm)',
        md:             'var(--shadow-md)',
        lg:             'var(--shadow-lg)',
        xl:             'var(--shadow-xl)',
        'primary-glow': 'var(--shadow-primary-glow)',
        'accent-glow':  'var(--shadow-accent-glow)',
      },

      // ── 배경 이미지 (그라데이션 프리셋) ─────────────────────────────
      backgroundImage: {
        'gradient-ai':          'var(--gradient-ai)',
        'gradient-primary':     'var(--gradient-primary)',
        'gradient-revenue':     'var(--gradient-revenue)',
        'gradient-accent':      'var(--gradient-accent)',
        'gradient-hero-dark':   'var(--gradient-hero-dark)',
        'gradient-hero-light':  'var(--gradient-hero-light)',
      },

      // ── 레이아웃 치수 ──────────────────────────────────────────────
      width: {
        sidebar: 'var(--sidebar-width)',
      },
      height: {
        header: 'var(--header-height)',
        tabbar: 'var(--mobile-tabbar)',
      },
      minHeight: {
        header: 'var(--header-height)',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        header:  'var(--header-height)',
        tabbar:  'var(--mobile-tabbar)',
      },

      // ── 트랜지션 ─────────────────────────────────────────────────
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },

      // ── Keyframes ─────────────────────────────────────────────────
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(94 75 255 / 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgb(94 75 255 / 0)' },
        },
      },

      // ── 애니메이션 ─────────────────────────────────────────────────
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'shimmer':    'shimmer 2s linear infinite',
        'count-up':   'countUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
