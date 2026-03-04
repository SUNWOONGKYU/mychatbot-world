# Verification Instruction - S1M1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S1M1

## Task Name
개발 가이드

## Verification Checklist

### 1. 문서 존재 검증
- [ ] `DEVELOPMENT_GUIDE.md` 파일 존재
- [ ] Markdown 형식 유효성

### 2. 코딩 컨벤션 섹션 검증
- [ ] JavaScript/TypeScript 스타일 가이드 포함
- [ ] 변수/함수 네이밍 규칙 (camelCase, PascalCase)
- [ ] 주석 작성 규칙
- [ ] ESLint/Prettier 설정

### 3. 파일 명명 규칙 섹션 검증
- [ ] 컴포넌트 파일: PascalCase
- [ ] 유틸리티 파일: camelCase
- [ ] API 라우트: kebab-case
- [ ] 상수 파일: UPPER_SNAKE_CASE

### 4. Serverless API 구조 섹션 검증
- [ ] api/ 폴더 구조 설명
- [ ] auth/, subscription/, payment/, ai/ 구조
- [ ] 엔드포인트 명명 규칙

### 5. 디렉토리 구조 섹션 검증
- [ ] 프로젝트 구조 설명
- [ ] 공통 유틸리티 위치 설명

### 6. 환경변수 규칙 섹션 검증
- [ ] 네이밍 규칙 (UPPER_SNAKE_CASE)
- [ ] 필수 환경변수 목록
- [ ] .env.example 유지 방법

## Test Commands
```bash
# 문서 존재 확인
ls -la docs/DEVELOPMENT_GUIDE.md

# Markdown 검증 (markdownlint 사용시)
npx markdownlint docs/DEVELOPMENT_GUIDE.md
```

## Expected Results
- 개발 가이드 문서 존재
- 모든 필수 섹션 포함
- Markdown 형식 유효

## Verification Agent
documentation-specialist

## Pass Criteria
- 코딩 컨벤션 섹션 완성
- 파일 명명 규칙 섹션 완성
- Serverless API 구조 섹션 완성
- 디렉토리 구조 섹션 완성
- 환경변수 규칙 섹션 완성

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] 개발 가이드 문서가 `S1_개발_준비/Documentation/`에 저장되었는가?
