# Verification Instruction - S2FE1

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2FE1

## Task Name
Create 위저드 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Frontend/app/create/page.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/create/wizard-steps.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/create/voice-recorder.tsx` 존재
- [ ] 각 파일 `@task S2FE1` 주석 존재

### 2. 기능 검증 (FE 데이터 소스 검증 포함)
- [ ] 4단계 스텝퍼가 단계별로 이동 가능 (Next/Prev 버튼)
- [ ] 각 단계에서 실제 API 엔드포인트(fetch)를 호출 (하드코딩 mock 데이터 금지)
- [ ] Step 2: MediaRecorder를 이용한 음성 녹음 UI 동작
- [ ] Step 3: FAQ 목록이 API 응답에서 렌더링 (하드코딩 배열 금지)
- [ ] Step 3: FAQ 항목 편집 가능 (텍스트 input)
- [ ] Step 4: deployUrl, qrUrl을 API 응답에서 표시
- [ ] 진행 표시바가 현재 단계 반영
- [ ] 완료 시 `/birth/{botId}` 로 이동

### 3. 통합 검증
- [ ] S1FE1(Next.js 설정)과 App Router 구조 호환
- [ ] S2BA1(Create API) 엔드포인트와 실제 연동 가능한 구조
- [ ] TypeScript 타입 오류 없음

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Frontend/` 에 원본 저장되었는가?
- [ ] git commit 후 루트 폴더로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Frontend/app/create/
ls -la Process/S2_개발-1차/Frontend/components/create/

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build

# 하드코딩 데이터 검사 (없어야 함)
grep -n "const.*FAQ\|mock\|hardcoded" Process/S2_개발-1차/Frontend/app/create/page.tsx
```

## Expected Results
- 빌드 성공, TypeScript 오류 0개
- 각 단계에서 API fetch 코드 확인
- FAQ 렌더링이 API 응답 기반

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
