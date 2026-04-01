# Verification Instruction - S1BI2

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1BI2

## Task Name
Supabase 클라이언트 + 환경변수 설정 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `api/_shared.js` 존재
- [ ] `lib/supabase.ts` 존재 (또는 `lib/supabase.js`)
- [ ] `vercel.json` 존재
- [ ] `.env.local` 존재 (Git에는 없으나 로컬에 존재)
- [ ] `.gitignore`에 `.env.local` 제외 설정

### 2. 코드 품질 검증
- [ ] `api/_shared.js`에 `@task S1BI2` 주석 포함
- [ ] `createClient` 호출 시 환경변수(`process.env`)를 사용 (하드코딩 금지)
- [ ] `lib/supabase.ts`가 TypeScript 타입 에러 없이 컴파일됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 서버 사이드에서만 사용됨 (클라이언트 노출 금지)

### 3. 환경변수 검증
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정됨 (서버 전용, `NEXT_PUBLIC_` 접두사 없음)
- [ ] `vercel.json`에 환경변수 매핑 존재

### 4. 보안 검증
- [ ] `.env.local`이 `git status`에서 추적되지 않음
- [ ] `.gitignore`에 `.env*` 패턴 포함
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 번들에 포함되지 않음

### 5. 기능 검증 (연결 테스트)
- [ ] Supabase 클라이언트로 간단한 쿼리 실행 성공
  ```js
  const { data, error } = await supabase.from('mcw_bots').select('count').limit(1);
  // error가 null이어야 함
  ```
- [ ] 연결 오류 없이 응답 수신

### 6. 통합 검증
- [ ] S1BI1에서 생성된 `lib/` 디렉토리에 `supabase.ts` 올바르게 위치
- [ ] `api/` 폴더 구조와 `_shared.js` 경로 일관성 확인
- [ ] 이후 API 파일들이 `require('../api/_shared')` 또는 `import { supabase } from '@/lib/supabase'` 방식으로 사용 가능

### 7. 저장 위치 검증
- [ ] `api/_shared.js`가 `Process/S1_개발_준비/Backend_Infra/`에 원본 저장됨
- [ ] `api/Backend_Infra/_shared.js`에 자동 복사본 존재 (또는 Pre-commit Hook 확인)

## Test Commands
```bash
# 파일 존재 확인
ls api/_shared.js lib/supabase.ts vercel.json

# .gitignore 확인
grep -E "\.env" .gitignore

# git 추적 상태 확인 (.env.local은 추적되면 안 됨)
git status .env.local

# TypeScript 타입 체크
npx tsc --noEmit

# Supabase 연결 테스트 (Node.js 스크립트)
node -e "
const { supabase } = require('./api/_shared');
supabase.from('mcw_bots').select('count').then(({data, error}) => {
  console.log(error ? 'FAIL: ' + error.message : 'PASS: 연결 성공');
});
"
```

## Expected Results
- `api/_shared.js` 파일 존재, Supabase 클라이언트 내보내기
- `.env.local`이 Git에서 제외됨
- Supabase 연결 테스트 성공 (PASS 메시지 출력)
- TypeScript 컴파일 에러 0개

## Verification Agent
security-specialist-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] Supabase 연결 테스트 성공
- [ ] 보안 설정 (.gitignore, 환경변수 분리) 확인
- [ ] Blocker 없음

## ⚠️ Human-AI Task 검증 주의사항
이 Task는 **Human-AI** 유형입니다.
- 실제 Supabase API 키는 PO가 `.env.local`에 입력
- 연결 테스트는 실제 키가 입력된 환경에서만 수행 가능
- 키가 없는 경우 연결 테스트는 "PENDING" 처리
