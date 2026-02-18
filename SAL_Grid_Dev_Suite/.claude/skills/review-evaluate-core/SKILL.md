---
description: "검토 및 5기준 평가 - 100점 품질 스코어 (통제 프로세스)"
user-invocable: true
---

# /review-evaluate — 검토 및 평가 (Review & Evaluate)

콘텐츠를 **검토(Review)**하여 문제점을 파악하고, **평가(Evaluate)**하여 품질 점수를 부여하는 종합 시스템.

## Usage
/review-evaluate <file_path_or_directory>

## Description

이 커맨드는 두 단계로 작동한다:

### 1단계: 검토 (Review)
- 문제점 및 개선사항 식별
- 구체적 수정 제안 제공
- 심각도 분류 (Critical/High/Medium/Low)

### 2단계: 평가 (Evaluate)
5가지 기준으로 품질 점수 산정 (각 20점 만점, 총 100점):
- 기술적 정확성 (Technical Accuracy): Information correctness and currency
- 가독성 (Readability): Ease of reading and understanding
- 구조 및 구성 (Structure & Organization): Logical flow and systematic arrangement
- 완성도 (Completeness): Comprehensive coverage of the topic
- 유용성 (Usefulness): Practical applicability and real-world value

## Parameters
- $ARGUMENTS: The file path or directory to evaluate

## Tools Required
- Read
- Glob
- Grep

## Output Format

### Phase 1: 검토 결과 (Review Findings)
```
🔍 콘텐츠 검토 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 검토 대상: [filename]

🚨 발견된 문제점:

[Critical] — 즉시 수정 필요
• 문제 설명 (파일명:줄번호)
  → 수정 제안

[High] — 우선 수정 권장
• 문제 설명 (파일명:줄번호)
  → 수정 제안

[Medium] — 개선 권장
• 문제 설명 (파일명:줄번호)
  → 수정 제안

[Low] — 선택적 개선
• 문제 설명 (파일명:줄번호)
  → 수정 제안

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Phase 2: 평가 결과 (Evaluation Score)
```
📊 콘텐츠 평가 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 평가 대상: [filename]
⭐ 종합 평점: XX/100점

📈 세부 평가:
• 기술적 정확성: XX/20점
• 가독성: XX/20점
• 구조 및 구성: XX/20점
• 완성도: XX/20점
• 유용성: XX/20점

💬 평가 의견:
[강점]
-
-

[개선 필요 사항]
-
-

[추천 사항]
-
-

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Execution Flow

1. **파일 읽기**: Read 또는 Glob으로 평가 대상 파일 확인
2. **검토 수행**: 문제점 식별 및 심각도 분류
3. **평가 수행**: 5가지 기준으로 점수 산정
4. **결과 출력**: 검토 결과 + 평가 결과 통합 제시
