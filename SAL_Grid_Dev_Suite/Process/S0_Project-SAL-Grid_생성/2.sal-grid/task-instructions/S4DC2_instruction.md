# Task Instruction - S4DC2

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
- **DC** = Documentation (문서화)

---

# Task Instruction - S4DC2

## Task ID
S4DC2

## Task Name
API 문서 완성

## Task Goal
S4에서 구현된 수익/결제/피상속 API를 포함한 전체 API의 OpenAPI 3.0 스펙을 완성하고, 엔드포인트별 요청/응답 예제, 인증 가이드, 에러 코드표를 작성한다.

## Prerequisites (Dependencies)
- S4BA1 — 수익 API
- S4BA2 — 결제 시스템 API
- S4BA3 — 피상속 API

## Specific Instructions

### 1. OpenAPI 스펙 파일 (`docs/api/openapi.yaml`)
- OpenAPI 3.0.3 형식
- 기본 정보: title, version, description, servers
- 인증 스킴 정의: `BearerAuth` (JWT)
- 다음 API 그룹 스펙 완성:
  - `/api/revenue` — 수익 관련 4개 엔드포인트
  - `/api/payment` — 결제 관련 6개 엔드포인트
  - `/api/inheritance` — 피상속 관련 6개 엔드포인트
  - 기존 API (chat, personas, marketplace) 누락분 보완
- 각 엔드포인트마다:
  - 요청 파라미터 (query, path, body) 스키마 정의
  - 응답 스키마 (200, 400, 401, 403, 404, 500)
  - `example` 필드 포함

### 2. 인증 가이드 (`docs/api/authentication.md`)
- 인증 방식: JWT Bearer Token
- 토큰 발급 방법 (로그인 API → 토큰 수신)
- API 요청 시 헤더 설정 방법
  ```
  Authorization: Bearer {your_token}
  ```
- 토큰 만료 처리 (401 응답 시 재발급)
- Supabase 클라이언트 사용 시 자동 인증 처리 방법
- cURL, JavaScript, Python 예제 코드 포함

### 3. 에러 코드표 (`docs/api/error-codes.md`)
- 표준 HTTP 상태 코드별 의미
- 서비스 공통 에러 코드 (비즈니스 레이어)
  | 에러 코드 | HTTP 상태 | 설명 |
  |-----------|-----------|------|
  | `AUTH_001` | 401 | 인증 토큰 없음 |
  | `AUTH_002` | 401 | 토큰 만료 |
  | `PAY_001` | 402 | 크레딧 잔액 부족 |
  | `PAY_002` | 400 | 최소 정산 금액 미달 |
  | `INH_001` | 409 | 이미 처리된 피상속 요청 |
  | `INH_002` | 403 | 피상속인 권한 없음 |
  - 최소 15개 이상 에러 코드 정의
- 에러 응답 공통 형식 예시:
  ```json
  { "error": { "code": "PAY_001", "message": "크레딧 잔액이 부족합니다.", "details": {} } }
  ```

## Expected Output Files
- `Process/S4_개발_마무리/Documentation/docs/api/openapi.yaml`
- `Process/S4_개발_마무리/Documentation/docs/api/authentication.md`
- `Process/S4_개발_마무리/Documentation/docs/api/error-codes.md`

## Completion Criteria
- [ ] `openapi.yaml` 이 OpenAPI 3.0.3 형식으로 작성되어 있다
- [ ] 수익/결제/피상속 API 스펙이 모두 포함되어 있다
- [ ] 각 엔드포인트에 요청/응답 예제가 있다
- [ ] 인증 가이드에 cURL/JS/Python 코드 예제가 있다
- [ ] 에러 코드표에 15개 이상 에러가 정의되어 있다
- [ ] YAML 문법 오류 없음 (`npx @redocly/cli lint` 통과)

## Tech Stack
- OpenAPI 3.0 (YAML)
- Markdown

## Tools
- npm (`@redocly/cli` lint 검증)

## Execution Type
AI-Only

## Remarks
- OpenAPI 스펙은 Swagger UI 또는 Redoc으로 렌더링 가능해야 함
- `example` 필드는 실제 응답과 일치하는 현실적인 값 사용
- Documentation Area는 Production 자동 복사 대상 아님

---

## ⚠️ 작업 결과물 저장 규칙

### Stage + Area 폴더에 저장
- S4DC2 → `Process/S4_개발_마무리/Documentation/`
- Documentation Area는 Production 자동 복사 대상 아님

---

## 📝 파일 명명 규칙
- kebab-case: `openapi.yaml`, `authentication.md`, `error-codes.md`
