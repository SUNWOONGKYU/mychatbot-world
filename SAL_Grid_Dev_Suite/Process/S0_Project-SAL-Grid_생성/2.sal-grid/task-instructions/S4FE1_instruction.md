# Task Instruction - S4FE1

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

# Task Instruction - S4FE1

## Task ID
S4FE1

## Task Name
Business(수익 대시보드) 페이지 React 전환

## Task Goal
기존 Business 페이지를 Next.js App Router 기반 React 컴포넌트로 전환한다. 수익 대시보드, 정산 내역, 매출 차트, 결제수단 관리 화면을 구현하며 S4BA1 API와 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기반 레이아웃/공통 컴포넌트
- S4BA1 — 수익 API (매출·정산 조회)

## Specific Instructions

### 1. 수익 대시보드 페이지 (`app/business/page.tsx`)
- 이번 달 매출 카드 (금액 + 전월 대비 증감률)
- 보류 중인 정산 금액 카드
- 매출 추이 차트 (최근 30일, Line 또는 Bar 차트)
- 상위 수익 페르소나 Top 5 목록
- `GET /api/revenue/dashboard` API 연동
- 로딩 스켈레톤 UI 적용

### 2. 정산 내역 페이지 (`app/business/settlement/page.tsx`)
- 정산 내역 테이블 (기간, 총 매출, 수수료, 정산액, 상태)
- 상태별 뱃지: pending(회색), processing(파랑), completed(초록), failed(빨강)
- 정산 요청 버튼 (최소 금액 미충족 시 비활성화)
- 정산 주기 설정 드롭다운 (주간/격주/월간)
- `GET /api/revenue/settlement` + `POST /api/revenue/settlement` 연동

### 3. 매출 상세 페이지 (`app/business/revenue/page.tsx`)
- 날짜 범위 필터 (DatePicker)
- 수익 소스별 필터 (구독/팁/마켓플레이스)
- 매출 상세 테이블 (날짜, 금액, 소스, 페르소나)
- CSV 내보내기 버튼
- `GET /api/revenue` API 연동

### 4. 결제수단 관리 섹션
- 등록된 결제수단 카드 목록 (마스킹된 카드 번호)
- 결제수단 추가 모달
- 기본 결제수단 설정 토글
- `GET/POST/DELETE /api/payment/method` 연동

### 5. 파일 상단 Task ID 주석 필수
```typescript
/**
 * @task S4FE1
 * @description Business 페이지 — 수익 대시보드, 정산, 결제수단 관리
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Frontend/app/business/page.tsx`
- `Process/S4_개발_마무리/Frontend/app/business/settlement/page.tsx`
- `Process/S4_개발_마무리/Frontend/app/business/revenue/page.tsx`

## Completion Criteria
- [ ] 수익 대시보드 페이지가 `/api/revenue/dashboard` 데이터를 표시한다
- [ ] 매출 차트가 렌더링된다
- [ ] 정산 내역 테이블이 상태 뱃지와 함께 표시된다
- [ ] 정산 요청 버튼이 최소 금액 조건에 따라 활성화/비활성화된다
- [ ] 날짜 범위 필터가 동작한다
- [ ] 로딩 스켈레톤이 데이터 로딩 중 표시된다
- [ ] TypeScript 타입 오류 없음
- [ ] 모바일 반응형 레이아웃 적용

## Tech Stack
- TypeScript, Next.js App Router, React
- Tailwind CSS
- shadcn/ui 또는 동등한 UI 라이브러리
- Recharts 또는 Chart.js (매출 차트)

## Tools
- npm (빌드/타입 검사)

## Execution Type
AI-Only

## Remarks
- 실제 데이터가 없을 때 빈 상태(Empty State) UI 필수
- 차트 라이브러리는 프로젝트 기존 설치 라이브러리 우선 사용
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4FE1 → `Process/S4_개발_마무리/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `pages/`

---

## 📝 파일 명명 규칙
- Next.js App Router 규칙 준수: `page.tsx`
- 파일 상단 `@task S4FE1` 주석 필수
