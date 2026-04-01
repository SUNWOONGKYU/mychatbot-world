# Verification Instruction - S3CS2

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
S3CS2

## Task Name
스킬 인테그레이션 4개 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `skill-market/integration-skills/` 디렉토리 존재
- [ ] 디렉토리 내 JSON 파일 4개 이상 존재

### 2. JSON 구조 검증 (모든 파일)
- [ ] `id` 필드 존재
- [ ] `name` 필드 존재
- [ ] `integration_type` 필드 존재 (연동 서비스 식별)
- [ ] `api_endpoint` 또는 `service_action` 필드 존재
- [ ] `parameters` 배열 존재

### 3. 다양성 검증
- [ ] 4개 파일이 서로 다른 외부 서비스를 커버
- [ ] 각 파일의 `integration_type` 값이 고유

### 4. 콘텐츠 품질 검증
- [ ] 파라미터 정의가 실제 API와 일치 (대략적으로)
- [ ] 인증 방식(`auth_type`) 명시

### 5. S3BA8 연동 호환성
- [ ] `id` 필드로 `skill-integrations.js`에서 로드 가능한 구조

## Test Commands
```bash
# 디렉토리 존재 및 파일 수 확인
ls skill-market/integration-skills/*.json | wc -l

# 파일 목록
ls -la skill-market/integration-skills/

# JSON 구조 샘플 확인
cat skill-market/integration-skills/$(ls skill-market/integration-skills/ | head -1) | python -m json.tool

# integration_type 다양성 확인
grep -h "integration_type" skill-market/integration-skills/*.json | sort | uniq
```

## Expected Results
- `skill-market/integration-skills/` 내 JSON 파일 4개
- 각 파일 표준 구조 포함
- 4개가 서로 다른 외부 서비스 커버

## Verification Agent
`qa-specialist`

## Pass Criteria
- [ ] JSON 파일 4개 존재 확인
- [ ] 표준 구조 확인 (모든 파일)
- [ ] 서로 다른 외부 서비스 4개 확인
- [ ] Blocker 없음
