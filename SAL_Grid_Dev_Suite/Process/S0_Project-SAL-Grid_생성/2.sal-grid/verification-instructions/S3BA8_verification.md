# Verification Instruction - S3BA8

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
S3BA8

## Task Name
스킬 API 기본 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `api/skills.js` 존재
- [ ] `api/skill-integrations.js` 존재
- [ ] 각 파일 상단 `@task S3BA8` 주석 존재

### 2. 기능 검증
- [ ] `api/skills.js` — 스킬 목록 조회 기능
- [ ] `api/skills.js` — 스킬 설치/제거 기능
- [ ] `api/skill-integrations.js` — 외부 서비스 통합 기능

### 3. 코드 품질 검증
- [ ] Supabase 연동 또는 JSON 파일 참조
- [ ] 하드코딩된 스킬 배열 데이터 없음 (또는 JSON 파일 기반)
- [ ] S3BA2와 역할 범위 명확히 분리 (주석 또는 README)

### 4. 저장 위치 검증
- [ ] `api/` 루트에 저장되어 있는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la api/skills.js api/skill-integrations.js

# 주석 확인
head -5 api/skills.js

# 기능 확인
grep -n "install\|execute\|integration" api/skills.js
```

## Expected Results
- 2개 파일 존재
- 스킬 설치/실행 기능 구현
- S3BA2와 역할 분리 명확

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 2개 파일 모두 존재 확인
- [ ] 주요 기능 동작 확인
- [ ] S3BA2와 중복/충돌 없음 확인
- [ ] Blocker 없음
