# Verification Instruction - S3FE4

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
S3FE4

## Task Name
Community 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Frontend/app/community/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/community/write/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/community/[id]/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/app/community/gallery/page.tsx` 존재
- [ ] `Process/S3_개발-2차/Frontend/components/community/yard.tsx` 존재
- [ ] 각 파일 상단 `@task S3FE4` 주석 존재

### 2. 데이터 소스 검증 (최우선)
- [ ] `const MOCK_POSTS = [...]` 같은 하드코딩 배열 없음
- [ ] 게시판: `fetch('/api/community')` 호출
- [ ] 댓글: `fetch('/api/community/[id]/comments')` 호출

### 3. 게시판 기능 검증
- [ ] 카테고리 필터 파라미터 전달
- [ ] 정렬 옵션 (latest, popular) 전달
- [ ] 로딩/에러 상태 처리

### 4. 실시간 검증 (핵심)
- [ ] `subscribeToPost()` 함수 import 및 호출
- [ ] 새 댓글 수신 시 상태 업데이트 로직
- [ ] 컴포넌트 언마운트 시 `unsubscribe()` 호출 (cleanup)

### 5. 댓글 스레딩 검증
- [ ] `parent_id` 기반 대댓글 들여쓰기 표시
- [ ] 댓글 작성 폼 (POST `/api/community/[id]/comments`)

### 6. 마당(Yard) 컴포넌트 검증
- [ ] 채팅형 메시지 목록 표시
- [ ] 메시지 입력/전송 기능
- [ ] Realtime 연결 로직

### 7. TypeScript 검증
- [ ] TypeScript 컴파일 오류 없음

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Frontend/app/community/"
ls -la "Process/S3_개발-2차/Frontend/components/community/"

# 하드코딩 데이터 검사
grep -rn "const.*POSTS.*=.*\[" "Process/S3_개발-2차/Frontend/"
grep -rn "MOCK_POSTS\|DUMMY_POST" "Process/S3_개발-2차/Frontend/"

# Realtime 구독 확인
grep -n "subscribeToPost\|unsubscribe" "Process/S3_개발-2차/Frontend/app/community/[id]/page.tsx"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 파일 존재
- 하드코딩 데이터 없음
- Realtime 구독/해제 로직 확인
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 하드코딩 데이터 배열 없음 (핵심 조건)
- [ ] Realtime 구독 및 cleanup 확인
- [ ] TypeScript 빌드 에러 없음
- [ ] Blocker 없음
