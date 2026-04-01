# Verification Instruction - S1BI1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1BI1

## Task Name
Next.js 프로젝트 초기화 + Tailwind CSS 설정

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `next.config.js` 존재 및 `@task S1BI1` 주석 포함
- [ ] `tailwind.config.ts` 존재 및 `darkMode: 'class'` 설정
- [ ] `tsconfig.json` 존재 및 `@/*` 경로 별칭 설정
- [ ] `package.json` 존재 및 `next`, `typescript`, `tailwindcss` 의존성 포함
- [ ] `app/layout.tsx` 존재
- [ ] `app/page.tsx` 존재
- [ ] `app/globals.css` 존재
- [ ] `lib/utils.ts` 존재
- [ ] `types/index.ts` 존재
- [ ] `.env.local` 존재

### 2. 디렉토리 구조 검증
- [ ] `components/common/` 디렉토리 존재
- [ ] `components/ui/` 디렉토리 존재
- [ ] `lib/` 디렉토리 존재
- [ ] `styles/` 디렉토리 존재
- [ ] `types/` 디렉토리 존재

### 3. 빌드 및 실행 검증
- [ ] `npm run dev` 정상 실행 (http://localhost:3000 접속 가능)
- [ ] `npm run build` 에러 없이 완료
- [ ] `npm run lint` ESLint 에러 0개

### 4. 기능 검증
- [ ] Tailwind CSS 클래스가 브라우저에서 실제 적용됨
- [ ] `darkMode: 'class'` 설정으로 dark 클래스 전환 작동
- [ ] TypeScript 타입 에러 없음 (`tsc --noEmit` 통과)
- [ ] `@supabase/supabase-js` `next-themes` `clsx` `tailwind-merge` 패키지 설치됨

### 5. 설정 내용 검증
- [ ] `tailwind.config.ts`의 `content` 경로가 `app/**`, `components/**` 포함
- [ ] `next.config.js`에 이미지 도메인 (`lh3.googleusercontent.com`, `k.kakaocdn.net`) 설정
- [ ] `app/layout.tsx`에 `lang="ko"` 설정
- [ ] `.env.local`에 Supabase 환경변수 플레이스홀더 존재

### 6. 통합 검증
- [ ] 선행 Task 없음 (독립 Task) — 검증 생략
- [ ] 이후 Task (S1DS1, S1FE1)가 의존할 구조가 올바르게 준비됨
- [ ] 프로젝트 루트에 불필요한 중복 파일 없음

### 7. 저장 위치 검증
- [ ] 설정 문서가 `Process/S1_개발_준비/Backend_Infra/`에 저장됨
- [ ] 실제 Next.js 파일이 프로젝트 루트에 존재

## Test Commands
```bash
# 파일 존재 확인
ls next.config.js tailwind.config.ts tsconfig.json package.json

# 디렉토리 구조 확인
ls app/ components/ lib/ styles/ types/

# 빌드 확인
npm run build

# 린트 확인
npm run lint

# 타입 체크
npx tsc --noEmit

# 패키지 설치 확인
npm list @supabase/supabase-js next-themes clsx tailwind-merge
```

## Expected Results
- `npm run build` 성공 (exit code 0)
- `npm run lint` 경고/에러 0개
- `npx tsc --noEmit` 타입 에러 0개
- 브라우저에서 `localhost:3000` 접속 시 "My Chatbot World" 텍스트 표시

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 린트 에러 0개
- [ ] Tailwind 클래스 브라우저 적용 확인
- [ ] Blocker 없음
