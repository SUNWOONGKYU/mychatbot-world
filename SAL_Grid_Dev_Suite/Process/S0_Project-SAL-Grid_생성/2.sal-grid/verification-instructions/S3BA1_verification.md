# Verification Instruction - S3BA1

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
S3BA1

## Task Name
School API (AI 시나리오, 채점, 멘토링)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/school/session/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/school/scenario/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/school/grade/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/school/mentor/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/school/progress/route.ts` 존재
- [ ] 각 파일 상단 `@task S3BA1` 주석 존재

### 2. 학습 세션 API 검증
- [ ] POST handler — `learning_sessions` INSERT 로직
- [ ] GET handler — 사용자 세션 목록 조회
- [ ] Supabase 인증 확인 (`auth.getUser()`)
- [ ] 미인증 시 401 반환

### 3. AI 시나리오 API 검증
- [ ] OpenRouter/AI API 호출 로직 존재
- [ ] `curriculum_id`, `topic`, `difficulty_level` 입력 처리
- [ ] 시나리오 텍스트 반환

### 4. 채점 API 검증
- [ ] AI 채점 프롬프트 구성 로직
- [ ] `score` (0~100), `feedback` 반환 구조
- [ ] score >= 85 시 `learning_certifications` INSERT 트리거 로직
- [ ] JSON 파싱 오류 처리

### 5. 멘토링 API 검증
- [ ] 힌트/가이드 방식 응답 (직접 답변 금지 프롬프트)
- [ ] `session_id`, `question` 입력 처리
- [ ] AI 응답 반환

### 6. 진도 API 검증
- [ ] GET — `learning_progress` 조회
- [ ] PUT — 진도율 업데이트 (`completion_rate`)
- [ ] UNIQUE 제약 충돌 시 upsert 처리

### 7. 데이터 소스 검증 (FE Task 연동 전 필수)
- [ ] 하드코딩된 mock 데이터 배열 없음
- [ ] 모든 데이터는 `learning_sessions`, `learning_progress` DB 테이블에서 조회

### 8. 통합 검증
- [ ] S3DB1 테이블(`learning_sessions` 등) 올바르게 참조
- [ ] S2BA2 AI 호출 패턴과 일관성

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Backend_APIs/app/api/school/"

# 인증 확인 로직
grep -n "getUser\|Unauthorized\|401" "Process/S3_개발-2차/Backend_APIs/app/api/school/session/route.ts"

# 채점 로직
grep -n "score\|certification\|85" "Process/S3_개발-2차/Backend_APIs/app/api/school/grade/route.ts"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 route.ts 파일 존재
- Supabase 인증 적용 (미인증 401)
- AI 채점 score + feedback JSON 반환
- 85점 이상 인증서 발급 로직 존재
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] TypeScript 빌드 에러 없음
- [ ] DB 연동 확인 (하드코딩 데이터 없음)
- [ ] 인증 401 처리 확인
- [ ] Blocker 없음
