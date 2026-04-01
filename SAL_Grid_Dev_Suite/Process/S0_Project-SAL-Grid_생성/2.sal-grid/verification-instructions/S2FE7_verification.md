# Verification Instruction - S2FE7

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2FE7

## Task Name
FAQ 관리 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Frontend/app/bot/faq/page.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/bot/faq-manager.tsx` 존재
- [ ] 각 파일 `@task S2FE7` 주석 존재

### 2. 기능 검증 (FE 데이터 소스 검증 포함)
- [ ] FAQ 목록이 API fetch로 로딩됨 (하드코딩 배열 금지)
- [ ] 인라인 편집: 클릭 시 textarea 전환 및 저장 API 호출
- [ ] FAQ 추가: POST API 호출 후 목록 업데이트
- [ ] FAQ 삭제: 확인 후 DELETE API 호출
- [ ] "AI 자동 생성" 버튼이 API에서 FAQ 목록을 가져와 병합
- [ ] 미로그인 시 리다이렉트 처리

### 3. 통합 검증
- [ ] S1FE1(Next.js 설정)과 App Router 구조 호환
- [ ] S2BA1(FAQ API) 엔드포인트 경로 호환
- [ ] TypeScript 타입 오류 없음

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Frontend/` 에 원본 저장되었는가?
- [ ] git commit 후 루트 폴더로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Frontend/app/bot/faq/
ls -la Process/S2_개발-1차/Frontend/components/bot/faq-manager.tsx

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build

# 하드코딩 FAQ 데이터 검사 (없어야 함)
grep -n "const.*faqs\s*=\s*\[\|mock" Process/S2_개발-1차/Frontend/components/bot/faq-manager.tsx
```

## Expected Results
- 빌드 성공, TypeScript 오류 0개
- FAQ 목록, 추가, 수정, 삭제 모두 API 기반 구현

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
