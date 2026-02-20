# Verification Instruction - S2T1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2T1

## Task Name
인증 API 테스트

## Verification Checklist

### 1. 테스트 파일 존재 검증
- [ ] tests/unit/auth/middleware.test.js 존재
- [ ] tests/integration/auth/google-auth.test.js 존재
- [ ] tests/integration/auth/email.test.js 존재

### 2. 단위 테스트 검증
- [ ] 토큰 없는 경우 테스트
- [ ] 유효하지 않은 토큰 테스트
- [ ] 유효한 토큰 테스트

### 3. 통합 테스트 검증
- [ ] OAuth 리다이렉트 테스트
- [ ] 콜백 처리 테스트
- [ ] 이메일 API 테스트

### 4. 테스트 실행 검증
```bash
npm run test:auth
```
- [ ] 모든 테스트 통과
- [ ] 커버리지 80% 이상

### 5. Mock 설정 검증
- [ ] Supabase Auth Mock
- [ ] 외부 의존성 분리

## Test Commands
```bash
# 테스트 파일 확인
ls -la tests/unit/auth/
ls -la tests/integration/auth/

# 테스트 실행
npm run test:auth
```

## Expected Results
- 테스트 파일 존재
- 모든 테스트 통과
- 커버리지 목표 달성

## Verification Agent
test-engineer

## Pass Criteria
- 단위 테스트 통과
- 통합 테스트 통과
- 커버리지 80% 이상

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

