# Verification Instruction - S1DC1

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
S1DC1

## Task Name
API 문서 초안 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `docs/api/README.md` 존재
- [ ] `docs/api/openapi-template.yaml` 존재
- [ ] `docs/api/` 디렉토리 존재

### 2. README.md 내용 검증
- [ ] API 버전 정보 포함
- [ ] Base URL 정의됨
- [ ] 인증 방식 (Supabase JWT / Bearer Token) 설명됨
- [ ] 챗봇 관리 엔드포인트 (`/bots`) 목록 포함
- [ ] 대화 처리 엔드포인트 (`/chat`) 목록 포함
- [ ] 외부 연동 엔드포인트 (`/telegram`) 포함
- [ ] 테이블 형식 또는 목록 형식으로 정리됨

### 3. OpenAPI YAML 검증
- [ ] 유효한 YAML 형식 (파싱 성공)
- [ ] `openapi: 3.0.x` 버전 명시됨
- [ ] `info.title`, `info.version` 포함됨
- [ ] `servers` 섹션 존재
- [ ] `security` 섹션 (BearerAuth) 존재
- [ ] `components.schemas`에 `Bot` 스키마 정의됨
- [ ] `components.schemas`에 `Error` 스키마 정의됨
- [ ] `paths./bots` 경로 정의됨
- [ ] `paths./chat` 경로 정의됨

### 4. 내용 완성도 검증
- [ ] `@task S1DC1` 주석이 YAML 파일 상단에 포함됨
- [ ] 각 엔드포인트에 응답 코드 (`200`, `401`, `500`) 정의됨
- [ ] 요청 본문 스키마 (`requestBody`) 정의됨 (POST 엔드포인트)
- [ ] 필수 필드 (`required`) 명시됨

### 5. 문서-코드 일관성 검증
- [ ] README의 엔드포인트 목록이 실제 `api/` 폴더 파일과 일치 (S1EX1: `/telegram` 등)
- [ ] OpenAPI의 `Bot` 스키마가 S1DB1의 `mcw_bots` 테이블 컬럼과 일치
- [ ] 인증 방식이 S1SC1의 Supabase Auth 구현과 일치

### 6. 통합 검증
- [ ] `docs/` 폴더가 프로젝트 루트에 존재
- [ ] Git에서 `docs/` 폴더가 추적됨 (`.gitignore`에서 제외되지 않음)

### 7. 저장 위치 검증
- [ ] `Process/S1_개발_준비/Documentation/`에 API 문서 원본 저장됨

## Test Commands
```bash
# 파일 존재 확인
ls docs/api/README.md docs/api/openapi-template.yaml

# YAML 유효성 확인 (Node.js)
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
try {
  yaml.load(fs.readFileSync('docs/api/openapi-template.yaml', 'utf8'));
  console.log('PASS: YAML valid');
} catch(e) {
  console.log('FAIL:', e.message);
}
"

# README 엔드포인트 수 확인
grep -c "| GET\|| POST\|| PUT\|| DELETE\|| PATCH" docs/api/README.md

# Git 추적 상태 확인
git ls-files docs/

# openapi 버전 확인
head -5 docs/api/openapi-template.yaml
```

## Expected Results
- 2개 파일 존재
- YAML 파싱 성공 (PASS)
- README에 10개 이상의 엔드포인트 메서드 행 (`| GET | ...` 등) 존재
- `git ls-files docs/` 출력에 2개 파일 포함
- YAML 파일 상단에 `openapi: 3.0.x` 존재

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] YAML 유효성 검사 통과
- [ ] 주요 엔드포인트 문서화됨
- [ ] 문서-코드 일관성 확인
- [ ] Blocker 없음
