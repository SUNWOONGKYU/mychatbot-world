# Pre-commit Hook 자동화 목록

> git commit 실행 시 자동으로 실행되는 3가지 자동화

---

## 자동화 항목 (3개)

| # | 자동화 내용 | 소스 파일 | 출력 파일 |
|---|------------|----------|----------|
| 1 | SAL Grid 매뉴얼 MD → HTML 변환 | `Process/S0_.../manual/PROJECT_SAL_GRID_MANUAL.md` | `참고자료/*.html` |
| 2 | P0~S5 진행률 → JSON 생성 | `Process/P0~S5 폴더`, `index.json + grid_records/*.json` | `Process_Monitor/data/phase_progress.json` |
| 3 | Stage 폴더 → 배포 폴더 자동 복사 | `Process/S?_*/Frontend/`, `Process/S?_*/Backend_APIs/` 등 | `pages/`, `api/` |

---

## 스크립트 위치

**루트 scripts/ 폴더:**

| # | 스크립트 | 담당 |
|---|---------|------|
| 1-2 | `build-web-assets.js` | 1~2번 통합 실행 |
| 3 | `sync-to-root.js` | Stage → Root 자동 복사 |

---

## Stage → Root 매핑 (3번 자동화)

| Area | Stage 폴더 | Root 폴더 |
|------|-----------|----------|
| F | `Process/S?_*/Frontend/` | `pages/` |
| BA | `Process/S?_*/Backend_APIs/` | `api/Backend_APIs/` |
| S | `Process/S?_*/Security/` | `api/Security/` |
| BI | `Process/S?_*/Backend_Infra/` | `api/Backend_Infra/` |
| E | `Process/S?_*/External/` | `api/External/` |

---

## Pre-commit Hook 설정

**Hook 파일:** `.git/hooks/pre-commit`

```bash
#!/bin/sh
echo "🔄 Pre-commit Hook 실행 중..."

# 1-2번: 웹 자산 빌드 + 진행률 JSON 생성
node scripts/build-web-assets.js
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패!"
    exit 1
fi

# 3번: Stage → Root 동기화
node scripts/sync-to-root.js
if [ $? -ne 0 ]; then
    echo "❌ 동기화 실패!"
    exit 1
fi

# 변경된 파일 스테이징
git add -A

echo "✅ Pre-commit Hook 완료!"
```

---

## 관련 문서

- 저장 위치 규칙: `.claude/rules/02_save-location.md`
- SAL Grid 매뉴얼: `Process/S0_Project-SAL-Grid_생성/manual/PROJECT_SAL_GRID_MANUAL.md`
