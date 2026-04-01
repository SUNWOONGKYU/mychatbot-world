# Verification Instruction - S2FE6

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2FE6

## Task Name
Guest 모드 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Frontend/app/guest/page.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/guest/guest-chat.tsx` 존재
- [ ] 각 파일 `@task S2FE6` 주석 존재

### 2. 기능 검증
- [ ] `/guest` 경로: 인증 없이 접근 가능 (미들웨어 리다이렉트 없음)
- [ ] 메시지 전송 시 `/api/chat` 호출 (Authorization 헤더 없음 확인)
- [ ] 대화 응답이 API fetch에서 수신됨 (하드코딩 mock 응답 금지)
- [ ] localStorage `guestChatCount` 카운터 로직 존재
- [ ] 10회 초과 시 모달/팝업 렌더링
- [ ] 상단 CTA 버튼 `/create` 링크 확인

### 3. 통합 검증
- [ ] S1FE1(Next.js 설정)과 App Router 구조 호환
- [ ] S2BA5(기본 chat API) 엔드포인트 경로 일치
- [ ] TypeScript 타입 오류 없음

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Frontend/` 에 원본 저장되었는가?
- [ ] git commit 후 루트 폴더로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Frontend/app/guest/
ls -la Process/S2_개발-1차/Frontend/components/guest/

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build

# 인증 헤더 없이 API 호출 확인
grep -n "Authorization" Process/S2_개발-1차/Frontend/components/guest/guest-chat.tsx
# → 결과 없어야 함 (게스트 모드)
```

## Expected Results
- 빌드 성공, TypeScript 오류 0개
- Authorization 헤더 없이 API 호출
- guestChatCount localStorage 관리 로직 확인

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
