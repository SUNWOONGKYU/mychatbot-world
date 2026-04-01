# Task Instruction - S1BI1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules//03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S1BI1

## Task Name
Next.js 프로젝트 초기화 + Tailwind CSS 설정

## Task Goal
Next.js 14+ App Router 기반 프로젝트를 생성하고 Tailwind CSS, TypeScript, 기본 디렉토리 구조를 구성한다. 이후 모든 프론트엔드·백엔드 작업의 기반이 되는 골격 코드를 확립한다.

## Prerequisites (Dependencies)
- 없음 (독립 Task — S1 최초 실행 항목)

## Specific Instructions

### 1. Next.js 14+ 프로젝트 생성
- `create-next-app@latest` 사용
- App Router 활성화 (`app/` 디렉토리 방식)
- TypeScript 활성화
- ESLint 활성화
- Tailwind CSS 활성화 (초기 설정 포함)
- `src/` 디렉토리 사용 여부: 사용하지 않음 (루트 직접 사용)
- import alias: `@/*` → `./*`

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

### 2. 기본 디렉토리 구조 생성
프로젝트 루트에 아래 폴더들을 생성한다:

```
app/
  layout.tsx          ← 루트 레이아웃
  page.tsx            ← 홈 페이지
  globals.css         ← 전역 스타일
components/
  common/             ← 공통 레이아웃 컴포넌트
  ui/                 ← Shadcn/ui 또는 공용 UI 원자
lib/
  supabase.ts         ← Supabase 클라이언트 (플레이스홀더)
  utils.ts            ← 공통 유틸 함수
public/
  fonts/              ← 커스텀 폰트 (필요 시)
styles/
  themes.css          ← 테마 변수 (S1DS1에서 채움)
types/
  index.ts            ← 전역 타입 정의
```

### 3. package.json 의존성 설정
아래 패키지를 추가 설치한다:

```bash
npm install @supabase/supabase-js next-themes clsx tailwind-merge
npm install -D @types/node
```

`package.json` scripts 확인:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 4. next.config.js 설정
```js
/** @task S1BI1 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'k.kakaocdn.net'],
  },
};

module.exports = nextConfig;
```

### 5. tailwind.config.ts 설정
- `content` 경로: `app/**/*.{js,ts,jsx,tsx,mdx}`, `components/**/*.{js,ts,jsx,tsx,mdx}`
- `darkMode: 'class'` (next-themes와 연동)
- `theme.extend`에 프로젝트 컬러 토큰 플레이스홀더 추가

```ts
/** @task S1BI1 */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 6. tsconfig.json 경로 별칭 확인
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 7. app/layout.tsx 기본 설정
```tsx
/**
 * @task S1BI1
 */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Chatbot World',
  description: 'AI 챗봇 빌더 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

### 8. app/page.tsx 기본 설정
```tsx
/**
 * @task S1BI1
 */
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">My Chatbot World</h1>
    </main>
  );
}
```

### 9. .env.local 파일 생성 (플레이스홀더)
```env
# Supabase (S1BI2에서 실제 값 입력)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 10. 저장 위치
- 원본: `Process/S1_개발_준비/Backend_Infra/` (설정 파일 문서)
- 실제 코드: 프로젝트 루트 (`next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `app/`, `components/`, `lib/`, `types/` 등)
- Pre-commit Hook이 BI 영역 파일을 자동 동기화

## Expected Output Files
- `next.config.js`
- `tailwind.config.ts`
- `tsconfig.json`
- `package.json` (업데이트)
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/common/` (빈 디렉토리)
- `components/ui/` (빈 디렉토리)
- `lib/supabase.ts` (플레이스홀더)
- `lib/utils.ts`
- `styles/themes.css` (플레이스홀더)
- `types/index.ts`
- `.env.local` (플레이스홀더)

## Completion Criteria
- [ ] `npx create-next-app` 완료, 프로젝트 루트에 Next.js 파일 존재
- [ ] `npm run dev` 실행 시 http://localhost:3000 정상 접속
- [ ] `npm run build` 에러 없이 완료
- [ ] `npm run lint` 에러 0개
- [ ] Tailwind 클래스가 브라우저에서 적용되는 것 확인
- [ ] `darkMode: 'class'` 설정 확인
- [ ] 디렉토리 구조 (`app/`, `components/`, `lib/`, `types/`, `styles/`) 존재
- [ ] `.env.local` 파일 존재 (플레이스홀더 상태)

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript 5+
- Tailwind CSS 3+
- next-themes
- clsx, tailwind-merge

## Tools
- npm, npx
- next (CLI)
- git

## Execution Type
AI-Only

## Remarks
- 이 Task는 S1 전체의 기반이 됨. 완료 후 S1DS1(디자인 시스템), S1FE1(레이아웃) 등이 이 위에서 작동
- `src/` 디렉토리 없이 루트 직접 사용 (팀 컨벤션)
- Shadcn/ui는 S1DS1에서 필요 시 추가 설치
- `.env.local`의 실제 Supabase 키는 S1BI2에서 입력

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1BI1 → `Process/S1_개발_준비/Backend_Infra/`

### 제2 규칙: Production 코드는 이중 저장
- BI Area 코드: Stage 폴더 + `api/Backend_Infra/` (Pre-commit Hook 자동 처리)
- 설정 파일(`next.config.js` 등)은 프로젝트 루트에만 존재
