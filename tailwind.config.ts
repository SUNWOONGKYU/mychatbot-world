// @task S7FE1 - Tailwind + globals.css 재구성 (토큰 시스템 코드 반영)
// MCW Design Tokens v3.0 — S7 OKLCH Primitive(84) + Semantic(41)
// 기반: S7DS4 Primitives, S7DS5 Semantic, S7DS3 7원칙
// 하위 호환: S5FE1 v2.0 (퍼플 + 앰버 골드 alias 유지)

import type { Config } from 'tailwindcss';

const config: Config = {
  // 다크 모드: .dark 클래스 + data-theme="dark" 속성 동시 지원
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ═════════════════════════════════════════════════════════════
      // §1. COLORS — S7 Primitive + Semantic + 하위호환 alias
      // ═════════════════════════════════════════════════════════════
      colors: {
        // ───────────────────────────────────────────────────────────
        // S7 Primitive — OKLCH 84 (모드 공용 원자료)
        // ───────────────────────────────────────────────────────────
        neutral: {
          0:    'var(--color-neutral-0)',
          50:   'var(--color-neutral-50)',
          100:  'var(--color-neutral-100)',
          200:  'var(--color-neutral-200)',
          300:  'var(--color-neutral-300)',
          400:  'var(--color-neutral-400)',
          500:  'var(--color-neutral-500)',
          600:  'var(--color-neutral-600)',
          700:  'var(--color-neutral-700)',
          800:  'var(--color-neutral-800)',
          850: 'rgb(var(--neutral-850) / <alpha-value>)', // 레거시 RGB 트리플렛
          900:  'var(--color-neutral-900)',
          950:  'var(--color-neutral-950)',
          1000: 'var(--color-neutral-1000)',
        },

        brand: {
          50:   'var(--color-brand-50)',
          100:  'var(--color-brand-100)',
          200:  'var(--color-brand-200)',
          300:  'var(--color-brand-300)',
          400:  'var(--color-brand-400)',
          500:  'var(--color-brand-500)',
          600:  'var(--color-brand-600)',
          700:  'var(--color-brand-700)',
          800:  'var(--color-brand-800)',
          900:  'var(--color-brand-900)',
          950:  'var(--color-brand-950)',
          1000: 'var(--color-brand-1000)',
        },

        'accent-amber': {
          50:   'var(--color-accent-50)',
          100:  'var(--color-accent-100)',
          200:  'var(--color-accent-200)',
          300:  'var(--color-accent-300)',
          400:  'var(--color-accent-400)',
          500:  'var(--color-accent-500)',
          600:  'var(--color-accent-600)',
          700:  'var(--color-accent-700)',
          800:  'var(--color-accent-800)',
          900:  'var(--color-accent-900)',
          950:  'var(--color-accent-950)',
          1000: 'var(--color-accent-1000)',
        },

        success: {
          50:   'var(--color-success-50)',
          100:  'var(--color-success-100)',
          200:  'var(--color-success-200)',
          300:  'var(--color-success-300)',
          400:  'var(--color-success-400)',
          500:  'var(--color-success-500)',
          600:  'var(--color-success-600)',
          700:  'var(--color-success-700)',
          800:  'var(--color-success-800)',
          900:  'var(--color-success-900)',
          950:  'var(--color-success-950)',
          1000: 'var(--color-success-1000)',
          // 레거시 single-value alias (S5FE1 호환)
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
        },

        warning: {
          50:   'var(--color-warning-50)',
          100:  'var(--color-warning-100)',
          200:  'var(--color-warning-200)',
          300:  'var(--color-warning-300)',
          400:  'var(--color-warning-400)',
          500:  'var(--color-warning-500)',
          600:  'var(--color-warning-600)',
          700:  'var(--color-warning-700)',
          800:  'var(--color-warning-800)',
          900:  'var(--color-warning-900)',
          950:  'var(--color-warning-950)',
          1000: 'var(--color-warning-1000)',
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
        },

        danger: {
          50:   'var(--color-danger-50)',
          100:  'var(--color-danger-100)',
          200:  'var(--color-danger-200)',
          300:  'var(--color-danger-300)',
          400:  'var(--color-danger-400)',
          500:  'var(--color-danger-500)',
          600:  'var(--color-danger-600)',
          700:  'var(--color-danger-700)',
          800:  'var(--color-danger-800)',
          900:  'var(--color-danger-900)',
          950:  'var(--color-danger-950)',
          1000: 'var(--color-danger-1000)',
        },

        info: {
          50:   'var(--color-info-50)',
          100:  'var(--color-info-100)',
          200:  'var(--color-info-200)',
          300:  'var(--color-info-300)',
          400:  'var(--color-info-400)',
          500:  'var(--color-info-500)',
          600:  'var(--color-info-600)',
          700:  'var(--color-info-700)',
          800:  'var(--color-info-800)',
          900:  'var(--color-info-900)',
          950:  'var(--color-info-950)',
          1000: 'var(--color-info-1000)',
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
        },

        // ───────────────────────────────────────────────────────────
        // S7 Semantic — Elevation (Surface) / Text / Border / Ring
        // ───────────────────────────────────────────────────────────
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
          // 레거시 DEFAULT/hover (S5FE1 호환)
          DEFAULT: 'rgb(var(--bg-surface) / <alpha-value>)',
          hover:   'rgb(var(--bg-surface-hover) / <alpha-value>)',
        },

        text: {
          // S7 신규
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary:  'var(--text-tertiary)',
          inverted:  'var(--text-inverted)',
          link:      'var(--text-link)',
          disabled:  'var(--text-disabled)',
          // 레거시 (S5FE1 호환)
          muted:        'rgb(var(--text-muted) / <alpha-value>)',
          'on-primary': 'rgb(var(--text-on-primary) / <alpha-value>)',
          'on-accent':  'rgb(var(--text-on-accent) / <alpha-value>)',
        },

        border: {
          // S7 신규
          subtle:  'var(--border-subtle)',
          default: 'var(--border-default)',
          strong:  'var(--border-strong)',
          // 레거시 (S5FE1 호환)
          DEFAULT: 'rgb(var(--border))',
          primary: 'rgb(var(--border-primary) / <alpha-value>)',
        },

        ring: {
          focus:  'var(--ring-focus)',
          offset: 'var(--ring-offset)',
        },

        // ───────────────────────────────────────────────────────────
        // S7 Semantic — Interactive (Action)
        // ───────────────────────────────────────────────────────────
        interactive: {
          'primary':           'var(--interactive-primary)',
          'primary-hover':     'var(--interactive-primary-hover)',
          'primary-active':    'var(--interactive-primary-active)',
          'secondary':         'var(--interactive-secondary)',
          'secondary-hover':   'var(--interactive-secondary-hover)',
          'destructive':       'var(--interactive-destructive)',
          'destructive-hover': 'var(--interactive-destructive-hover)',
        },

        // ───────────────────────────────────────────────────────────
        // S7 Semantic — State (bg/fg/border 3속성)
        // ───────────────────────────────────────────────────────────
        state: {
          success: {
            bg:     'var(--state-success-bg)',
            fg:     'var(--state-success-fg)',
            border: 'var(--state-success-border)',
          },
          warning: {
            bg:     'var(--state-warning-bg)',
            fg:     'var(--state-warning-fg)',
            border: 'var(--state-warning-border)',
          },
          danger: {
            bg:     'var(--state-danger-bg)',
            fg:     'var(--state-danger-fg)',
            border: 'var(--state-danger-border)',
          },
          info: {
            bg:     'var(--state-info-bg)',
            fg:     'var(--state-info-fg)',
            border: 'var(--state-info-border)',
          },
        },

        // ───────────────────────────────────────────────────────────
        // S7 Semantic — Accent
        // ───────────────────────────────────────────────────────────
        accent: {
          primary:   'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          // 레거시 (S5FE1 호환)
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover:   'rgb(var(--color-accent-hover) / <alpha-value>)',
          muted:   'rgb(var(--color-accent-muted) / <alpha-value>)',
          50:  'rgb(var(--amber-50)  / <alpha-value>)',
          100: 'rgb(var(--amber-100) / <alpha-value>)',
          200: 'rgb(var(--amber-200) / <alpha-value>)',
          300: 'rgb(var(--amber-300) / <alpha-value>)',
          400: 'rgb(var(--amber-400) / <alpha-value>)',
          500: 'rgb(var(--amber-500) / <alpha-value>)',
          600: 'rgb(var(--amber-600) / <alpha-value>)',
          700: 'rgb(var(--amber-700) / <alpha-value>)',
          800: 'rgb(var(--amber-800) / <alpha-value>)',
          900: 'rgb(var(--amber-900) / <alpha-value>)',
        },

        // ═════════════════════════════════════════════════════════
        // 하위 호환 alias — shadcn/ui 및 S5FE1 v2.0 기존 코드 지원
        // 기존 25+ 페이지가 사용 중이므로 제거 금지
        // ═════════════════════════════════════════════════════════

        // shadcn 패턴 (background/foreground/primary/secondary/...)
        background:           'var(--surface-0)',
        foreground:           'var(--text-primary)',

        // 레거시 primary (퍼플 팔레트 + interactive 매핑)
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
          DEFAULT:       'var(--interactive-primary)',
          foreground:    'var(--text-inverted)',
          hover:         'var(--interactive-primary-hover)',
          muted:         'rgb(var(--color-primary-muted) / <alpha-value>)',
        },

        secondary: {
          DEFAULT:    'var(--interactive-secondary)',
          foreground: 'var(--text-primary)',
          hover:      'var(--interactive-secondary-hover)',
        },

        muted: {
          DEFAULT:    'rgb(var(--bg-muted) / <alpha-value>)',
          foreground: 'rgb(var(--text-muted) / <alpha-value>)',
        },

        destructive: {
          DEFAULT:    'var(--interactive-destructive)',
          foreground: 'var(--text-inverted)',
          hover:      'var(--interactive-destructive-hover)',
        },

        card: {
          DEFAULT:    'var(--surface-2)',
          foreground: 'var(--text-primary)',
        },

        popover: {
          DEFAULT:    'var(--surface-3)',
          foreground: 'var(--text-primary)',
        },

        // 레거시 입력 필드
        input: 'var(--border-default)',

        // 레거시 bg 토큰 (S5FE1 — bg-bg-base, bg-bg-surface 등)
        bg: {
          base:             'rgb(var(--bg-base)           / <alpha-value>)',
          subtle:           'rgb(var(--bg-subtle)         / <alpha-value>)',
          muted:            'rgb(var(--bg-muted)          / <alpha-value>)',
          surface:          'rgb(var(--bg-surface)        / <alpha-value>)',
          'surface-hover':  'rgb(var(--bg-surface-hover)  / <alpha-value>)',
          'surface-raised': 'rgb(var(--bg-surface-raised) / <alpha-value>)',
        },

        // 레거시 상태 (단일 값) — state.xxx와 별도 유지
        error: 'rgb(var(--color-error) / <alpha-value>)',

        // 챗봇 버블 토큰 (S5FE1)
        chat: {
          'user-bg':   'rgb(var(--chat-user-bg)   / <alpha-value>)',
          'user-text': 'rgb(var(--chat-user-text) / <alpha-value>)',
          'bot-bg':    'rgb(var(--chat-bot-bg)    / <alpha-value>)',
          'bot-text':  'rgb(var(--chat-bot-text) / <alpha-value>)',
        },
      },

      // ═════════════════════════════════════════════════════════════
      // §2. FONT FAMILY (S5FE1 유지)
      // ═════════════════════════════════════════════════════════════
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

      // ═════════════════════════════════════════════════════════════
      // §3. FONT SIZE — Hero 대형 타이틀 포함 (S5FE1 유지)
      // ═════════════════════════════════════════════════════════════
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

      // ═════════════════════════════════════════════════════════════
      // §4. BORDER RADIUS (S5FE1 유지)
      // ═════════════════════════════════════════════════════════════
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

      // ═════════════════════════════════════════════════════════════
      // §5. BOX SHADOW — S7 Elevation 토큰 연동
      // ═════════════════════════════════════════════════════════════
      boxShadow: {
        sm:             'var(--shadow-sm)',
        md:             'var(--shadow-md)',
        lg:             'var(--shadow-lg)',
        xl:             'var(--shadow-xl)',
        // 레거시 (S5FE1 — pulse-glow 애니메이션 등)
        'primary-glow': 'var(--shadow-primary-glow)',
        'accent-glow':  'var(--shadow-accent-glow)',
      },

      // ═════════════════════════════════════════════════════════════
      // §6. BACKGROUND IMAGE — 그라데이션 프리셋 (S5FE1 유지)
      // ═════════════════════════════════════════════════════════════
      backgroundImage: {
        'gradient-ai':          'var(--gradient-ai)',
        'gradient-primary':     'var(--gradient-primary)',
        'gradient-revenue':     'var(--gradient-revenue)',
        'gradient-accent':      'var(--gradient-accent)',
        'gradient-hero-dark':   'var(--gradient-hero-dark)',
        'gradient-hero-light':  'var(--gradient-hero-light)',
      },

      // ═════════════════════════════════════════════════════════════
      // §7. LAYOUT (S5FE1 유지)
      // ═════════════════════════════════════════════════════════════
      width:     { sidebar: 'var(--sidebar-width)' },
      height:    { header: 'var(--header-height)', tabbar: 'var(--mobile-tabbar)' },
      minHeight: { header: 'var(--header-height)' },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        header:  'var(--header-height)',
        tabbar:  'var(--mobile-tabbar)',
      },

      // ═════════════════════════════════════════════════════════════
      // §8. TRANSITION — S7FE8 Motion Token (기존 유지 + 신규 추가)
      // ═════════════════════════════════════════════════════════════
      transitionDuration: {
        // ── 기존 (S5FE1 유지) ──
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        // ── S7FE8 신규: CSS --motion-* 토큰과 동기화 ──
        'motion-75':  '75ms',
        'motion-150': '150ms',
        'motion-250': '250ms',
        'motion-350': '350ms',
        'motion-500': '500ms',
      },

      // ── S7FE8: Easing 유틸리티 (CSS --ease-* 와 동일한 값) ──────────────
      transitionTimingFunction: {
        standard:   'cubic-bezier(0.4, 0, 0.2, 1)', /* --ease-standard */
        accelerate: 'cubic-bezier(0.4, 0, 1,   1)', /* --ease-accelerate */
        decelerate: 'cubic-bezier(0, 0, 0.2,   1)', /* --ease-decelerate */
      },

      // ═════════════════════════════════════════════════════════════
      // §9. KEYFRAMES + ANIMATION (S5FE1 유지 + S7FE8 신규)
      // ═════════════════════════════════════════════════════════════
      keyframes: {
        // ── 기존 (S5FE1 유지) ──
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
        // ── S7FE8 신규 Motion 키프레임 ──
        // fadeInUpMotion: Motion Token 기반 (250ms decelerate)
        fadeInUpMotion: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // fadeInScaleMotion: 중앙 스케일 페이드인 (Dialog)
        fadeInScaleMotion: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        // listItemIn: 리스트 순차 등장용 아이템 (stagger 시 CSS fallback)
        listItemIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // ── 기존 (S5FE1 유지) ──
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'shimmer':    'shimmer 2s linear infinite',
        'count-up':   'countUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        // ── S7FE8 신규: Motion Token 기반 유틸리티 클래스 ──
        // duration은 --motion-* CSS var 값과 동기화
        'motion-fade-in-up':    'fadeInUpMotion 0.25s cubic-bezier(0, 0, 0.2, 1) both',
        'motion-fade-in-scale': 'fadeInScaleMotion 0.25s cubic-bezier(0, 0, 0.2, 1) both',
        'motion-list-item':     'listItemIn 0.25s cubic-bezier(0, 0, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
