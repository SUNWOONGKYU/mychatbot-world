# Verification Instruction - S1FE1

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
S1FE1

## Task Name
공통 레이아웃 + 사이드바 컴포넌트 (React)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `app/layout.tsx` 존재 및 Sidebar, Header, ThemeProvider 포함
- [ ] `components/common/sidebar.tsx` 존재
- [ ] `components/common/header.tsx` 존재
- [ ] `components/common/mobile-nav.tsx` 존재

### 2. 사이드바 메뉴 검증 (12개 항목)
- [ ] 대시보드 (`/dashboard`) 메뉴 존재
- [ ] 챗봇 관리 (`/bots`) 메뉴 존재
- [ ] 봇 만들기 (`/bots/new`) 메뉴 존재
- [ ] 대화 내역 (`/conversations`) 메뉴 존재
- [ ] 지식 베이스 (`/knowledge`) 메뉴 존재
- [ ] 페르소나 (`/personas`) 메뉴 존재
- [ ] 템플릿 (`/templates`) 메뉴 존재
- [ ] 연동 설정 (`/integrations`) 메뉴 존재
- [ ] 분석 (`/analytics`) 메뉴 존재
- [ ] 크레딧 (`/credits`) 메뉴 존재
- [ ] 설정 (`/settings`) 메뉴 존재
- [ ] 도움말 (`/help`) 메뉴 존재

### 3. 기능 검증
- [ ] 현재 경로에 해당하는 메뉴 항목이 활성화 스타일로 표시됨
- [ ] 사이드바 링크 클릭 시 해당 페이지로 이동
- [ ] 헤더에 ThemeToggle 컴포넌트 표시
- [ ] 모바일 (뷰포트 768px 미만): 햄버거 버튼 표시, 사이드바 숨김
- [ ] 모바일 햄버거 버튼 클릭 시 드로어 열림
- [ ] 드로어 오버레이 클릭 시 닫힘

### 4. 디자인 토큰 검증
- [ ] Light 모드: 사이드바 bg-surface (흰색), 텍스트 gray 계열
- [ ] Dark 모드: 사이드바 bg-surface (slate-800), 텍스트 slate 계열
- [ ] 활성 메뉴: `bg-primary/10 text-primary` 스타일 적용
- [ ] 호버 스타일: `hover:bg-surface-hover` 적용
- [ ] `--sidebar-width: 256px` CSS 변수 적용

### 5. 반응형 검증
- [ ] 데스크탑 (≥768px): `md:flex` — 사이드바 표시
- [ ] 모바일 (<768px): `hidden md:flex` — 사이드바 숨김
- [ ] 모바일 햄버거 버튼: `md:hidden` — 모바일에서만 표시
- [ ] 레이아웃이 `h-screen overflow-hidden` 으로 스크롤 컨테이너 관리

### 6. 코드 품질 검증
- [ ] `@task S1FE1` 주석이 각 파일 상단에 포함
- [ ] `'use client'` 지시어가 클라이언트 컴포넌트에 포함
- [ ] TypeScript 타입 에러 없음
- [ ] ESLint 에러 없음

### 7. 빌드 검증
- [ ] `npm run build` 에러 없이 완료
- [ ] `npm run lint` 에러 0개

### 8. 통합 검증
- [ ] S1DS1의 CSS 변수 (`bg-bg-base`, `text-text-primary` 등)가 올바르게 사용됨
- [ ] S1DS1의 `ThemeToggle`이 Header에 정상 임포트됨
- [ ] S1BI1의 Next.js App Router 구조와 일치

### 9. 저장 위치 검증
- [ ] `Process/S1_개발_준비/Frontend/`에 컴포넌트 원본 저장됨

## Test Commands
```bash
# 파일 존재 확인
ls components/common/sidebar.tsx components/common/header.tsx components/common/mobile-nav.tsx

# 12개 메뉴 항목 확인
grep -c "href:" components/common/sidebar.tsx

# 타입 체크
npx tsc --noEmit

# 빌드 확인
npm run build

# 린트 확인
npm run lint
```

## Expected Results
- `components/common/` 폴더에 3개 파일 존재
- `grep -c "href:"` 출력: 12 이상
- `npm run build` 성공
- `npx tsc --noEmit` 에러 0개
- 브라우저에서 사이드바 12개 메뉴 모두 표시 확인

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 12개 메뉴 사이드바 확인
- [ ] 반응형 (모바일/데스크탑) 정상 동작
- [ ] Light/Dark 모드 스타일 정상 적용
- [ ] Blocker 없음
