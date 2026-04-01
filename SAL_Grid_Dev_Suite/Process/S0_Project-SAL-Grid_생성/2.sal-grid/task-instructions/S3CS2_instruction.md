# Task Instruction - S3CS2

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

# Task Instruction - S3CS2

## Task ID
S3CS2

## Task Name
스킬 인테그레이션 4개 (소급)

## Task Goal
이미 작성된 인테그레이션 스킬 JSON 파일 4개(`skill-market/integration-skills/`)를 SAL Grid에 소급 등록한다. GitHub, Slack, Google Workspace 등 외부 서비스와 연동하는 스킬의 구조와 품질을 검토하고 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인 (4개)
`skill-market/integration-skills/` 디렉토리에서 JSON 파일 목록 확인:

예상 인테그레이션 스킬:
- GitHub 연동 스킬 (이슈 생성, PR 요약 등)
- Slack 연동 스킬 (메시지 전송, 채널 알림 등)
- Google Calendar 연동 스킬 (일정 조회, 생성 등)
- Notion 또는 기타 외부 서비스 연동 스킬

### 2. 인테그레이션 스킬 JSON 구조 확인

```json
{
  "id": "github-issue-creator",
  "name": "GitHub 이슈 생성",
  "description": "자연어로 GitHub 이슈를 생성합니다",
  "category": "integration",
  "integration_type": "github",
  "api_endpoint": "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
  "auth_type": "oauth",
  "parameters": [
    { "name": "owner", "type": "string", "required": true },
    { "name": "repo", "type": "string", "required": true },
    { "name": "title", "type": "string", "required": true },
    { "name": "body", "type": "string", "required": false }
  ],
  "prompt_template": "다음 내용으로 GitHub 이슈를 생성합니다: {{title}}",
  "price": 0,
  "is_free": true
}
```

### 3. 품질 검토
- API 엔드포인트 정의 명확성
- 필수 파라미터 정의 완전성
- 인증 방식(auth_type) 명확성
- 4개 스킬이 서로 다른 외부 서비스를 커버하는지 확인

### 4. S3BA8 연동 가능성 확인
- `api/skill-integrations.js`에서 이 JSON 파일을 로드하는 구조와 호환 여부

## Expected Output Files
- `skill-market/integration-skills/*.json` (4개)

## Completion Criteria
- [ ] `skill-market/integration-skills/` 디렉토리에 4개 JSON 파일 존재
- [ ] 각 파일이 `id`, `name`, `integration_type`, `api_endpoint`, `parameters` 포함
- [ ] 4개가 서로 다른 외부 서비스를 커버
- [ ] Grid JSON 파일 상태 업데이트 (Completed, Verified)

## Tech Stack
- JSON (데이터 파일)
- 외부 API 연동 정의

## Tools
- 없음 (콘텐츠 파일)

## Task Agent
`content-specialist`

## Verification Agent
`qa-specialist`

## Execution Type
AI-Only

## Remarks
- 인테그레이션 스킬은 실제 외부 API 호출을 정의하므로 OAuth 인증 흐름 고려 필요
- 실제 실행은 S3BA2(Skills API) 또는 S3BA8(`skill-integrations.js`)에서 처리
- 4개가 없는 경우 기본 구조로 추가 생성

---

## ⚠️ 작업 결과물 저장 규칙

- CS Area는 Production 복사 대상 아님
- `skill-market/integration-skills/`에 직접 저장

---

## 📝 파일 명명 규칙
- 인테그레이션 스킬 JSON: `{service}-{action}.json`
- 예: `github-issue-creator.json`, `slack-notifier.json`
