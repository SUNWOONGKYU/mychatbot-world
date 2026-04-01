# Verification Instruction - S3BA6

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
S3BA6

## Task Name
커뮤니티 API 7개 (소급)

## Verification Checklist

### 1. 파일 존재 검증 (7개 모두)
- [ ] `api/Backend_APIs/community-posts.js` 존재
- [ ] `api/Backend_APIs/community-comments.js` 존재
- [ ] `api/Backend_APIs/community-likes.js` 존재
- [ ] `api/Backend_APIs/community-search.js` 존재
- [ ] `api/Backend_APIs/community-categories.js` 존재
- [ ] `api/Backend_APIs/community-notifications.js` 존재
- [ ] `api/Backend_APIs/community-report.js` 존재
- [ ] 각 파일 상단 `@task S3BA6` 주석 존재

### 2. 기능 검증
- [ ] 게시글 CRUD 기능 (`community-posts.js`)
- [ ] 댓글 기능 (`community-comments.js`)
- [ ] 좋아요/취소 기능 (`community-likes.js`)
- [ ] 검색 기능 (`community-search.js`)

### 3. 코드 품질 검증
- [ ] 7개 파일 모두 Supabase 연동
- [ ] 하드코딩된 게시글/댓글 데이터 없음
- [ ] 에러 처리 로직 존재

### 4. 저장 위치 검증
- [ ] `api/Backend_APIs/` 에 저장되어 있는가?

## Test Commands
```bash
# 파일 7개 존재 확인
ls -la api/Backend_APIs/community-*.js

# 주석 확인
head -3 api/Backend_APIs/community-posts.js

# Supabase 연동 확인
grep -l "supabase\|createClient" api/Backend_APIs/community-*.js
```

## Expected Results
- `api/Backend_APIs/community-*.js` 7개 파일 모두 존재
- 각 파일 Supabase 연동
- 하드코딩 데이터 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 7개 파일 모두 존재 확인
- [ ] 주요 기능 동작 확인
- [ ] 하드코딩 데이터 없음 확인
- [ ] Blocker 없음
