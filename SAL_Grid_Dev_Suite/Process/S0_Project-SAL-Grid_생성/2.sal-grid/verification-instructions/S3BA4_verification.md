# Verification Instruction - S3BA4

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
S3BA4

## Task Name
Community API 강화 (DB 정합성, 스레딩, 실시간)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/community/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/community/realtime/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/community/[id]/comments/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/app/api/community/yard/route.ts` 존재
- [ ] `Process/S3_개발-2차/Backend_APIs/lib/realtime-client.ts` 존재
- [ ] 각 파일 상단 `@task S3BA4` 주석 존재

### 2. 게시글 API 검증
- [ ] GET handler — 카테고리/정렬/페이지네이션 파라미터 처리
- [ ] POST handler — 게시글 작성 (인증 필수)
- [ ] 정렬 옵션: 'latest', 'popular', 'trending' 지원

### 3. 댓글 스레딩 검증
- [ ] `parent_id` 필드 활용 대댓글 구조
- [ ] 최대 2 depth 제한 로직
- [ ] 댓글 작성 시 게시글 comment_count 업데이트

### 4. Realtime 검증
- [ ] Supabase Realtime 채널 이름 패턴 (`community-{post_id}`)
- [ ] broadcast 이벤트 타입 정의 ('new_comment', 'new_like', 'new_reply')
- [ ] `lib/realtime-client.ts` 구독 함수 구현

### 5. 마당(Yard) 검증
- [ ] 실시간 채팅형 API 구현
- [ ] 메시지 만료 전략 존재 (DB 필드 또는 주석으로 명시)

### 6. 데이터 정합성 검증
- [ ] 좋아요 중복 방지 (upsert 또는 UNIQUE 확인 로직)
- [ ] CASCADE 삭제 처리 (댓글 → 게시글 삭제 시)

### 7. 통합 검증
- [ ] S3BA6 소급 파일과 기능 충돌 없음
- [ ] S1DB1 기본 테이블(`posts`, `comments`)과 정합성

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S3_개발-2차/Backend_APIs/app/api/community/"
ls -la "Process/S3_개발-2차/Backend_APIs/lib/realtime-client.ts"

# 스레딩 구조
grep -n "parent_id\|depth\|thread" "Process/S3_개발-2차/Backend_APIs/app/api/community/[id]/comments/route.ts"

# Realtime 채널
grep -n "channel\|broadcast\|Realtime" "Process/S3_개발-2차/Backend_APIs/lib/realtime-client.ts"

# TypeScript 빌드
npx tsc --noEmit
```

## Expected Results
- 5개 파일 모두 존재
- `parent_id` 기반 댓글 스레딩 구조
- Supabase Realtime 채널 구성
- 마당(Yard) API 구현
- TypeScript 오류 없음

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] TypeScript 빌드 에러 없음
- [ ] Realtime 채널 구성 확인
- [ ] 스레딩 parent_id 구조 확인
- [ ] Blocker 없음
