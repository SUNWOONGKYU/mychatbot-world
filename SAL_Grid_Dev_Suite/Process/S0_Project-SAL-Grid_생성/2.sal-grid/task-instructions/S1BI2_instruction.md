# Task Instruction - S1BI2

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
S1BI2

## Task Name
Supabase 클라이언트 + 환경변수 설정 (소급)

## Task Goal
Supabase JavaScript 클라이언트 초기화 코드와 환경변수 설정이 완료된 상태를 문서화한다. 이 Task는 이미 구현 완료되어 소급 등록된 항목이다. 기존 구현 내용을 확인하고 검증한다.

## Prerequisites (Dependencies)
- S1BI1 (Next.js 프로젝트 초기화) — 소급 완료된 상태

## Specific Instructions

### 1. 기존 구현 내용 확인 (소급)
이 Task는 이미 완료된 작업을 소급 기록한다. 아래 파일들이 실제로 존재하는지 확인한다:

```
api/_shared.js          ← Supabase 클라이언트 (서버리스 함수용)
vercel.json             ← 환경변수 + 라우팅 설정
.env.local              ← 로컬 환경변수 (Git 제외)
```

### 2. api/_shared.js 구현 내용
Supabase 클라이언트를 서버리스 함수에서 공유하는 유틸리티 파일:

```js
/**
 * @task S1BI2
 * @description Supabase 공유 클라이언트 — 서버리스 함수용
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };
```

### 3. Next.js용 Supabase 클라이언트 (lib/supabase.ts)
클라이언트 사이드 및 서버 컴포넌트용:

```ts
/**
 * @task S1BI2
 * @description Supabase 클라이언트 — Next.js App Router용
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4. vercel.json 환경변수 + 라우팅 설정
```json
{
  "version": 2,
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
  }
}
```

### 5. .env.local 환경변수 (로컬)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. .gitignore 확인
`.env.local`, `.env` 파일이 Git에 포함되지 않는지 확인:
```
.env
.env.local
.env*.local
```

### 7. Supabase 프로젝트 정보 확인
- Supabase Dashboard에서 Project URL 및 API 키 확인 완료
- `hlpovizxnrnspobddxmq` (서울 리전) 프로젝트 사용

## Expected Output Files
- `api/_shared.js` (기존 파일 확인)
- `lib/supabase.ts` (기존 파일 확인)
- `vercel.json` (기존 파일 확인)
- `.env.local` (기존 파일 확인 — Git 제외)

## Completion Criteria
- [ ] `api/_shared.js` 존재 및 Supabase 클라이언트 초기화 코드 포함
- [ ] `lib/supabase.ts` 존재 및 Next.js용 클라이언트 코드 포함
- [ ] `vercel.json` 존재 및 환경변수 매핑 포함
- [ ] `.env.local` 존재 (실제 값 입력됨)
- [ ] `.gitignore`에 `.env.local` 제외 설정 확인
- [ ] Supabase 연결 테스트 성공 (간단한 쿼리 실행)

## Tech Stack
- Supabase JS (`@supabase/supabase-js`)
- Node.js (서버리스 함수)
- Next.js (App Router)
- Vercel

## Tools
- supabase (CLI, 선택적)
- vercel-cli
- npm

## Execution Type
Human-AI (실제 Supabase 프로젝트 키는 PO가 입력)

## Remarks
- 이 Task는 소급(Retroactive) 등록 항목 — 이미 구현 완료
- 실제 API 키는 `.env.local`에만 존재하며 Git에 포함되지 않음
- `api/_shared.js`는 서버리스(Node.js) 함수용, `lib/supabase.ts`는 Next.js App Router용으로 분리
- Supabase 프로젝트: `hlpovizxnrnspobddxmq` (서울 리전, CPC 시스템 동일 프로젝트)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1BI2 → `Process/S1_개발_준비/Backend_Infra/`

### 제2 규칙: Production 코드는 이중 저장
- `api/_shared.js` → Stage 폴더 + `api/Backend_Infra/` (Pre-commit Hook 자동)
- `lib/supabase.ts` → 프로젝트 루트 lib/
