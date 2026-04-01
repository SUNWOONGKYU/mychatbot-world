# Task Instruction - S4BA2

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

# Task Instruction - S4BA2

## Task ID
S4BA2

## Task Name
결제 시스템 (결제수단 관리, 크레딧)

## Task Goal
크리에이터 및 사용자의 크레딧 충전/사용/잔액 조회 API, 결제수단 등록 및 관리 API, 결제 이력 조회, 그리고 API 사용료 과금(마진 30%) 처리 로직을 구현한다.

## Prerequisites (Dependencies)
- S1DB2 — 사용자/결제 관련 DB 스키마
- S3SC1 — 인증/인가 미들웨어 확장

## Specific Instructions

### 1. 크레딧 API (`app/api/payment/credit/route.ts`)
- `GET /api/payment/credit` — 현재 크레딧 잔액 조회
  - 응답: `{ balance, currency: 'KRW', updatedAt }`
- `POST /api/payment/credit` — 크레딧 충전
  - 요청 바디: `{ amount, paymentMethodId }`
  - 충전 단위: 1,000원 / 5,000원 / 10,000원 / 50,000원
  - 충전 내역 `credit_transactions` 테이블에 기록
- `DELETE /api/payment/credit` — 크레딧 차감 (내부 API)
  - 요청 바디: `{ amount, reason }`
  - 잔액 부족 시 402 반환

### 2. 결제수단 API (`app/api/payment/method/route.ts`)
- `GET /api/payment/method` — 등록된 결제수단 목록
- `POST /api/payment/method` — 결제수단 등록
  - 요청 바디: `{ type: 'card' | 'bank', token, alias }`
  - 카드 번호 마스킹 처리 (끝 4자리만 저장)
- `DELETE /api/payment/method/:id` — 결제수단 삭제
  - 기본 결제수단은 삭제 불가 (400 반환)

### 3. 결제 이력 API (`app/api/payment/route.ts`)
- `GET /api/payment` — 결제 이력 목록
  - 쿼리 파라미터: `page`, `limit`, `type` (charge/usage/refund)
  - 응답: `{ items: [{id, type, amount, description, createdAt}], pagination }`

### 4. API 사용료 과금 로직
- AI API 호출 시 실제 비용의 1.3배(마진 30%)로 크레딧 차감
- `calculateApiCost(provider: string, tokens: number): number` 유틸 함수 구현
- 크레딧 부족 시 API 호출 차단 및 402 응답

### 5. 파일 상단 Task ID 주석 필수
```typescript
/**
 * @task S4BA2
 * @description 결제 시스템 — 크레딧 충전/사용, 결제수단 관리, 과금 처리
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Backend_APIs/app/api/payment/route.ts`
- `Process/S4_개발_마무리/Backend_APIs/app/api/payment/credit/route.ts`
- `Process/S4_개발_마무리/Backend_APIs/app/api/payment/method/route.ts`

## Completion Criteria
- [ ] `GET /api/payment/credit` 가 현재 잔액을 반환한다
- [ ] `POST /api/payment/credit` 가 크레딧을 충전하고 이력을 기록한다
- [ ] 잔액 부족 시 402를 반환한다
- [ ] `POST /api/payment/method` 가 카드 번호를 마스킹하여 저장한다
- [ ] `GET /api/payment` 가 페이지네이션이 적용된 이력을 반환한다
- [ ] `calculateApiCost` 함수가 30% 마진을 적용한다
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
- 실제 PG(결제 게이트웨이) 연동은 이 Task 범위 외 (토큰 기반 처리로 추상화)
- 카드 번호 원본은 절대 DB에 저장하지 않음
- 크레딧 단위: 1 크레딧 = 1원 기준
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4BA2 → `Process/S4_개발_마무리/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- Next.js App Router 규칙 준수: `route.ts`
- 파일 상단 `@task S4BA2` 주석 필수
