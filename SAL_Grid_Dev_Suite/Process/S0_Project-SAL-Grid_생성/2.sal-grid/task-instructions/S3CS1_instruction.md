# Task Instruction - S3CS1

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
- **S3** = 개발 2차 (Additional Development)

### Area 명칭
- **CS** = Content System (콘텐츠 시스템)

> **⚠️ 소급(Retroactive) Task 안내**
> 이 Task는 이미 완료된 작업을 SAL Grid에 등록하는 소급 Task입니다.

---

# Task Instruction - S3CS1

## Task ID
S3CS1

## Task Name
스킬 프롬프트 10개 (소급)

## Task Goal
이미 작성된 프롬프트 스킬 JSON 파일 10개(`skill-market/prompt-skills/*.json`)를 SAL Grid에 소급 등록한다. 각 스킬의 구조와 품질을 검토하고 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인 (10개)
`skill-market/prompt-skills/` 디렉토리에서 JSON 파일 목록 확인:

예상 스킬 (실제 파일명은 디렉토리 확인):
- 글쓰기 관련 스킬 (블로그 포스트, 카피라이팅 등)
- 분석 관련 스킬 (데이터 분석, 시장 조사 등)
- 번역/언어 관련 스킬
- 학습 지원 스킬 (요약, 퀴즈 생성 등)
- 기타 생산성 스킬

### 2. 프롬프트 스킬 JSON 구조 확인

각 JSON 파일이 다음 구조를 따르는지 검토:
```json
{
  "id": "skill-id",
  "name": "스킬 이름",
  "description": "스킬 설명",
  "category": "카테고리",
  "prompt_template": "프롬프트 템플릿 내용 {{user_input}}",
  "parameters": [
    { "name": "user_input", "type": "string", "required": true }
  ],
  "price": 0,
  "is_free": true,
  "author": "작성자",
  "version": "1.0.0"
}
```

### 3. 품질 검토
- 프롬프트 템플릿 명확성 확인
- 파라미터 정의 완전성 확인
- 설명(description) 적절성 확인
- 미흡한 스킬은 개선

### 4. 스킬 목록 index 파일 확인
- `skill-market/prompt-skills/index.json` 또는 동등한 목록 파일 존재 여부

## Expected Output Files
- `skill-market/prompt-skills/*.json` (10개)

## Completion Criteria
- [ ] `skill-market/prompt-skills/` 디렉토리에 10개 이상의 JSON 파일 존재
- [ ] 각 JSON 파일이 표준 구조(id, name, description, prompt_template) 포함
- [ ] 프롬프트 템플릿에 `{{user_input}}` 또는 동등한 파라미터 변수 포함
- [ ] Grid JSON 파일 상태 업데이트 (Completed, Verified)

## Tech Stack
- JSON (데이터 파일)
- 프롬프트 엔지니어링

## Tools
- 없음 (콘텐츠 파일)

## Task Agent
`content-specialist`

## Verification Agent
`qa-specialist`

## Execution Type
AI-Only

## Remarks
- CS Area는 Production 자동 복사 없음 (DB 또는 파일 시스템에 저장)
- 스킬 JSON 파일은 S3BA2(Skills API)에서 로드하여 사용
- 10개가 없는 경우 기본 구조로 추가 생성

---

## ⚠️ 작업 결과물 저장 규칙

- CS Area는 Production 복사 대상 아님
- `skill-market/prompt-skills/`에 직접 저장

---

## 📝 파일 명명 규칙
- 스킬 JSON: `{skill-id}.json` (kebab-case)
- 예: `blog-post-writer.json`, `data-analyzer.json`
