# Verification Instruction - S2BA1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2BA1

## Task Name
Google OAuth Serverless API

## Verification Checklist

### 1. 파일 존재 검증
- [ ] api/auth/google.js 존재
- [ ] api/auth/google/callback.js 존재

### 2. OAuth 플로우 검증
- [ ] /api/auth/google → Google 리다이렉트
- [ ] 콜백에서 토큰 처리
- [ ] 세션 생성

### 3. API 응답 검증
- [ ] 성공 시 리다이렉트
- [ ] 실패 시 에러 응답
- [ ] 적절한 HTTP 상태 코드

### 4. 보안 검증
- [ ] state 파라미터 검증
- [ ] CSRF 방지
- [ ] 리다이렉트 URL 검증

### 5. 환경 변수 검증
- [ ] GOOGLE_CLIENT_ID 설정
- [ ] GOOGLE_CLIENT_SECRET 설정
- [ ] REDIRECT_URL 설정

## Test Commands
```bash
# 파일 존재 확인
ls -la api/auth/google.js
ls -la api/auth/google/callback.js

# API 테스트 (리다이렉트 확인)
curl -I http://localhost:3000/api/auth/google
```

## Expected Results
- OAuth API 파일 존재
- Google 인증 페이지 리다이렉트
- 콜백 처리 성공

## Verification Agent
backend-developer

## Pass Criteria
- OAuth 플로우 동작
- 토큰 발급 성공
- 보안 검증 통과

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

