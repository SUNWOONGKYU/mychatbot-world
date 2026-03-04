# Verification Instruction - S1F2

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S1F2

## Task Name
vercel.json 설정

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `vercel.json` 파일 존재
- [ ] JSON 문법 유효성 검증

### 2. 기본 설정 검증
- [ ] `version: 2` 설정
- [ ] `cleanUrls: true` 설정
- [ ] `trailingSlash: false` 설정

### 3. 보안 헤더 검증
- [ ] X-Content-Type-Options 헤더
- [ ] X-Frame-Options 헤더
- [ ] X-XSS-Protection 헤더
- [ ] Referrer-Policy 헤더
- [ ] Permissions-Policy 헤더

### 4. API 라우팅 검증
- [ ] `/api/*` 라우팅 설정

### 5. CORS 설정 검증
- [ ] Access-Control-Allow-Origin 헤더
- [ ] Access-Control-Allow-Methods 헤더
- [ ] Access-Control-Allow-Headers 헤더

### 6. 캐싱 설정 검증
- [ ] 정적 파일 캐싱 설정

### 7. 배포 후 헤더 확인
- [ ] Vercel 재배포 후 보안 헤더 적용 확인

## Test Commands
```bash
# JSON 문법 검증
cat vercel.json | python -m json.tool

# 배포 후 헤더 확인
curl -I https://ssalworks.vercel.app
```

## Expected Results
- vercel.json 파일 유효
- 보안 헤더 설정 적용
- CORS 설정 적용

## Verification Agent
code-reviewer

## Pass Criteria
- vercel.json 파일 생성 완료
- 보안 헤더 설정 완료
- JSON 문법 검증 통과
- 배포 후 헤더 확인

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] `vercel.json`이 프로젝트 루트에 저장되었는가?
- [ ] `S1_개발_준비/Frontend/`에도 저장되었는가?
