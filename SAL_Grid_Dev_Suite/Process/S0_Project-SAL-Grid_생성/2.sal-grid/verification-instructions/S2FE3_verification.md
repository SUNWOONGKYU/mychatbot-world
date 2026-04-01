# Verification Instruction - S2FE3

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2FE3

## Task Name
Home 대시보드 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Frontend/app/home/page.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/home/dashboard.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/home/kb-manager.tsx` 존재
- [ ] 각 파일 `@task S2FE3` 주석 존재

### 2. 기능 검증 (FE 데이터 소스 검증 포함)
- [ ] 챗봇 목록이 API fetch로 로딩됨 (하드코딩 배열 금지)
- [ ] 사용량 차트 데이터가 `/api/usage` fetch로 로딩됨
- [ ] KB 문서 목록이 `/api/kb` fetch로 로딩됨
- [ ] 새 KB 문서 추가 시 POST → embed 순서로 API 호출
- [ ] 문서 삭제 시 DELETE API 호출
- [ ] 설정 변경 시 PUT/PATCH 자동 저장 (debounce)
- [ ] 미로그인 시 리다이렉트 처리

### 3. 통합 검증
- [ ] S1FE1(Next.js 설정)과 App Router 구조 호환
- [ ] S2BA3(KB/설정 API) 엔드포인트와 연동 가능한 구조
- [ ] TypeScript 타입 오류 없음

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Frontend/` 에 원본 저장되었는가?
- [ ] git commit 후 루트 폴더로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Frontend/app/home/
ls -la Process/S2_개발-1차/Frontend/components/home/

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build

# 하드코딩 데이터 검사
grep -n "const.*bots\s*=\s*\[\|mock\|hardcoded" Process/S2_개발-1차/Frontend/app/home/page.tsx
```

## Expected Results
- 빌드 성공, TypeScript 오류 0개
- 챗봇 목록, KB 문서, 사용량이 모두 API 기반으로 렌더링

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
