# Task Instruction - S1DV1

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

## Task ID
S1DV1

## Task Name
CI/CD + Pre-commit Hook (소급)

## Task Goal
Git Pre-commit Hook을 통해 Stage 폴더의 코드를 루트 폴더로 자동 동기화하는 파이프라인이 구축된 상태를 문서화한다. 이 Task는 이미 구현 완료되어 소급 등록된 항목이다.

## Prerequisites (Dependencies)
- S1BI1 (Next.js 프로젝트 초기화) — 소급 완료된 상태

## Specific Instructions

### 1. 기존 구현 내용 확인 (소급)
아래 파일들이 실제로 존재하는지 확인한다:

```
scripts/sync-to-root.cjs     ← Stage → Root 동기화 스크립트
.git/hooks/pre-commit         ← Git Pre-commit Hook
```

### 2. scripts/sync-to-root.cjs 동작 확인

이 스크립트는 `Process/S?_*/` 하위의 코드를 루트 폴더에 동기화한다:

```js
/**
 * @task S1DV1
 * @description Stage → Root 자동 동기화 스크립트
 */
// Stage → Root 매핑 규칙:
// Process/S?_*/Frontend/         → pages/
// Process/S?_*/Backend_APIs/     → api/Backend_APIs/
// Process/S?_*/Security/         → api/Security/
// Process/S?_*/Backend_Infra/    → api/Backend_Infra/
// Process/S?_*/External/         → api/External/
```

주요 기능:
- Stage 폴더 스캔 (glob 패턴으로 파일 탐색)
- 수정된 파일만 루트 폴더에 복사 (증분 동기화)
- 복사 결과 로그 출력
- 에러 발생 시 exit code 1 반환 (커밋 중단)

### 3. .git/hooks/pre-commit 확인

```bash
#!/bin/sh
echo "Stage → Root 동기화 중..."

node scripts/sync-to-root.cjs

if [ $? -ne 0 ]; then
    echo "동기화 실패! 커밋을 중단합니다."
    exit 1
fi

echo "동기화 완료!"
```

실행 권한 확인:
```bash
ls -la .git/hooks/pre-commit
# -rwxr-xr-x 상태여야 함
```

### 4. 동기화 테스트
Pre-commit Hook 정상 동작 확인:

```bash
# 테스트 파일 생성
echo "test" > Process/S1_개발_준비/Backend_Infra/test-file.js

# 커밋 시도 (Pre-commit Hook 실행)
git add Process/S1_개발_준비/Backend_Infra/test-file.js
git commit -m "test: Pre-commit Hook 테스트"

# 루트에 복사되었는지 확인
ls api/Backend_Infra/test-file.js

# 테스트 파일 삭제
rm Process/S1_개발_준비/Backend_Infra/test-file.js
rm api/Backend_Infra/test-file.js
```

### 5. .gitignore 확인
```
node_modules/
.next/
.env.local
*.log
```

## Expected Output Files
- `scripts/sync-to-root.cjs` (기존 파일 확인)
- `.git/hooks/pre-commit` (기존 파일 확인 — Git 추적 외)

## Completion Criteria
- [ ] `scripts/sync-to-root.cjs` 존재 및 실행 가능
- [ ] `.git/hooks/pre-commit` 존재 및 실행 권한 설정
- [ ] Stage 폴더 파일 변경 후 `git commit` 시 루트 폴더 자동 복사 확인
- [ ] 동기화 실패 시 커밋 중단 동작 확인

## Tech Stack
- Node.js (CJS)
- Git Hooks
- Bash Shell

## Tools
- git
- node

## Execution Type
AI-Only

## Remarks
- 이 Task는 소급(Retroactive) 등록 항목 — 이미 구현 완료
- `.git/hooks/pre-commit`은 Git이 추적하지 않음 (`.git/` 내부)
- 팀원 합류 시 Hook 재설치 필요 (`node scripts/setup-hooks.js` 또는 husky 전환 고려)
- `sync-to-root.cjs`는 CJS 형식 (ESM 혼용 방지)

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1DV1 → `Process/S1_개발_준비/DevOps/`

### 제2 규칙: Production 코드는 이중 저장
- DV Area는 Production 저장 대상 아님
- `scripts/sync-to-root.cjs`는 `scripts/` 폴더에만 존재
