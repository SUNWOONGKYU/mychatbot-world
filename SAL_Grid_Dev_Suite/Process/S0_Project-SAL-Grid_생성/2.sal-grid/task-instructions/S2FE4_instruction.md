# Task Instruction - S2FE4

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

- **S2** = 개발 1차 (Core Development)
- **FE** = Frontend (프론트엔드)

---

# Task Instruction - S2FE4

## Task ID
S2FE4

## Task Name
Landing 페이지 React 전환

## Task Goal
기존 HTML 기반 랜딩 페이지를 Next.js App Router의 루트 페이지(`app/page.tsx`)로 전환한다. 히어로 섹션, 데모 섹션, 가격표를 React 컴포넌트로 구현한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기본 설정
- S1DS1 — 랜딩 페이지 디자인 (Figma 또는 디자인 명세)

## Specific Instructions

### 1. 루트 페이지 (app/page.tsx)
- Next.js App Router 루트 페이지
- Hero, Demo, Pricing 섹션 컴포넌트 조합
- 로그인 상태에 따라 CTA 버튼 변경:
  - 비로그인: "5분 만에 만들어보기" → `/create`
  - 로그인: "내 챗봇 관리" → `/home`

### 2. 히어로 섹션 (components/landing/hero.tsx)
- 메인 카피: "5분 만에 나만의 AI 챗봇"
- 서브 카피, CTA 버튼 2개
- 챗봇 UI 모형 이미지 또는 애니메이션

### 3. 가격표 컴포넌트 (components/landing/pricing.tsx)
- Free / Pro / Enterprise 3단계 플랜
- 각 플랜: 가격, 기능 목록, CTA 버튼
- 가격 데이터는 정적 상수로 정의 (변경 빈도 낮음)
- 인기 플랜 배지 표시

### 4. 데모 섹션
- 챗봇 대화 UI 미리보기 (정적 또는 인터랙티브)
- 감성슬라이더 데모 (실제 API 연동은 선택사항)

### 5. 파일 상단 Task ID 주석
```tsx
/**
 * @task S2FE4
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Frontend/app/page.tsx`
- `Process/S2_개발-1차/Frontend/components/landing/hero.tsx`
- `Process/S2_개발-1차/Frontend/components/landing/pricing.tsx`

## Completion Criteria
- [ ] 루트 경로(`/`)에 랜딩 페이지가 렌더링된다
- [ ] 히어로 섹션 CTA 버튼이 로그인 상태에 따라 다르게 표시된다
- [ ] 가격표 3개 플랜이 정상 표시된다
- [ ] 반응형 디자인 (모바일/태블릿/데스크탑)
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS

## Tools
- npm

## Execution Type
AI-Only

## Remarks
- 가격표는 정적 데이터로 정의해도 무방 (DB 연동 불필요)
- 디자인 명세가 없으면 mychatbot-world 브랜드에 맞는 임의 디자인 적용
- SEO: `metadata` export로 title/description 정의

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2FE4 → `Process/S2_개발-1차/Frontend/`
