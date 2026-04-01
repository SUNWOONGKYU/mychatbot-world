# Verification Instruction - S3BA5

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

> **⚠️ 소급(Retroactive) Task 검증 안내**
> 이미 완료된 파일을 대상으로 실존 여부, 기능 동작, 코드 품질을 검증합니다.

---

## Task ID
S3BA5

## Task Name
학습 진도 API (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `api/Backend_APIs/learning-progress.js` 존재
- [ ] 파일 상단 `@task S3BA5` 주석 존재

### 2. 기능 검증
- [ ] 진도 조회(GET) 엔드포인트 구현
- [ ] 진도 업데이트(PUT/POST) 엔드포인트 구현
- [ ] 에러 처리 로직 존재 (try/catch 또는 동등)

### 3. 코드 품질 검증
- [ ] Supabase 클라이언트 연동
- [ ] 인증 확인 로직 (user_id 기반)
- [ ] 하드코딩된 mock 데이터 배열 없음

### 4. 저장 위치 검증
- [ ] `api/Backend_APIs/` 에 저장되어 있는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la api/Backend_APIs/learning-progress.js

# 주석 확인
head -5 api/Backend_APIs/learning-progress.js

# 핵심 기능 확인
grep -n "GET\|POST\|PUT\|progress" api/Backend_APIs/learning-progress.js
```

## Expected Results
- `api/Backend_APIs/learning-progress.js` 존재
- 진도 조회/업데이트 기능 구현
- Supabase 연동

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 파일 존재 확인
- [ ] 진도 CRUD 기능 확인
- [ ] 하드코딩 데이터 없음 확인
- [ ] Blocker 없음
