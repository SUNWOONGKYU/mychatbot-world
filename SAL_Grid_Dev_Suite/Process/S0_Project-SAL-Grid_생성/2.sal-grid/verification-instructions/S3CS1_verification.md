# Verification Instruction - S3CS1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

> **⚠️ 소급(Retroactive) Task 검증 안내**

---

## Task ID
S3CS1

## Task Name
스킬 프롬프트 10개 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `skill-market/prompt-skills/` 디렉토리 존재
- [ ] 디렉토리 내 JSON 파일 10개 이상 존재

### 2. JSON 구조 검증 (샘플 3개 이상 확인)
- [ ] `id` 필드 존재
- [ ] `name` 필드 존재 (한국어 또는 영어)
- [ ] `description` 필드 존재
- [ ] `prompt_template` 필드 존재
- [ ] 프롬프트 템플릿에 파라미터 변수 포함 (`{{user_input}}` 또는 동등)

### 3. 콘텐츠 품질 검증
- [ ] 프롬프트가 실제로 유용한 기능 수행 가능
- [ ] 설명이 사용자 이해 가능 수준으로 명확
- [ ] 카테고리 분류 존재

### 4. S3BA2 연동 가능성 검증
- [ ] S3BA2 Skills API에서 이 JSON 파일을 로드하는 구조와 호환 (`id` 필드로 식별)

## Test Commands
```bash
# 디렉토리 존재 및 파일 수 확인
ls skill-market/prompt-skills/*.json | wc -l

# 파일 목록
ls -la skill-market/prompt-skills/

# JSON 구조 샘플 확인 (첫 번째 파일)
cat skill-market/prompt-skills/$(ls skill-market/prompt-skills/ | head -1) | python -m json.tool

# prompt_template 필드 확인
grep -l "prompt_template" skill-market/prompt-skills/*.json | wc -l
```

## Expected Results
- `skill-market/prompt-skills/` 내 JSON 파일 10개 이상
- 표준 구조(id, name, description, prompt_template) 포함
- 프롬프트 템플릿에 파라미터 변수 포함

## Verification Agent
`qa-specialist`

## Pass Criteria
- [ ] JSON 파일 10개 이상 존재 확인
- [ ] 표준 구조 확인 (3개 이상 샘플)
- [ ] 프롬프트 품질 확인
- [ ] Blocker 없음
