# Task Instruction - S1BI3

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
S1BI3

## Task Name
Vercel 배포 설정 (소급)

## Task Goal
Vercel 배포 설정 및 서버리스 함수 구성이 완료된 상태를 문서화한다. 이 Task는 이미 구현 완료되어 소급 등록된 항목이다. `vercel.json`과 `render.yaml`을 통해 프로젝트 배포 환경이 구성된 것을 확인한다.

## Prerequisites (Dependencies)
- S1BI2 (Supabase 클라이언트 + 환경변수 설정) — 소급 완료된 상태

## Specific Instructions

### 1. 기존 구현 내용 확인 (소급)
아래 파일들이 실제로 존재하는지 확인한다:

```
vercel.json      ← Vercel 배포 설정 (라우팅, 환경변수, 함수 설정)
render.yaml      ← Render.com 대체 배포 설정 (선택적)
```

### 2. vercel.json 전체 구성
```json
{
  "version": 2,
  "framework": "nextjs",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Authorization, Content-Type" }
      ]
    }
  ]
}
```

### 3. render.yaml 구성 (대체 배포용)
```yaml
# @task S1BI3
services:
  - type: web
    name: mychatbot-world
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
```

### 4. Vercel 프로젝트 설정 확인
- Vercel Dashboard에서 프로젝트 연결 확인
- Git 연동 (자동 배포) 설정
- 환경변수 (`@supabase_url` 등 Vercel Secrets) 설정 완료
- 프로덕션/프리뷰 도메인 확인

### 5. 서버리스 함수 구조 확인
Vercel 서버리스 함수가 올바른 위치에 존재하는지 확인:
```
api/
  _shared.js        ← 공유 클라이언트
  telegram.js       ← Telegram 웹훅 (S1EX1)
  ...
```

### 6. 배포 상태 확인
- Vercel CLI 또는 Dashboard에서 최신 배포 성공 확인
- 프로덕션 URL 접속 가능

## Expected Output Files
- `vercel.json` (기존 파일 확인)
- `render.yaml` (기존 파일 확인, 선택적)

## Completion Criteria
- [ ] `vercel.json` 존재 및 올바른 JSON 형식
- [ ] 서버리스 함수 `maxDuration: 30` 설정 확인
- [ ] CORS 헤더 설정 확인
- [ ] Vercel 환경변수 Secrets 연결 확인
- [ ] 최신 배포 상태 정상 (Vercel Dashboard)
- [ ] 프로덕션 URL 접속 가능

## Tech Stack
- Vercel (서버리스 플랫폼)
- Next.js (App Router)
- Node.js (서버리스 함수)
- Render.com (대체 플랫폼, 선택적)

## Tools
- vercel-cli
- git
- gh (GitHub CLI)

## Execution Type
Human-AI (Vercel Dashboard 환경변수 설정은 PO가 수행)

## Remarks
- 이 Task는 소급(Retroactive) 등록 항목 — 이미 구현 완료
- `vercel.json`은 S1BI2에서 이미 생성됨 — 이 Task에서 배포 설정 부분을 확장/검증
- Vercel Secrets (`@supabase_url` 등)는 PO가 Vercel Dashboard에서 설정
- Next.js App Router 사용으로 `next.config.js` 기반 자동 빌드

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1BI3 → `Process/S1_개발_준비/Backend_Infra/`

### 제2 규칙: Production 코드는 이중 저장
- `vercel.json`, `render.yaml`은 프로젝트 루트에만 존재
- Pre-commit Hook 자동 복사 대상 아님 (루트 설정 파일)
