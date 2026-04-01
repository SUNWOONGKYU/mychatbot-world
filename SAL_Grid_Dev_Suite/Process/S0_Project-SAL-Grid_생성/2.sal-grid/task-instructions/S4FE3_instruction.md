# Task Instruction - S4FE3

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S4** = 개발 3차 (Advanced Development)

### Area 명칭
- **FE** = Frontend (프론트엔드)

---

# Task Instruction - S4FE3

## Task ID
S4FE3

## Task Name
Marketplace 페이지 React 전환

## Task Goal
기존 Marketplace 페이지를 Next.js App Router 기반 React 컴포넌트로 전환한다. 마켓플레이스 목록, 상세, 업로드 페이지를 구현하며 S4BA4 API와 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기반 레이아웃/공통 컴포넌트
- S4BA4 — Marketplace API

## Specific Instructions

### 1. 마켓플레이스 목록 페이지 (`app/marketplace/page.tsx`)
- 페르소나 카드 그리드 레이아웃 (3열, 반응형)
- 카드 구성: 아바타, 이름, 한 줄 소개, 구독자 수, 구독 가격, 별점
- 검색 입력창 (실시간 필터 또는 서버 사이드 검색)
- 카테고리 필터 탭 (전체/창작/비즈니스/라이프스타일/기타)
- 정렬 드롭다운 (인기순/최신순/가격순)
- 무한 스크롤 또는 페이지네이션
- `GET /api/marketplace` 연동

### 2. 마켓플레이스 상세 페이지 (`app/marketplace/[id]/page.tsx`)
- 헤더: 아바타(대형), 이름, 크리에이터 이름, 카테고리 뱃지
- 소개 섹션: 긴 설명, 태그 목록
- 구독 플랜 카드 (Basic/Premium, 가격, 포함 기능)
- 구독하기 버튼 (비로그인 시 로그인 유도)
- 리뷰 섹션 (별점 분포, 리뷰 목록)
- 관련 페르소나 추천 (하단)
- `GET /api/marketplace/:id` 연동

### 3. 마켓플레이스 업로드 페이지 (`app/marketplace/upload/page.tsx`)
- 페르소나 선택 드롭다운 (내 페르소나 목록)
- 마켓플레이스 공개 설정 폼
  - 카테고리 선택
  - 한 줄 소개 (최대 100자)
  - 상세 설명 (마크다운 에디터 또는 textarea)
  - 태그 입력 (최대 5개)
  - 구독 가격 설정 (무료/유료)
- 미리보기 패널 (입력값 실시간 반영)
- 게시하기 버튼 + 저장하기 버튼
- `POST /api/marketplace` 연동

### 4. 파일 상단 Task ID 주석 필수
```typescript
/**
 * @task S4FE3
 * @description Marketplace 페이지 — 목록, 상세, 업로드
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Frontend/app/marketplace/page.tsx`
- `Process/S4_개발_마무리/Frontend/app/marketplace/[id]/page.tsx`
- `Process/S4_개발_마무리/Frontend/app/marketplace/upload/page.tsx`

## Completion Criteria
- [ ] 마켓플레이스 목록이 카드 그리드로 표시된다
- [ ] 카테고리 필터가 동작한다
- [ ] 검색이 동작한다
- [ ] 상세 페이지에서 구독 플랜이 표시된다
- [ ] 업로드 폼에서 미리보기가 실시간으로 반영된다
- [ ] TypeScript 타입 오류 없음
- [ ] 모바일 반응형 레이아웃 적용

## Tech Stack
- TypeScript, Next.js App Router, React
- Tailwind CSS
- shadcn/ui 또는 동등한 UI 라이브러리

## Tools
- npm (빌드/타입 검사)

## Execution Type
AI-Only

## Remarks
- 상세 페이지는 SEO를 위해 서버 컴포넌트(SSR) 사용 권장
- 목록 페이지는 클라이언트 필터링 우선, 검색은 서버 API 호출
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4FE3 → `Process/S4_개발_마무리/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `pages/`

---

## 📝 파일 명명 규칙
- Next.js App Router 규칙 준수: `page.tsx`
- 파일 상단 `@task S4FE3` 주석 필수
