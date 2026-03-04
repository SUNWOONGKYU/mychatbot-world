# Verification Instruction - S2C1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-supabase.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |



## Task ID
S2C1

## Task Name
학습용 콘텐츠 시스템 정비

## Verification Checklist

### 1. 콘텐츠 폴더 검증
- [ ] `부수적_고유기능/학습용_콘텐츠/` 폴더 존재
- [ ] `부수적_고유기능/Tips/` 폴더 존재
- [ ] MD 파일 목록 확인

### 2. viewer.html 검증
- [ ] `부수적_고유기능/학습용_Books/viewer.html` 존재
- [ ] CONTENTS 객체가 실제 폴더 구조와 일치
- [ ] jsdelivr CDN URL 형식 정확

### 3. index.html 검증
- [ ] LEARNING_CONTENTS 배열이 실제 파일과 동기화
- [ ] TIPS_CONTENTS 배열이 실제 파일과 동기화 (48개)
- [ ] 검색 기능 작동

### 4. CDN 접근 테스트
```bash
# jsdelivr CDN 접근 확인
curl -I "https://cdn.jsdelivr.net/gh/SUNWOONGKYU/SSALWorks@master/부수적_고유기능/학습용_콘텐츠/1.%20Claude%26ClaudeCode사용법/1편_Claude란_무엇인가.md"
```

## Test Commands
```bash
# 학습 콘텐츠 파일 목록
ls -la "부수적_고유기능/학습용_콘텐츠/"

# Tips 파일 목록
ls -la "부수적_고유기능/Tips/"

# CONTENTS 객체 확인
grep -n "CONTENTS" "부수적_고유기능/학습용_Books/viewer.html" | head -5

# TIPS_CONTENTS 배열 확인
grep -n "TIPS_CONTENTS" "Production/Frontend/index.html" | head -5
```

## Expected Results
- 학습 콘텐츠 MD 파일 존재
- Tips MD 파일 존재 (48개)
- viewer.html CONTENTS 객체 동기화
- index.html 배열 동기화
- jsdelivr CDN 접근 가능

## Verification Agent
content-specialist

## Pass Criteria
- 모든 콘텐츠 폴더 존재
- viewer.html CONTENTS 객체 동기화 완료
- index.html 배열 동기화 완료
- CDN 접근 테스트 통과

---

## ⚠️ 저장 위치 검증 항목

### 필수 검증
- [ ] Task ID의 Stage에 맞는 폴더에 저장되었는가? (S2→S2_개발-1차/)
- [ ] Task ID의 Area에 맞는 폴더에 저장되었는가? (C→Content_System/)
- [ ] Production 관련 코드는 Production 폴더에도 저장되었는가?

### 아키텍처 검증
- [ ] DB를 사용하지 않고 jsdelivr CDN 방식으로 구현되었는가?
- [ ] SQL 파일이 불필요하게 생성되지 않았는가?
