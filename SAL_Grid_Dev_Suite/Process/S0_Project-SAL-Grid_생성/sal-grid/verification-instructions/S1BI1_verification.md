# Verification Instruction - S1BI1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S1BI1

## Task Name
환경변수 설정

## Verification Checklist

### 1. .env.example 파일 검증
- [ ] `.env.example` 파일 존재
- [ ] 모든 필수 환경변수 목록 포함:
  - Supabase (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  - Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
  - Resend (RESEND_API_KEY)
  - AI APIs (OPENAI_API_KEY, GOOGLE_AI_API_KEY, PERPLEXITY_API_KEY)
  - 토스페이먼츠 (TOSS_CLIENT_KEY, TOSS_SECRET_KEY)
  - Sentry (SENTRY_DSN)
  - App (APP_URL, CRON_SECRET)

### 2. Vercel 환경변수 설정 검증
- [ ] Vercel Dashboard에서 환경변수 설정 완료
- [ ] Production/Preview/Development 환경별 설정
- [ ] 민감한 키 Encrypted 설정

### 3. .gitignore 검증
- [ ] `.env` 파일 제외 확인
- [ ] `.env.local` 파일 제외 확인
- [ ] `.env.*.local` 파일 제외 확인

### 4. 문서 검증
- [ ] 환경변수 설정 가이드 문서 존재
- [ ] 환경변수 접근 방법 설명 포함

## Test Commands
```bash
# .env.example 파일 확인
cat .env.example

# .gitignore 확인
grep ".env" .gitignore

# Vercel 환경변수 확인 (Vercel CLI)
vercel env ls
```

## Expected Results
- .env.example 파일 존재 및 모든 필수 환경변수 포함
- .gitignore에 .env 파일 제외 설정
- Vercel 환경변수 설정 완료

## Verification Agent
devops-troubleshooter

## Pass Criteria
- .env.example 파일 완성
- Vercel 환경변수 설정 완료
- .gitignore 설정 완료

## ⚠️ Human-AI Task 검증 주의사항

이 Task는 **Human-AI** 유형입니다.
- .env.example 템플릿 작성은 AI가 수행
- **실제 Vercel 환경변수 설정은 PO가 수행해야 합니다**
- 실제 API 키 값 입력은 Human 필수

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] `.env.example`이 프로젝트 루트에 저장되었는가?
- [ ] 환경변수 가이드 문서가 `S1_개발_준비/Backend_Infra/`에 저장되었는가?
