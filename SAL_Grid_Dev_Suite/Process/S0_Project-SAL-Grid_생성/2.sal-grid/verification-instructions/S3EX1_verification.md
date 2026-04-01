# Verification Instruction - S3EX1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

> **⚠️ 소급(Retroactive) Task 검증 안내**

---

## Task ID
S3EX1

## Task Name
Obsidian 연동 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `api/obsidian.js` 존재
- [ ] 파일 상단 `@task S3EX1` 주석 존재

### 2. 기능 검증
- [ ] 노트 조회 기능 (GET) 구현
- [ ] 노트 생성/수정 기능 (POST/PUT) 구현
- [ ] Obsidian API URL 환경변수 참조 (`process.env.OBSIDIAN_API_URL` 또는 동등)

### 3. 코드 품질 검증
- [ ] 에러 처리 로직 존재 (try/catch)
- [ ] API 키/인증 처리 (있는 경우)

### 4. 저장 위치 검증
- [ ] `api/` 루트에 저장되어 있는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la api/obsidian.js

# 주석 확인
head -5 api/obsidian.js

# 환경변수 참조 확인
grep -n "OBSIDIAN\|process.env" api/obsidian.js
```

## Expected Results
- `api/obsidian.js` 존재
- 노트 읽기/쓰기 API 구현
- 환경변수 기반 설정

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 파일 존재 확인
- [ ] 주요 기능 확인
- [ ] 환경변수 사용 확인
- [ ] Blocker 없음
