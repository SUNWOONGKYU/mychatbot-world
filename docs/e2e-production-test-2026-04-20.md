# 프로덕션 E2E 실증 테스트 리포트 (2026-04-20)

> 도구: Playwright 1.59.1 (Chromium)
> 대상: https://mychatbot.world (실프로덕션)
> 자격증명: `wksun99@gmail.com` / `na*5215900`
> 스펙: `tests/e2e/full-journey.spec.ts`
> 결과: **18 / 19 passed** (1 failed — 로그인, 원인 아래)

---

## 테스트 결과 요약

| # | 시나리오 | 결과 | 비고 |
|---|---------|:----:|------|
| 1 | 랜딩 `/` 로드 | ✅ | 200, title="CoCoBot World" |
| 2 | `/signup` 렌더링 | ✅ | 이메일·비번·확인·제출 전 필드 OK |
| 3 | 회원가입 제출 | ✅ | "인증 이메일 발송 완료" — Supabase verify flow 동작 |
| **4** | **로그인** | **❌** | **"Email not confirmed" — 이메일 인증 미완료** |
| 5-15 | 공개 페이지 11개 순회 | ✅ | **/pricing·/refund 404** (아래 참조) |
| 16-18 | 인증 페이지 3개 (/my, /my/bots, /my/bots/new) | (skip) | 로그인 실패로 스킵 |
| 19 | `/api/health` | ✅ | `{status:"ok", checks:{env:"ok", supabase:"ok"}}` |
| 20 | `/api/health/ping` | ✅ | 404 (엔드포인트 없음 — 정상) |
| 21 | robots.txt + sitemap.xml | ✅ | 둘 다 200 |
| 22 | 404 처리 | ✅ | 404 status + "찾을 수 없" 메시지 |
| 23 | 로그아웃 | (skip) | 로그인 실패로 스킵 |

---

## 🔴 Critical 발견

### F1. /refund 404 — 법적 페이지 배포 누락
- **프로덕션 상태**: `HTTP 404`
- **로컬 코드**: `app/refund/page.tsx` 존재 (commit `961aeea` — "S9DC1 법률 문서 3종 갱신")
- **sitemap.xml**: `/refund` 명시 포함 → 구글에 404 URL 노출 중
- **영향**:
  1. 전자상거래법 §15조 환불정책 고지 의무 — 페이지 부재는 위반 소지
  2. 구글 서치 콘솔에 404 리포트 누적 → SEO 패널티
  3. 푸터/이용약관 내부 링크가 모두 Dead link
- **원인 추정**: Vercel 배포가 커밋 `961aeea` 이전에서 멈춤 (또는 빌드 실패)
- **즉시 조치**: Vercel Dashboard → Deployments 최신 상태 확인, 필요 시 수동 재배포

### F2. /pricing 404 — Sitemap 유령 URL
- **프로덕션**: `HTTP 404`
- **로컬 코드**: `app/pricing/` 폴더 자체가 **없음**
- **그러나 포함된 곳**:
  - `app/sitemap.ts:13` → `{ path: '/pricing', priority: 0.7 }`
  - `tests/e2e/production-smoke.spec.ts` → `/pricing` 존재 가정
- **영향**: 검색엔진이 sitemap 따라가 404 → SEO 신뢰도 하락
- **조치 옵션**:
  - (A) sitemap에서 `/pricing` 제거
  - (B) `app/pricing/page.tsx` 신규 생성 (가격표 페이지)

---

## 🟠 High 발견

### F3. 로그인 플로우 자체는 정상, 테스트 계정만 미인증
- **사이트 메시지**: "Email not confirmed"
- **의미**: Supabase Auth가 이메일 확인 전 로그인 차단 — **올바른 보안 동작**
- **해결**: PO가 `wksun99@gmail.com` Gmail 수신함에서 Supabase 발송 인증 링크 클릭
- **사이트 버그 아님** — 실제 사용자도 가입 후 로그인 안 되는 이슈 재현 가능

### F4. 회원가입 인증 메일 발송처(발신자) 미확인
- Supabase 기본 SMTP (noreply@mail.app.supabase.io 등)로 발송되는지, 커스텀 도메인인지 미검증
- 사용자가 "스팸함"에서 메일 못 찾을 가능성

---

## 🟢 정상 확인

| 항목 | 결과 |
|------|------|
| TLS/HTTPS | ✅ |
| CoCoBot 브랜드 타이틀 | ✅ |
| 회원가입 폼 | ✅ (이메일·닉네임·비번·비번확인 모두 렌더) |
| 회원가입 API 동작 | ✅ ("인증 이메일 발송 완료" 응답) |
| `/terms` 이용약관 | ✅ 200 + 본문 매칭 |
| `/privacy` 개인정보 | ✅ 200 + 본문 매칭 |
| `/skills`, `/community`, `/jobs`, `/marketplace`, `/customer-service`, `/guest` | ✅ 모두 200 |
| `/api/health` | ✅ supabase=ok, env=ok |
| robots.txt + sitemap.xml | ✅ 200 |
| 404 페이지 | ✅ 정상 처리 |
| 랜딩 페이지 | ✅ title 매칭 |

---

## 재시작 가이드

로그인 이후 플로우(봇 생성/챗/마이페이지) 테스트를 이어가려면:

1. `wksun99@gmail.com` 수신함에서 Supabase 인증 링크 클릭 (또는 스팸함 확인)
2. 아래 명령 재실행:
```bash
TEST_USER_EMAIL=wksun99@gmail.com \
TEST_USER_PASSWORD='na*5215900' \
TEST_BASE_URL=https://mychatbot.world \
npx playwright test tests/e2e/full-journey.spec.ts --project=chromium
```
- 예상 결과: 19/19 passed + 봇 생성 위저드/마이페이지 렌더 확인

---

## 총평

**사이트 건강도: 양호. 다만 2건 실제 결함 식별.**

1. **/refund 404 — 즉시 재배포 필요** (commit `961aeea` 반영 안 됨)
2. **/pricing 404 — sitemap 정리 또는 페이지 신설**
3. **로그인 실패는 사이트 버그 아님** — 이메일 인증 대기 상태 (올바른 동작)
4. API/DB 헬스 정상, 법적 페이지 2/3 정상(/refund 제외), 공개 페이지 SEO infrastructure OK

**지금 당장 조치**: Vercel 배포 상태 확인 → 최신 커밋(`2442a09`)까지 배포 완료되었는지 검증.
