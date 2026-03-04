# Verification Instruction - S1T1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S1T1

## Task Name
테스트 환경 설정

## Verification Checklist

### 1. Jest 설정 검증
- [ ] `jest.config.js` 파일 존재
- [ ] testEnvironment 설정
- [ ] testMatch 패턴 설정
- [ ] collectCoverage 설정

### 2. Playwright 설정 검증
- [ ] `playwright.config.js` 파일 존재
- [ ] testDir 설정
- [ ] timeout 설정
- [ ] use.baseURL 설정
- [ ] projects (브라우저) 설정

### 3. 테스트 디렉토리 구조 검증
- [ ] `tests/unit/` 디렉토리 존재
- [ ] `tests/integration/` 디렉토리 존재
- [ ] `tests/e2e/` 디렉토리 존재

### 4. package.json 스크립트 검증
- [ ] `test` 스크립트
- [ ] `test:unit` 스크립트
- [ ] `test:integration` 스크립트
- [ ] `test:e2e` 스크립트

### 5. 샘플 테스트 파일 검증
- [ ] 단위 테스트 샘플 존재
- [ ] E2E 테스트 샘플 존재

### 6. 테스트 실행 검증
- [ ] `npm test` 실행 성공
- [ ] `npm run test:e2e` 실행 성공 (로컬 서버 필요)

## Test Commands
```bash
# 설정 파일 확인
ls -la jest.config.js playwright.config.js

# 테스트 디렉토리 확인
ls -la tests/

# 테스트 실행
npm test
npm run test:e2e
```

## Expected Results
- Jest 설정 파일 존재 및 유효
- Playwright 설정 파일 존재 및 유효
- 테스트 디렉토리 구조 완성
- 샘플 테스트 실행 성공

## Verification Agent
test-engineer

## Pass Criteria
- Jest/Playwright 설정 완료
- 테스트 디렉토리 구조 생성
- 샘플 테스트 실행 성공

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] 테스트 설정 파일이 프로젝트 루트에 저장되었는가?
- [ ] 테스트 관련 문서가 `S1_개발_준비/Testing/`에 저장되었는가?
