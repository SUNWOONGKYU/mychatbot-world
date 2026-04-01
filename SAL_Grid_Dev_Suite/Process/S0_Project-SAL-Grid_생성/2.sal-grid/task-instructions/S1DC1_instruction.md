# Task Instruction - S1DC1

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

## Task ID
S1DC1

## Task Name
API 문서 초안 (소급)

## Task Goal
My Chatbot World 서비스의 API 엔드포인트 목록과 OpenAPI 스펙 초안이 작성된 상태를 문서화한다. 이 Task는 이미 구현 완료되어 소급 등록된 항목이다. `docs/api/README.md`와 `docs/api/openapi-template.yaml`을 확인한다.

## Prerequisites (Dependencies)
- S1BI2 (Supabase 클라이언트 + 환경변수 설정) — 소급 완료된 상태

## Specific Instructions

### 1. 기존 구현 내용 확인 (소급)
아래 파일들이 실제로 존재하는지 확인한다:

```
docs/api/README.md                ← API 엔드포인트 목록 및 설명
docs/api/openapi-template.yaml   ← OpenAPI 3.0 스펙 초안
```

### 2. docs/api/README.md 내용 구조

```markdown
# My Chatbot World API 문서

## 버전
- API Version: 1.0.0
- 최종 업데이트: 2026-03-31

## 기본 정보
- Base URL: `https://[your-domain].vercel.app/api`
- 인증: Supabase JWT (Bearer Token)
- 응답 형식: JSON

## 엔드포인트 목록

### 챗봇 관리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /bots | 내 봇 목록 조회 |
| POST | /bots | 새 봇 생성 |
| GET | /bots/:id | 봇 상세 조회 |
| PUT | /bots/:id | 봇 수정 |
| DELETE | /bots/:id | 봇 삭제 |

### 대화 처리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /chat | 메시지 전송 및 AI 응답 |
| GET | /chat/history | 대화 내역 조회 |

### 외부 연동
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /telegram | Telegram 웹훅 |

### 크레딧/결제
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /credits | 크레딧 잔액 조회 |
| POST | /payments/toss | 토스페이먼츠 결제 |

## 인증 방법
...
```

### 3. docs/api/openapi-template.yaml 내용 구조

```yaml
# @task S1DC1
openapi: 3.0.3
info:
  title: My Chatbot World API
  description: AI 챗봇 빌더 플랫폼 REST API
  version: 1.0.0
  contact:
    name: MCW Support

servers:
  - url: https://{domain}/api
    variables:
      domain:
        default: your-domain.vercel.app

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Bot:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string

paths:
  /bots:
    get:
      summary: 봇 목록 조회
      tags: [Bots]
      responses:
        '200':
          description: 봇 목록
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Bot'
        '401':
          description: 인증 실패
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /chat:
    post:
      summary: 메시지 전송 및 AI 응답
      tags: [Chat]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [bot_id, message]
              properties:
                bot_id:
                  type: string
                  format: uuid
                message:
                  type: string
                session_id:
                  type: string
      responses:
        '200':
          description: AI 응답
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                  tokens_used:
                    type: integer
```

### 4. 저장 위치
- `docs/api/README.md` → 프로젝트 루트 `docs/api/`
- `docs/api/openapi-template.yaml` → 프로젝트 루트 `docs/api/`
- 원본 문서: `Process/S1_개발_준비/Documentation/`

## Expected Output Files
- `docs/api/README.md` (기존 파일 확인)
- `docs/api/openapi-template.yaml` (기존 파일 확인)

## Completion Criteria
- [ ] `docs/api/README.md` 존재 및 API 엔드포인트 목록 포함
- [ ] `docs/api/openapi-template.yaml` 존재 및 유효한 YAML 형식
- [ ] OpenAPI 스펙에 `Bot` 스키마 정의됨
- [ ] 인증 방식 (Bearer JWT) 문서화됨
- [ ] 주요 엔드포인트 (`/bots`, `/chat`, `/telegram`) 명세 포함

## Tech Stack
- Markdown
- OpenAPI 3.0 (YAML)

## Tools
- documentation-writer-core

## Execution Type
AI-Only

## Remarks
- 이 Task는 소급(Retroactive) 등록 항목 — 이미 구현 완료
- OpenAPI 스펙은 초안으로, 실제 구현에 따라 S4DC에서 갱신 예정
- Swagger UI 연동은 향후 선택적으로 추가
- API 버전 관리는 URL 경로 기반 (`/api/v1/` 등) 고려 — 현재는 버전 없음

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1DC1 → `Process/S1_개발_준비/Documentation/`

### 제2 규칙: Production 코드는 이중 저장
- DC Area는 Production 저장 대상 아님
- 문서는 `docs/` 폴더에만 존재 (배포 불필요)
