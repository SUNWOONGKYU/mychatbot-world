# Verification Instruction - S3E1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S3E1

## Task Name
AI API 키 설정

## Verification Checklist

### 1. API 키 발급 검증
- [ ] Anthropic Console 계정 생성
- [ ] API 키 발급 완료
- [ ] 키 이름 설정 (ssalworks-xxx)

### 2. 환경 변수 설정 검증
- [ ] Vercel에 ANTHROPIC_API_KEY 등록
- [ ] 환경별 설정 (Development, Preview, Production)

### 3. 로컬 환경 설정 검증
- [ ] .env.local 파일 존재
- [ ] ANTHROPIC_API_KEY 설정
- [ ] .gitignore에 포함 확인

### 4. 검증 스크립트 검증
- [ ] scripts/verify-api-key.js 존재
- [ ] npm run verify:api-key 실행 성공

### 5. 보안 검증
- [ ] 코드에 API 키 하드코딩 없음
- [ ] 클라이언트에 키 노출 없음
- [ ] 환경 변수만 사용

## Test Commands
```bash
# 환경 변수 확인 (마스킹)
echo $ANTHROPIC_API_KEY | cut -c1-10

# 검증 스크립트 실행
npm run verify:api-key

# 코드에서 키 노출 확인
grep -r "sk-ant" --include="*.js" --include="*.ts"
```

## Expected Results
- API 키 발급 완료
- 환경 변수 설정 완료
- 검증 스크립트 통과

## Verification Agent
devops-troubleshooter

## Pass Criteria
- API 키 유효성 확인
- 환경 변수 설정 완료
- 코드에 키 노출 없음

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S1→S1_개발_준비/, S2→S2_개발-1차/, ...)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (S→Security/, F→Frontend/, ...)
- [ ] Production 관련 코드(F, BA, D)는 Production 폴더에도 저장되었는가?

