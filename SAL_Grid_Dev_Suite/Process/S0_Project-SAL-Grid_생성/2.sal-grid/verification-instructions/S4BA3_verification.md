# Verification Instruction - S4BA3

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
S4BA3

## Task Name
피상속 API (피상속인 지정, 동의, 전환)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/route.ts` 존재
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/consent/route.ts` 존재
- [ ] `Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/transfer/route.ts` 존재
- [ ] 각 파일 상단에 `@task S4BA3` 주석 존재

### 2. 기능 검증
- [ ] `GET /api/inheritance` 피상속인 현황 및 페르소나 설정 반환
- [ ] `POST /api/inheritance` 피상속인 지정, 이벤트 기록 구현
- [ ] `DELETE /api/inheritance` 피상속인 지정 해제 구현
- [ ] `GET /api/inheritance/consent` 나에게 온 요청 목록 반환
- [ ] `POST /api/inheritance/consent` 수락(`accepted`) / 거부(`declined`) 상태 업데이트
- [ ] 이미 처리된 동의 요청 재처리 시 409 반환
- [ ] `PATCH /api/inheritance` 페르소나별 허용 여부 일괄 업데이트
- [ ] `POST /api/inheritance/transfer` 전환 요청 생성 (`pending_review` 상태)
- [ ] 전환은 수동 승인 필요 (자동 전환 없음) — 코드에서 자동 완료 처리 없음 확인

### 3. 인증/권한 검증
- [ ] 비인증 요청 시 401 반환
- [ ] 피상속인이 아닌 사람이 동의 요청 처리 시 403 반환
- [ ] 본인이 자신의 피상속인을 지정하는 경우 방지 로직

### 4. 통합 검증
- [ ] S1DB2 의존성: 사용자/페르소나 테이블 사용
- [ ] S3SC1 의존성: 인증 미들웨어 적용 확인
- [ ] Supabase 쿼리 사용 (하드코딩 mock 없음)

### 5. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Backend_APIs/` 에 저장되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/"

# 자동 전환 코드 없음 확인 (수동 승인 필수)
grep -n "transferred\|auto.*transfer\|status.*=.*transferred" \
  "Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/transfer/route.ts"

# 권한 검증 로직 확인
grep -n "403\|forbidden\|userId\|ownerId" \
  "Process/S4_개발_마무리/Backend_APIs/app/api/inheritance/consent/route.ts"

# TypeScript 타입 검사
npx tsc --noEmit
```

## Expected Results
- 3개 파일이 모두 존재한다
- 전환 API가 `pending_review` 상태로만 생성한다 (자동 완료 없음)
- 동의 처리에서 권한 검증이 동작한다
- 이미 처리된 요청 재처리 시 409를 반환한다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 자동 유산 전환 코드 없음 확인
- [ ] 권한 검증 (403) 구현 확인
- [ ] TypeScript 타입 오류 없음
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Backend_APIs/`에 저장되었는가?
- [ ] git commit 시 `api/Backend_APIs/`로 자동 복사될 구조인가?
