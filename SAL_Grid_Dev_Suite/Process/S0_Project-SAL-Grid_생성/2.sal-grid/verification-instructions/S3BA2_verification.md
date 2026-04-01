# Verification Instruction - S3BA2

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
S3BA2

## Task Name
Skills API (런타임 실행, 결제, 리뷰)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/skills/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/skills/execute/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/skills/review/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/skills/install/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/skills/my/route.ts` 존재
- [ ] 각 파일 상단 `@task S3BA2` 주석 존재

### 2. 스킬 목록 API 검증
- [ ] GET handler 존재
- [ ] 검색 파라미터(`q`, `category`) 처리
- [ ] 실제 DB 또는 JSON 파일에서 데이터 로드 (하드코딩 배열 없음)

### 3. 설치/제거 API 검증
- [ ] POST — `skill_installations` INSERT
- [ ] DELETE — status 'uninstalled' 업데이트
- [ ] 중복 설치 방지 로직

### 4. 런타임 실행 API 검증
- [ ] 설치 여부 확인 (`skill_installations` 조회)
- [ ] 미설치 시 403 반환
- [ ] AI API 호출 로직 (스킬 프롬프트 + 사용자 입력)
- [ ] 실행 결과를 `skill_executions` INSERT (cost 포함)
- [ ] Supabase 인증 확인 (미인증 401)

### 5. 결제 처리 검증
- [ ] 20% 수수료 계산 로직 존재
- [ ] 결제 성공 시 설치 처리

### 6. 리뷰 API 검증
- [ ] POST — 리뷰 작성 (UPSERT, 중복 방지)
- [ ] GET — 스킬별 리뷰 목록 조회
- [ ] rating 1~5 범위 검증

### 7. 내 스킬 목록 검증
- [ ] 설치된 스킬 목록 반환
- [ ] 실행 횟수, 마지막 사용일 포함

### 8. 데이터 소스 검증
- [ ] 하드코딩된 스킬 데이터 배열 없음
- [ ] `skill_installations`, `skill_executions` DB 테이블 참조

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Backend_APIs/app/api/skills/"

# 설치 확인 로직
grep -n "403\|skill_installations\|uninstalled" "Process/S3_개발-2차/Backend_APIs/app/api/skills/execute/route.ts"

# 20% 수수료
grep -n "20\|commission\|수수료" "Process/S3_개발-2차/Backend_APIs/app/api/skills/install/route.ts"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 route.ts 파일 존재
- 미설치 스킬 실행 시 403 반환
- skill_executions 로그 기록 로직
- 20% 수수료 계산 코드 존재
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] TypeScript 빌드 에러 없음
- [ ] 미설치 스킬 실행 403 처리 확인
- [ ] DB 연동 확인 (하드코딩 없음)
- [ ] Blocker 없음
