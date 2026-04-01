# Verification Instruction - S1DV1

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
S1DV1

## Task Name
CI/CD + Pre-commit Hook (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `scripts/sync-to-root.cjs` 존재
- [ ] `.git/hooks/pre-commit` 존재
- [ ] `.git/hooks/pre-commit` 실행 권한 확인 (`-rwxr-xr-x`)

### 2. 스크립트 내용 검증
- [ ] `sync-to-root.cjs`에 Stage → Root 매핑 규칙 포함
- [ ] FE → `pages/` 매핑 존재
- [ ] BA → `api/Backend_APIs/` 매핑 존재
- [ ] SC → `api/Security/` 매핑 존재
- [ ] BI → `api/Backend_Infra/` 매핑 존재
- [ ] EX → `api/External/` 매핑 존재
- [ ] 에러 발생 시 `process.exit(1)` 호출

### 3. Pre-commit Hook 검증
- [ ] Hook 파일이 `node scripts/sync-to-root.cjs` 호출
- [ ] 스크립트 실패 시 `exit 1` 반환 (커밋 중단)
- [ ] 파일 시작이 `#!/bin/sh` 셔뱅

### 4. 동작 검증 (통합 테스트)
- [ ] Stage 폴더에 테스트 파일 생성 후 `git commit` 시 루트에 자동 복사됨
- [ ] 루트의 기존 파일이 Stage 파일 변경 시 업데이트됨
- [ ] DC, DS, DB, TS Area 파일은 복사 대상에서 제외됨

### 5. 오류 처리 검증
- [ ] `sync-to-root.cjs` 직접 실행 시 오류 없이 완료 (`node scripts/sync-to-root.cjs`)
- [ ] 존재하지 않는 대상 폴더 생성 처리 (디렉토리 없어도 오류 없음)

### 6. 통합 검증
- [ ] S1BI1의 `scripts/` 폴더 구조와 일치
- [ ] `package.json`의 빌드 스크립트와 충돌 없음
- [ ] Next.js 빌드 결과 (`/.next/`)는 동기화에서 제외됨

### 7. 저장 위치 검증
- [ ] `Process/S1_개발_준비/DevOps/`에 Hook 설정 문서 저장됨
- [ ] `scripts/sync-to-root.cjs`가 프로젝트 루트 `scripts/` 폴더에 존재

## Test Commands
```bash
# 파일 존재 및 권한 확인
ls -la .git/hooks/pre-commit
ls scripts/sync-to-root.cjs

# 셔뱅 확인
head -1 .git/hooks/pre-commit

# 스크립트 직접 실행 테스트
node scripts/sync-to-root.cjs
echo "Exit code: $?"

# 통합 테스트 — Stage 파일 생성 후 커밋
echo "// test" > Process/S1_개발_준비/Backend_Infra/test-sync.js
git add Process/S1_개발_준비/Backend_Infra/test-sync.js
git commit -m "test: sync hook 검증"
ls api/Backend_Infra/test-sync.js  # 자동 복사 확인
# 테스트 파일 정리
git rm Process/S1_개발_준비/Backend_Infra/test-sync.js api/Backend_Infra/test-sync.js
git commit -m "test: sync hook 검증 파일 정리"
```

## Expected Results
- `ls -la .git/hooks/pre-commit` → 실행 권한 포함 (`-rwxr-xr-x`)
- `node scripts/sync-to-root.cjs` → exit code 0
- Stage 폴더 파일 커밋 시 루트 폴더에 자동 복사됨

## Verification Agent
devops-troubleshooter-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] Stage → Root 동기화 정상 동작
- [ ] Pre-commit Hook 실행 확인
- [ ] Blocker 없음
