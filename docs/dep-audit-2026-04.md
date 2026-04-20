# 의존성 취약점 감사 — 2026-04

> @task S9BA5
> 기준일: 2026-04-20

## 자동화 체계

### 1. CI 기반 (`.github/workflows/security.yml`)
- **주 1회**: 매주 월요일 09:00 KST
- **푸시 트리거**: `package.json` / `pnpm-lock.yaml` 변경 시
- **실패 기준**: Critical > 0 또는 High > 5
- **산출물**: `audit-report.json` (30일 보관)

### 2. Dependabot (`.github/dependabot.yml`)
- **주간 PR**: 월요일 00:00 KST
- **그룹핑**: next / react / supabase / testing 묶음 PR
- **메이저 업그레이드**: next·react 는 수동 처리 (자동 PR 제외)
- **GitHub Actions**: 월간 업그레이드

## 실행 결과 (2026-04-20 기준 — PO 실행 대기)

| Severity | 건수 | 상태 |
|----------|-----:|------|
| Critical | _ | (pnpm audit 실행 후 채움) |
| High | _ | |
| Moderate | _ | |
| Low | _ | |

## 대응 원칙

1. **Critical**: 24시간 내 패치 또는 우회 조치
2. **High**: 7일 내 업그레이드
3. **Moderate**: 월간 Dependabot PR 머지 시 해소
4. **Low**: 분기별 일괄 정리

## 수동 실행 명령

```bash
# 전체 감사
pnpm audit --audit-level=moderate

# High 이상만
pnpm audit --audit-level=high

# JSON 리포트 (CI 용)
pnpm audit --json > audit-report.json

# 자동 수정 (주의: lockfile 변경)
pnpm audit fix --audit-level=high
```

## 예외 처리

`.npmrc` 또는 `package.json` 의 `overrides` 로 특정 취약점 우회 가능 (문서화 필수):

```json
{
  "pnpm": {
    "overrides": {
      "transitive-dep@<1.2.3": ">=1.2.3"
    }
  }
}
```

예외 적용 시 본 문서 하단 "예외 기록" 섹션에 사유·만료일 기록.

## 예외 기록

| 패키지 | 사유 | 만료일 | 담당 |
|--------|------|-------|------|
| (없음) | | | |

## 외부 도구 (선택)

- **Snyk**: `snyk test` 무료 tier 월 200회 — GitHub 연동 시 PR 자동 코멘트
- **Socket.dev**: Supply chain 공격 탐지 (typosquat, malicious postinstall 등)
- **OSV-Scanner**: Google 공식 OSV DB 기반 — Go binary 단독 실행 가능

현재는 **pnpm audit + Dependabot** 조합으로 시작, 추후 Snyk/Socket 도입 검토.

## 다음 감사

- 자동: 2026-04-27 (월)
- 수동 전수: 2026-07 (Q3 초)
