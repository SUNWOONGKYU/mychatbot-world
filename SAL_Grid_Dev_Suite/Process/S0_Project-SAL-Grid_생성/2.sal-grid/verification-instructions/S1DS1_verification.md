# Verification Instruction - S1DS1

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
S1DS1

## Task Name
디자인 시스템 구축 (Light/Dark/System 3모드)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `styles/globals.css` 존재 및 CSS 변수 포함
- [ ] `tailwind.config.ts` 업데이트 (커스텀 컬러 토큰 추가됨)
- [ ] `lib/theme-provider.tsx` 존재
- [ ] `components/ui/theme-toggle.tsx` 존재
- [ ] `app/layout.tsx`에 `ThemeProvider` 래핑 및 `suppressHydrationWarning` 포함

### 2. CSS 변수 검증
- [ ] `:root`에 Light 모드 변수 정의됨 (`--color-bg-base`, `--color-text-primary` 등)
- [ ] `.dark`에 Dark 모드 변수 정의됨 (Slate 계열)
- [ ] `--color-primary: 99 102 241` (Indigo-500) 정의됨
- [ ] `--sidebar-width`, `--header-height` 변수 정의됨

### 3. Tailwind 토큰 검증
- [ ] `bg-primary` 클래스가 `#6366f1`을 렌더링
- [ ] `bg-bg-base` 클래스가 Light: white, Dark: slate-900 렌더링
- [ ] `text-text-primary` 클래스가 Light: gray-900, Dark: slate-50 렌더링
- [ ] `rgb(var(--color-*) / <alpha-value>)` 패턴으로 opacity 지원

### 4. 테마 전환 기능 검증
- [ ] Light 모드 전환 시 `<html>` 클래스에서 `dark` 제거됨
- [ ] Dark 모드 전환 시 `<html class="dark">` 설정됨
- [ ] System 모드: OS 다크 모드 설정에 따라 자동 전환
- [ ] `ThemeToggle` 버튼 3개 모두 클릭 시 정상 전환
- [ ] 페이지 새로고침 후에도 선택한 모드 유지 (localStorage)

### 5. 시각적 검증
- [ ] Light 모드: 흰 배경 (#ffffff), 어두운 텍스트
- [ ] Dark 모드: Slate-900 배경 (#0f172a), 밝은 텍스트
- [ ] 테마 전환 시 깜박임(flash) 없음 (`disableTransitionOnChange: true`)
- [ ] Hydration 오류 없음 (브라우저 콘솔 확인)

### 6. 통합 검증
- [ ] S1BI1의 `darkMode: 'class'` 설정과 정상 연동
- [ ] `ThemeProvider`가 `app/layout.tsx`에 올바르게 적용됨
- [ ] `npm run build` 통과 (테마 관련 빌드 에러 없음)
- [ ] TypeScript 타입 에러 없음

### 7. 저장 위치 검증
- [ ] `Process/S1_개발_준비/Design/`에 디자인 시스템 문서 저장됨

## Test Commands
```bash
# 타입 체크
npx tsc --noEmit

# 빌드 확인
npm run build

# CSS 변수 존재 확인
grep -n "color-primary" styles/globals.css
grep -n "darkMode" tailwind.config.ts

# ThemeProvider 적용 확인
grep -n "ThemeProvider\|suppressHydrationWarning" app/layout.tsx

# 파일 존재 확인
ls lib/theme-provider.tsx components/ui/theme-toggle.tsx
```

## Expected Results
- `npm run build` 성공
- `npx tsc --noEmit` 에러 0개
- `styles/globals.css`에 `:root` 및 `.dark` CSS 변수 블록 존재
- `tailwind.config.ts`에 `primary`, `bg`, `text`, `surface`, `border` 커스텀 컬러 존재
- 브라우저 콘솔에 Hydration 오류 없음

## Verification Agent
qa-specialist

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 3가지 테마 모드(Light/Dark/System) 전환 정상 동작
- [ ] 빌드 에러 없음
- [ ] Hydration 오류 없음
- [ ] Blocker 없음
