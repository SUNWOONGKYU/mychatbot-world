# Task Instruction - S2M1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S2M1

## Task Name
API 문서 v1

## Task Goal
Serverless API 명세서 작성 (인증/구독 API)

## Prerequisites (Dependencies)
- S2BA1 (Google OAuth Serverless API) 완료
- S2BA2 (이메일 발송 API) 완료
- S2BA3 (구독 관리 API) 완료

## Specific Instructions

### 1. 문서 위치
- `docs/API_DOCUMENTATION_V1.md`

### 2. 문서 구조
```markdown
# SSALWorks API Documentation v1.0

## Base URL
- Production: https://ssalworks.vercel.app/api
- Development: http://localhost:3000/api

## Authentication
- Bearer Token (Supabase JWT)

## Endpoints

### Auth
- POST /api/auth/google
- GET /api/auth/google/callback
- POST /api/auth/logout

### Email
- POST /api/email/password-reset
- POST /api/email/welcome

### Subscription
- GET /api/subscription/status
- POST /api/subscription/create
- POST /api/subscription/cancel
```

### 3. 각 엔드포인트 문서화 항목
- Method & URL
- Description
- Request Headers
- Request Body (JSON schema)
- Response (성공/실패)
- Error Codes
- Example (curl)

### 4. 에러 코드 표준화
```json
{
  "error": {
    "code": "AUTH_001",
    "message": "Invalid token",
    "details": "..."
  }
}
```

## Expected Output Files
- `docs/API_DOCUMENTATION_V1.md`

## Completion Criteria
- [ ] 모든 인증 API 문서화
- [ ] 모든 이메일 API 문서화
- [ ] 모든 구독 API 문서화
- [ ] 에러 코드 표준화
- [ ] curl 예제 포함
- [ ] Markdown 형식 검증

## Tech Stack
- Markdown
- REST API

## Task Agent
`documentation-specialist`

## Verification Agent
`code-reviewer`

## Tools
- Read, Write
- Grep (API 코드 검색)

## Execution Type
AI-Only

## Remarks
- S3, S4에서 추가 API 작성 시 v2로 업데이트 예정
- OpenAPI/Swagger 형식 전환은 추후 고려

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content

