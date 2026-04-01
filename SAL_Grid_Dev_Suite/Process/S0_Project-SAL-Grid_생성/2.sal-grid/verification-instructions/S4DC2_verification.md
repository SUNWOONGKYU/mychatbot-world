# Verification Instruction - S4DC2

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
S4DC2

## Task Name
API 문서 완성

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Documentation/docs/api/openapi.yaml` 존재
- [ ] `Process/S4_개발_마무리/Documentation/docs/api/authentication.md` 존재
- [ ] `Process/S4_개발_마무리/Documentation/docs/api/error-codes.md` 존재

### 2. OpenAPI 스펙 검증 (`openapi.yaml`)
- [ ] `openapi: 3.0.3` 또는 `3.0.x` 버전 선언
- [ ] `info` 섹션: title, version, description 포함
- [ ] `servers` 섹션 존재
- [ ] `BearerAuth` 보안 스킴 정의
- [ ] `/api/revenue` 관련 엔드포인트 스펙 포함 (최소 3개)
- [ ] `/api/payment` 관련 엔드포인트 스펙 포함 (최소 3개)
- [ ] `/api/inheritance` 관련 엔드포인트 스펙 포함 (최소 3개)
- [ ] 각 엔드포인트에 `200`, `401` 응답 스키마 포함
- [ ] `example` 필드 존재 (최소 절반 이상)
- [ ] YAML 문법 오류 없음

### 3. 인증 가이드 검증 (`authentication.md`)
- [ ] JWT Bearer Token 설명 존재
- [ ] 토큰 발급 방법 설명 존재
- [ ] `Authorization: Bearer {token}` 헤더 예시 포함
- [ ] cURL 예제 코드 포함
- [ ] JavaScript 예제 코드 포함
- [ ] 토큰 만료(401) 처리 방법 설명 존재

### 4. 에러 코드표 검증 (`error-codes.md`)
- [ ] 에러 코드 15개 이상 정의
- [ ] 에러 코드 명명 규칙 일관성 (`AUTH_`, `PAY_`, `INH_` 등 prefix)
- [ ] HTTP 상태 코드 매핑 존재
- [ ] 에러 응답 공통 형식 예시 포함
- [ ] PAY_001 (크레딧 부족), INH_001 (중복 처리) 등 핵심 에러 포함

### 5. 통합 검증
- [ ] S4BA1, S4BA2, S4BA3 API 스펙이 실제 구현과 일치

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Documentation/docs/api/"

# OpenAPI 버전 확인
grep "^openapi:" "Process/S4_개발_마무리/Documentation/docs/api/openapi.yaml"

# 엔드포인트 수 확인
grep -c "^  /api/" "Process/S4_개발_마무리/Documentation/docs/api/openapi.yaml"

# 에러 코드 수 확인 (최소 15개)
grep -c "^| \`[A-Z]" "Process/S4_개발_마무리/Documentation/docs/api/error-codes.md"

# YAML 문법 검사 (선택)
npx @redocly/cli lint "Process/S4_개발_마무리/Documentation/docs/api/openapi.yaml"
```

## Expected Results
- 3개 파일이 모두 존재한다
- `openapi.yaml`이 OpenAPI 3.0.x 형식이다
- 수익/결제/피상속 API 스펙이 모두 포함된다
- 에러 코드가 15개 이상 정의된다
- cURL/JS 인증 예제가 존재한다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] OpenAPI 3.0.x 형식 확인
- [ ] 에러 코드 15개 이상 확인
- [ ] 인증 예제 코드(cURL/JS) 포함 확인
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 문서가 `S4_개발_마무리/Documentation/`에 저장되었는가?
- [ ] Documentation Area는 Production 자동 복사 대상이 아님을 확인
