# Verification Instruction - S4BA4

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
S4BA4

## Task Name
Marketplace API (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/marketplace.js` 존재
- [ ] 파일 상단에 `@task S4BA4` 주석 존재

### 2. API 엔드포인트 검증
- [ ] `GET /api/marketplace` 목록 조회 구현 (페이지네이션 포함)
- [ ] 카테고리 필터 파라미터 지원
- [ ] 검색 파라미터 지원
- [ ] `GET /api/marketplace/:id` 상세 조회 구현
- [ ] `POST /api/marketplace` 업로드 구현 (인증 필요)

### 3. 코드 품질 검증
- [ ] 인증이 필요한 엔드포인트(POST)에 미들웨어 적용
- [ ] 입력값 검증 구현 (필수 필드 확인)
- [ ] 에러 응답이 일관된 형식 (`{ error: { message } }`)
- [ ] DB에서 실제 데이터 조회 (하드코딩 mock 없음)

### 4. 통합 검증
- [ ] S4FE3 의존성: 프론트엔드에서 필요한 응답 필드 포함 (아바타, 이름, 가격 등)
- [ ] 다른 Task와 충돌 없음

### 5. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/` 에 저장되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Backend_APIs/marketplace.js"

# Task ID 주석 확인
grep "@task S4BA4" "Process/S4_개발_마무리/Backend_APIs/marketplace.js"

# 인증 미들웨어 적용 확인
grep -n "auth\|middleware\|session\|token" \
  "Process/S4_개발_마무리/Backend_APIs/marketplace.js"

# mock 데이터 하드코딩 없음 확인
grep -n "const.*=.*\[{" "Process/S4_개발_마무리/Backend_APIs/marketplace.js"
```

## Expected Results
- `marketplace.js` 파일이 존재한다
- 목록/상세/업로드 3개 엔드포인트가 구현되어 있다
- POST 엔드포인트에 인증 미들웨어가 적용되어 있다
- DB에서 데이터를 조회한다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] `@task S4BA4` 주석 존재
- [ ] 인증 미들웨어 적용 확인
- [ ] 하드코딩 mock 없음
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Backend_APIs/`에 저장되었는가?
