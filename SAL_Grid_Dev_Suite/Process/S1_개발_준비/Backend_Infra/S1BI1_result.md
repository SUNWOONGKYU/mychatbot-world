# S1BI1 Task Result — Next.js 프로젝트 초기화 + Tailwind CSS 설정

**Task ID**: S1BI1
**Stage**: S1 개발 준비
**Area**: Backend Infra
**Status**: DONE
**Completed**: 2026-03-31

---

## 생성된 파일 목록

### Config Files
| 파일 | 설명 |
|------|------|
| `next.config.mjs` | Next.js App Router 설정, 기존 Vanilla 파일 공존 전략 |
| `tsconfig.json` | TypeScript 설정, @/* alias, 참고자료 폴더 exclude |
| `tailwind.config.ts` | darkMode: 'class', 한국어 폰트 포함 |
| `postcss.config.mjs` | Tailwind + Autoprefixer |

### App Router
| 파일 | 설명 |
|------|------|
| `app/layout.tsx` | RootLayout — lang="ko", suppressHydrationWarning |
| `app/page.tsx` | 홈 페이지 skeleton, 기존 데모 링크 연결 |
| `app/globals.css` | Tailwind 지시자, CSS 변수 (라이트/다크) |

### 스켈레톤 디렉토리
| 경로 | 용도 |
|------|------|
| `components/common/` | 공통 컴포넌트 (S1F1~S2F1에서 채움) |
| `components/ui/` | shadcn/ui 스타일 컴포넌트 (S1DS1에서 채움) |

### 라이브러리
| 파일 | 설명 |
|------|------|
| `lib/supabase.ts` | Supabase 클라이언트 초기화 (S1DB1에서 완성) |
| `lib/utils.ts` | cn(), formatDate(), getErrorMessage() |

### 스타일/타입
| 파일 | 설명 |
|------|------|
| `styles/themes.css` | CSS 변수 테마 (라이트/다크), S1DS1에서 확장 |
| `types/index.ts` | 공통 TypeScript 타입: Chatbot, ChatMessage, UserProfile 등 |

### 환경
| 파일 | 설명 |
|------|------|
| `.env.local` | 환경 변수 placeholder (Supabase, NextAuth, AI API) |

---

## package.json 변경사항

### 추가된 dependencies
- `next: ^15.0.0`
- `react: ^19.0.0`
- `react-dom: ^19.0.0`
- `next-themes: ^0.4.4`
- `clsx: ^2.1.1`
- `tailwind-merge: ^2.5.4`

### 추가된 devDependencies
- `typescript: ^5.7.2`
- `@types/react: ^19.0.0`
- `@types/node: ^22.0.0`
- `tailwindcss: ^3.4.17`
- `postcss: ^8.4.49`
- `autoprefixer: ^10.4.20`

### 추가된 scripts
- `"dev": "next dev"`
- `"build": "next build"`
- `"start": "next start"`
- `"lint": "next lint"`

---

## 점진적 전환 전략

기존 Vanilla HTML/JS 파일 보존:
- `docs/index.html`, `demo/*.html` — 그대로 유지
- `pages/` 디렉토리 — Next.js pageExtensions를 `.tsx, .ts`로만 설정해 충돌 방지
- Next.js App Router (`app/`) 는 완전 분리된 새 영역

---

## 다음 단계 (S1 진행 필요)
- `npm install` 실행으로 의존성 설치
- S1DS1: 디자인 시스템 (styles/themes.css 확장)
- S1DB1: Supabase 스키마 설계 (lib/supabase.ts 완성)
- S1M1: 인증 시스템 (NextAuth 또는 Supabase Auth)
- S1F1: 첫 번째 React 컴포넌트 구현
