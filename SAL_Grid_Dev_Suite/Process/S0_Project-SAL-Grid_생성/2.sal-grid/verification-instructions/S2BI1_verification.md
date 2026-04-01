# Verification Instruction - S2BI1

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
S2BI1

## Task Name
멀티 AI 라우팅 (OpenRouter) 고도화

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Backend_Infra/lib/ai-router.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_Infra/lib/ai-models.ts` 존재
- [ ] `Process/S2_개발-1차/Backend_Infra/app/api/chat/route.ts` 존재
- [ ] 각 파일 상단에 `@task S2BI1` 주석 존재
- [ ] TypeScript 문법 유효성 확인

### 2. 기능 검증
- [ ] `selectModel(1, 50)` 호출 시 저비용 모델 ID 반환
- [ ] `selectModel(100, 50)` 호출 시 고품질 모델 ID 반환
- [ ] `selectModel(50, 10)` 호출 시 비용 제한으로 고비용 모델 제외 확인
- [ ] `ai-models.ts`에 각 모델의 cost 메타데이터(inputCost, outputCost) 정의 확인
- [ ] Epsilon-greedy Bandit 로직(epsilon 값, 탐색/활용 분기) 구현 확인
- [ ] `app/api/chat/route.ts`에서 `emotionLevel`, `costLevel` 파라미터 수신 확인
- [ ] 라우터 호출 후 선택된 모델로 OpenRouter API 요청 확인

### 3. 통합 검증
- [ ] S1BI1(OpenRouter 기본 연동) 결과와 연동 정상 동작
- [ ] S1BI2(모델 목록 초기화)와 충돌 없음
- [ ] `app/api/chat/route.ts`가 기존 chat 흐름을 깨지 않음

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Backend_Infra/` 에 원본 저장되었는가?
- [ ] git commit 후 `api/Backend_Infra/` 로 자동 복사되었는가?

## Test Commands
```bash
# TypeScript 타입 검사
npx tsc --noEmit

# 파일 존재 확인
ls -la Process/S2_개발-1차/Backend_Infra/lib/
ls -la Process/S2_개발-1차/Backend_Infra/app/api/chat/

# 빌드 확인
npm run build
```

## Expected Results
- `selectModel()` 함수가 슬라이더 값에 따라 다른 모델 계층을 반환
- 비용슬라이더가 낮을 때 고비용 모델이 후보에서 제외됨
- TypeScript 컴파일 에러 0개
- 기존 chat API 동작에 영향 없음

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
