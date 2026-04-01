# Task Instruction - S4BA1

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
- **BA** = Backend APIs (백엔드 API)

---

# Task Instruction - S4BA1

## Task ID
S4BA1

## Task Name
수익 API (매출·정산 조회)

## Task Goal
크리에이터가 페르소나 운영으로 발생시킨 매출 조회, 정산 내역 조회, 정산 주기 설정, 수수료 계산(플랫폼 20%), 그리고 Business 대시보드용 집계 데이터를 제공하는 RESTful API를 구현한다.

## Prerequisites (Dependencies)
- S3BA3 — 구독/결제 연동 API
- S3SC1 — 인증/인가 미들웨어 확장

## Specific Instructions

### 1. 매출 조회 API (`app/api/revenue/route.ts`)
- `GET /api/revenue` — 로그인 크리에이터의 누적 매출 반환
  - 쿼리 파라미터: `from`, `to` (ISO 날짜), `period` (daily/weekly/monthly)
  - 응답: `{ total, breakdown: [{date, amount, source}] }`
- 수익 소스 분류: `subscription` (구독), `tip` (팁), `marketplace` (마켓플레이스)
- 인증 미들웨어 적용 (비인증 시 401)

### 2. 정산 내역 조회 API (`app/api/revenue/settlement/route.ts`)
- `GET /api/revenue/settlement` — 정산 내역 목록
  - 응답: `{ items: [{period, grossAmount, fee, netAmount, status, paidAt}] }`
- `POST /api/revenue/settlement` — 정산 요청 생성
  - 요청 바디: `{ period, bankInfo }`
  - 최소 정산 금액 검증 (10,000원 이상)
- 정산 상태: `pending`, `processing`, `completed`, `failed`

### 3. 수수료 계산 로직
- 플랫폼 수수료율 20% 고정
- `grossAmount * 0.8 = netAmount` 계산
- 수수료 계산 유틸 함수 `calculateFee(gross: number)` 구현

### 4. 정산 주기 설정 API
- `PATCH /api/revenue/settlement` — 정산 주기 업데이트
  - 요청 바디: `{ cycle: 'weekly' | 'biweekly' | 'monthly' }`

### 5. 대시보드 데이터 API (`app/api/revenue/dashboard/route.ts`)
- `GET /api/revenue/dashboard` — 통합 대시보드 데이터
  - 응답: `{ totalRevenue, monthlyRevenue, pendingSettlement, revenueChart: [], topPersonas: [] }`
- 이번 달 매출, 지난달 대비 증감률 계산 포함

### 6. 파일 상단 Task ID 주석 필수
```typescript
/**
 * @task S4BA1
 * @description 수익 API — 매출 조회, 정산, 수수료 계산, 대시보드
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Backend_APIs/app/api/revenue/route.ts`
- `Process/S4_개발_마무리/Backend_APIs/app/api/revenue/settlement/route.ts`
- `Process/S4_개발_마무리/Backend_APIs/app/api/revenue/dashboard/route.ts`

## Completion Criteria
- [ ] `GET /api/revenue` 가 날짜 범위 필터를 적용하여 매출 데이터를 반환한다
- [ ] `GET /api/revenue/settlement` 가 정산 내역을 반환한다
- [ ] `POST /api/revenue/settlement` 가 최소 금액 검증 후 정산 요청을 생성한다
- [ ] 수수료 20% 계산 로직이 올바르게 동작한다
- [ ] `GET /api/revenue/dashboard` 가 통합 집계 데이터를 반환한다
- [ ] 비인증 요청 시 401을 반환한다
- [ ] TypeScript 타입 오류 없음

## Tech Stack
- TypeScript, Next.js App Router
- Supabase (PostgreSQL)
- Next.js Route Handlers

## Tools
- npm (빌드/타입 검사)
- supabase (MCP 서버, DB 조회)

## Execution Type
AI-Only

## Remarks
- 수수료율(20%)은 환경 변수 `PLATFORM_FEE_RATE`로 관리 권장
- 정산 내역은 `settlements` 테이블 참조
- 매출 데이터는 `transactions` 테이블 참조
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4BA1 → `Process/S4_개발_마무리/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- Next.js App Router 규칙 준수: `route.ts`
- 파일 상단 `@task S4BA1` 주석 필수
