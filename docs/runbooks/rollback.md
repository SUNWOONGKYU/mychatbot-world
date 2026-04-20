# Rollback Runbook — CoCoBot World

> @task S8DC2 — 배포 롤백 절차

## 언제 롤백하는가

다음 중 하나라도 해당하면 즉시 롤백:

- `/api/health` 가 `degraded` 로 전환 (env 또는 Supabase 연결 실패 원인이 **배포와 관련**)
- 공개 페이지 3개 이상 500/502/503
- Vercel Functions 에러율 > 5% (baseline ~ 0.1%)
- 결제/크레딧 API 에 이중 차감·분실 징후
- 치명적 보안 이슈 (토큰 노출, RLS 우회)

## 롤백 방법

### 방법 A — Vercel Dashboard (권장, 가장 빠름)

```
1. https://vercel.com/<team>/mychatbot-world/deployments
2. 직전 안정 배포 찾기 (상태: Ready, 커밋 SHA 확인)
3. ⋯ 메뉴 → "Promote to Production"
4. 확인 → 10초 이내 전환 완료
5. https://mychatbot.world/api/health 로 확인
```

### 방법 B — Vercel CLI

```bash
# 최근 배포 목록
npx vercel list mychatbot-world

# 특정 배포 URL 을 프로덕션으로 승격
npx vercel promote <DEPLOYMENT_URL> --yes
```

### 방법 C — Git revert (코드 레벨)

데이터 마이그레이션이 관련되어 있으면 Vercel 롤백만으로는 부족할 수 있음:

```bash
git log --oneline -10
git revert <bad-commit-sha> --no-edit
git push origin main
# Vercel 자동 배포 (2~5분)
```

## 롤백 후 반드시 할 일

### 1. 상태 확인

```bash
curl -sS https://mychatbot.world/api/health?v=$(date +%s)
# status = "ok" 확인
```

### 2. DB 스키마 호환성 확인

이전 코드가 새 스키마를 사용하고 있었다면:

- **신규 컬럼 추가** → 롤백해도 문제없음 (구 코드는 무시)
- **컬럼 타입 변경** → 구 코드가 깨질 수 있음 → 스키마도 같이 롤백 필요
- **신규 RPC 함수** → 구 코드는 호출 안 하므로 무해
- **기존 함수 시그니처 변경** → 구 코드가 구 시그니처로 호출 → 같이 롤백 필요

### 3. 사용자 커뮤니케이션

5분 이상 영향 있었으면 `/customer-service` 배너 또는 공지로 안내.

### 4. 사후 분석

`incident-response.md` 의 postmortem 절차에 따라 24h 이내 기록.

## 절대 금지

- ❌ `git push --force origin main` (다른 사람 작업 덮어쓰기)
- ❌ `git reset --hard <old-sha>` 후 force push (커밋 이력 파괴)
- ❌ Supabase 에서 `DROP TABLE` / `TRUNCATE` 로 데이터 롤백 (PITR 사용)
- ❌ 서비스 중단 통지 없이 30분+ 롤백 처리

## Vercel 롤백 체크리스트 (SEV1)

- [ ] 장애 탐지 시각: ____________
- [ ] 롤백 시작 시각: ____________
- [ ] 롤백 타겟 커밋: ____________
- [ ] `/api/health` OK 확인 시각: ____________
- [ ] 공개 페이지 200 확인 시각: ____________
- [ ] 총 장애 시간: ____________
- [ ] Postmortem 예정일: ____________ (24h 이내)
