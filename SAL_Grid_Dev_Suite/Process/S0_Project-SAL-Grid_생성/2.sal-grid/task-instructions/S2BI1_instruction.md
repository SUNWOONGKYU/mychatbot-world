# Task Instruction - S2BI1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S2** = 개발 1차 (Core Development)

### Area 명칭
- **BI** = Backend Infrastructure (백엔드 기반)

---

# Task Instruction - S2BI1

## Task ID
S2BI1

## Task Name
멀티 AI 라우팅 (OpenRouter) 고도화

## Task Goal
OpenRouter API 연동을 고도화하여, 감성슬라이더(1~100)와 비용슬라이더 값을 기반으로 최적 AI 모델을 자동 선택하는 라우터를 구현한다. Cost-Constrained Contextual Bandit 알고리즘의 기초를 적용하여 상황에 따라 비용/품질 균형을 최적화하는 모델 선택 로직을 완성한다.

## Prerequisites (Dependencies)
- S1BI1 — OpenRouter 기본 연동
- S1BI2 — AI 모델 목록/설정 초기화

## Specific Instructions

### 1. 감성슬라이더 기반 모델 매핑
- 감성슬라이더 값 1~100을 3개 구간으로 분류
  - 1~33: 간결·경제형 (haiku, gpt-3.5-turbo 등 저비용)
  - 34~66: 균형형 (sonnet, gpt-4o-mini 등 중간)
  - 67~100: 감성·고품질형 (opus, gpt-4o 등 고품질)
- `lib/ai-router.ts`에 슬라이더 값 → 모델 후보군 매핑 함수 구현

### 2. 비용슬라이더 필터링
- 비용슬라이더 값을 `maxCostPerToken` 임계값으로 변환
- `lib/ai-models.ts`에 각 모델의 input/output cost 메타데이터 정의
- 비용 초과 모델은 후보군에서 제외하는 필터 로직 구현

### 3. Cost-Constrained Contextual Bandit 기초 구현
- 모델별 성공률(quality score)을 세션 내 누적 추적
- Epsilon-greedy 방식으로 탐색(exploration) vs 활용(exploitation) 균형
  - epsilon=0.1: 10% 확률로 랜덤 탐색, 90% 확률로 최고 성공률 모델 선택
- 선택 이력을 메모리(Map)에 저장 (세션 범위, 영속성 불필요)

### 4. app/api/chat/route.ts 연동
- 기존 chat API에서 `emotionLevel`(감성슬라이더), `costLevel`(비용슬라이더) 파라미터 수신
- `selectModel(emotionLevel, costLevel)` 함수로 모델 자동 선택
- 선택된 모델을 OpenRouter API 요청에 반영

### 5. 파일 상단 Task ID 주석 필수
```typescript
/**
 * @task S2BI1
 * @description 멀티 AI 라우팅 고도화 — 감성·비용 슬라이더 기반 모델 자동 선택
 */
```

## Expected Output Files
- `Process/S2_개발-1차/Backend_Infra/lib/ai-router.ts`
- `Process/S2_개발-1차/Backend_Infra/lib/ai-models.ts`
- `Process/S2_개발-1차/Backend_Infra/app/api/chat/route.ts` (수정)

## Completion Criteria
- [ ] `selectModel(emotionLevel, costLevel)` 함수가 유효한 모델 ID를 반환한다
- [ ] 감성슬라이더 1/50/100 각 값에서 서로 다른 모델 계층이 선택된다
- [ ] 비용슬라이더로 고비용 모델이 필터링된다
- [ ] Bandit epsilon-greedy 로직이 구현되어 있다
- [ ] `app/api/chat/route.ts`에서 슬라이더 파라미터를 수신하고 라우터를 호출한다
- [ ] TypeScript 타입 오류 없음

## Tech Stack
- TypeScript, Next.js (App Router)
- OpenRouter API
- Node.js runtime

## Tools
- npm (빌드/타입 검사)
- openai-sdk (OpenRouter 호환 클라이언트)

## Execution Type
AI-Only

## Remarks
- OpenRouter Base URL: `https://openrouter.ai/api/v1`
- 모델 메타데이터는 하드코딩 허용 (OpenRouter 모델 목록 API 호출 불필요)
- Bandit 상태는 싱글턴 Map으로 관리 (서버 재시작 시 리셋 허용)
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S2BI1 → `Process/S2_개발-1차/Backend_Infra/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_Infra/`

---

## 📝 파일 명명 규칙
- kebab-case: `ai-router.ts`, `ai-models.ts`
- 파일 상단 `@task S2BI1` 주석 필수
