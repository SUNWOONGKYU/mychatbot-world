# S3CS2: 누락 시나리오 템플릿 추가

## Task 정보
- **Task ID**: S3CS2
- **Task Name**: 누락 시나리오 템플릿 추가
- **Stage**: S3 (개발 2차)
- **Area**: CS (Content System)
- **Dependencies**: S3CS1

## Task 목표

`school-session.js` 코드에서 참조하지만 파일이 없는 `advanced-qa.json`과 `master-eval.json` 2개 시나리오 템플릿을 생성한다.

## 배경 및 목적

현재 `templates/school/` 폴더에 3개 시나리오만 존재:
- `basic-greeting.json` (3 steps)
- `complaint-handling.json` (4 steps)
- `product-inquiry.json` (4 steps)

코드에서 `advanced-qa`와 `master-eval`을 참조하지만 해당 파일이 없어 404 에러 발생.

## 기능 요구사항

### 1. `advanced-qa.json` (고급 Q&A 시나리오)
- 5 steps
- 복합적인 고객 질문 (가격 비교, 환불 정책, 제품 추천 등)
- 챗봇이 정확한 정보를 제공하면서 친절하게 응대하는 훈련
- XP: 25

### 2. `master-eval.json` (마스터 종합 평가)
- 6 steps
- 다양한 상황 혼합 (인사 → 질문 → 불만 → 복합 요청 → 마무리)
- 종합적인 대화 능력 평가
- XP: 50

### 기존 템플릿 형식 준수
```json
{
  "scenarioId": "advanced-qa",
  "scenarioName": "고급 Q&A 학습",
  "description": "복합적인 고객 질문에 정확하고 친절하게 응대하는 법을 학습합니다.",
  "xpReward": 25,
  "steps": [
    {
      "stepId": 1,
      "userPrompt": "고객 대사",
      "expectedTopics": ["기대 키워드1", "기대 키워드2"]
    }
  ]
}
```

## 코드 작성 기준
- JSON 형식 — 주석 불가
- UTF-8 인코딩
- 기존 3개 시나리오와 동일한 구조

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `templates/school/advanced-qa.json` | 고급 Q&A 시나리오 (신규) |
| `templates/school/master-eval.json` | 마스터 종합 평가 시나리오 (신규) |

## 완료 기준
- [ ] advanced-qa.json이 5 steps로 작성된다
- [ ] master-eval.json이 6 steps로 작성된다
- [ ] 기존 3개 시나리오와 동일한 JSON 구조
- [ ] school-session.js에서 정상 로드 가능
