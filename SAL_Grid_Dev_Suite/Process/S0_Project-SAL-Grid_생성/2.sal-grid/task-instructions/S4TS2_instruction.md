# Task Instruction - S4TS2

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
- **TS** = Testing (테스트)

---

# Task Instruction - S4TS2

## Task ID
S4TS2

## Task Name
API 단위 테스트 확장

## Task Goal
Vitest 기반으로 S4에서 신규 구현된 수익/결제/피상속 API에 대한 단위 테스트를 작성한다. 모킹 전략을 정의하고 핵심 비즈니스 로직(수수료 계산, 잔액 검증, 동의 처리 등)을 검증한다.

## Prerequisites (Dependencies)
- S4BA1 — 수익 API
- S4BA2 — 결제 시스템 API
- S4BA3 — 피상속 API

## Specific Instructions

### 1. 수익 API 단위 테스트 (`tests/unit/revenue.test.ts`)
- `calculateFee(gross)` 함수 테스트
  - 수수료 20% 계산 정확성
  - 소수점 처리 (버림 또는 반올림 일관성)
  - 0원 입력 시 0 반환
- 매출 조회 API 핸들러 테스트 (Supabase 모킹)
  - 날짜 범위 필터 적용 확인
  - 빈 결과 반환 케이스
  - 비인증 요청 시 401 반환
- 정산 생성 API 핸들러 테스트
  - 최소 금액(10,000원) 미만 시 400 반환
  - 정상 요청 시 201 반환

### 2. 결제 API 단위 테스트 (`tests/unit/payment.test.ts`)
- `calculateApiCost(provider, tokens)` 함수 테스트
  - 마진 30% 적용 정확성
  - provider별 단가 차이 반영 확인
- 크레딧 차감 핸들러 테스트
  - 잔액 부족 시 402 반환
  - 정상 차감 후 잔액 업데이트 확인
- 결제수단 등록 테스트
  - 카드 번호 마스킹 처리 확인
  - 마스킹 후 원본이 응답에 포함되지 않는지 확인

### 3. 피상속 API 단위 테스트 (`tests/unit/inheritance.test.ts`)
- 피상속인 지정 핸들러 테스트
  - 유효한 이메일 형식 검증
  - 중복 지정 시 기존 레코드 대체 확인
- 동의 처리 핸들러 테스트
  - 수락 시 상태 `accepted` 업데이트
  - 거부 시 상태 `declined` 업데이트
  - 이미 처리된 요청 재처리 시 409 반환
- 권한 검증: 본인이 아닌 요청 시 403 반환

### 4. 모킹 전략
- Supabase 클라이언트: `vi.mock('@/lib/supabase')` 전역 모킹
- 인증 미들웨어: `vi.mock('@/lib/auth')` — `getSession` 반환값 조작
- 각 테스트 파일 상단에 모킹 설정 명시

### 5. 테스트 실행 스크립트 (`package.json` 추가)
```json
"test:unit": "vitest run tests/unit",
"test:unit:watch": "vitest tests/unit"
```

## Expected Output Files
- `Process/S4_개발_마무리/Testing/tests/unit/revenue.test.ts`
- `Process/S4_개발_마무리/Testing/tests/unit/payment.test.ts`
- `Process/S4_개발_마무리/Testing/tests/unit/inheritance.test.ts`

## Completion Criteria
- [ ] 수익 API 테스트 케이스가 모두 통과한다 (최소 8개)
- [ ] 결제 API 테스트 케이스가 모두 통과한다 (최소 6개)
- [ ] 피상속 API 테스트 케이스가 모두 통과한다 (최소 6개)
- [ ] `calculateFee` 수수료 20% 계산이 검증된다
- [ ] `calculateApiCost` 마진 30% 계산이 검증된다
- [ ] 카드 번호 마스킹이 검증된다
- [ ] `npx vitest run tests/unit` 으로 모든 테스트가 통과한다

## Tech Stack
- TypeScript, Vitest
- Next.js Route Handlers (테스트 대상)

## Tools
- npm (`vitest` 설치 확인)

## Execution Type
AI-Only

## Remarks
- Vitest가 미설치된 경우 `npm install -D vitest` 실행
- Supabase 실제 연결 없이 Mock으로만 테스트 (환경 독립성 유지)
- TS 파일은 Testing Area이므로 Production 자동 복사 대상 아님

---

## ⚠️ 작업 결과물 저장 규칙

### Stage + Area 폴더에 저장
- S4TS2 → `Process/S4_개발_마무리/Testing/`
- Testing Area는 Production 자동 복사 대상 아님

---

## 📝 파일 명명 규칙
- 단위 테스트 파일: `{대상}.test.ts`
