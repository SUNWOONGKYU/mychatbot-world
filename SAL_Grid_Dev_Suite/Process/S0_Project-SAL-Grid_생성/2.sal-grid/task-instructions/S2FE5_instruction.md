# Task Instruction - S2FE5

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

# Task Instruction - S2FE5

## Task ID
S2FE5

## Task Name
Birth 페이지 React 전환

## Task Goal
챗봇 생성 완료 후 표시되는 탄생 애니메이션 페이지를 React(Next.js App Router) 컴포넌트로 전환한다. 생성된 챗봇 정보와 QR코드를 표시하고 공유/이동 기능을 제공한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기본 설정
- S2BA4 — 챗봇 생성 API (소급, deployUrl/qrUrl 제공)

## Specific Instructions

### 1. Birth 페이지 (app/birth/page.tsx)
- URL 파라미터: `?botId={id}` 수신
- botId로 챗봇 정보(이름, deployUrl, qrUrl) API 조회
- BirthAnimation 컴포넌트 렌더링
- 조회 실패 시 `/home`으로 리다이렉트

### 2. 탄생 애니메이션 컴포넌트 (components/birth/animation.tsx)
- 순서형 등장 애니메이션 (CSS keyframes 또는 Tailwind animate):
  1. 챗봇 아이콘/이름 fade-in
  2. "탄생했습니다!" 텍스트 등장
  3. 배포 URL 표시 (클릭 시 복사)
  4. QR코드 이미지 표시 (`<img>` 태그, qrUrl)
- 공유 버튼: 모바일 Web Share API → fallback 클립보드 복사
- "대화 시작하기" 버튼 → `/bot?botId={id}`
- "홈으로" 버튼 → `/home`

### 3. 파일 상단 Task ID 주석
```tsx
/**
 * @task S2FE5
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Frontend/app/birth/page.tsx`
- `Process/S2_개발-1차/Frontend/components/birth/animation.tsx`

## Completion Criteria
- [ ] botId 기반으로 챗봇 정보가 API에서 로딩된다
- [ ] 순서형 등장 애니메이션이 동작한다
- [ ] 배포 URL 클릭 시 클립보드 복사된다
- [ ] QR코드 이미지가 표시된다
- [ ] "대화 시작하기" 버튼이 `/bot` 페이지로 이동한다
- [ ] TypeScript 오류 없음

## Tech Stack
- TypeScript, React, Next.js (App Router)
- Tailwind CSS (애니메이션)
- Web Share API (공유)

## Tools
- npm

## Execution Type
AI-Only

## Remarks
- QR 이미지는 qrUrl을 `<img src>` 로 표시 (별도 생성 불필요)
- 애니메이션은 CSS keyframes로 구현, 라이브러리 의존 최소화
- 모바일 최적화 필수 (챗봇 공유가 주 사용 시나리오)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2FE5 → `Process/S2_개발-1차/Frontend/`
