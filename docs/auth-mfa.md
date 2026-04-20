# Supabase Auth MFA (TOTP) — CoCoBot World

> @task S8SC2 — 관리자/Creator 계정에 2FA 강제

## 목표

- **관리자 계정**: MFA 필수 (미설정 시 대시보드 접근 차단)
- **일반 사용자**: 선택 (설정 페이지에서 활성화)
- **Creator (수익화 활성 Bot 소유자)**: 강력 권고

## Supabase 측 활성화 (PO 수행)

### 1. Dashboard 설정

```
Supabase Dashboard → Authentication → Providers → MFA
  ✅ Enable TOTP factors
  Max factors per user: 10
```

### 2. 앱 측 UI (점진 구현)

- `app/settings/security/page.tsx` (신규 예정)
  - "Enable 2FA" 버튼 → `supabase.auth.mfa.enroll({ factorType: 'totp' })`
  - QR 코드 표시 → Authy/Google Authenticator 로 스캔
  - 6자리 코드 입력 → `supabase.auth.mfa.challenge` + `verify`
  - 성공 시 `mcw_users.mfa_enabled = true` 업데이트

- Login 흐름
  - 로그인 후 `aal2` 필요 시 `supabase.auth.mfa.challenge({ factorId })` 요구
  - 6자리 입력 → `verify` → 세션 upgrade

### 3. 관리자 강제 (라우트 가드)

`lib/admin-auth.ts` 의 `verifyAdminUser()` 에서:

```ts
const { data: { user } } = await supabase.auth.getUser();
const aal = user?.factors?.find(f => f.factor_type === 'totp' && f.status === 'verified');
if (!aal) {
  return { ok: false, error: 'Admin requires MFA (TOTP)' };
}
```

## Origin 검증 (이미 구현)

`middleware.ts` — 모든 `/api/*` 상태 변경 요청(POST/PATCH/PUT/DELETE)은:
1. `Origin` 또는 `Referer` 헤더가 허용 목록에 있어야 함
2. 허용 origin: `mychatbot.world`, `*.vercel.app`, localhost(dev)
3. 예외: `/api/auth/callback`, `/api/webhooks/`, `/api/og`
4. `X-Admin-Key` 헤더 있으면 생략 (서버간 통신)

위반 시 403 반환.

## 백업 코드

TOTP 기기 분실 대비:
- Supabase 는 backup codes 직접 제공 안 함
- 권장: MFA 활성 시 recovery email 에 일회용 reset 코드 발송 + `mcw_users.mfa_recovery_email_sent_at` 기록
- Reset 경로: `/settings/security/mfa-reset` — 관리자 승인 후 MFA factor 삭제

## 운영 가이드

- 관리자 MFA 활성화: on-call.md 에 명시
- 분실 대응: `docs/runbooks/incident-response.md` 의 계정 복구 섹션
- MFA 우회 시도 감지: Axiom 쿼리 `level=warn message~"MFA challenge failed"`

## PO 체크리스트

- [ ] Supabase MFA TOTP 활성화
- [ ] `app/settings/security/page.tsx` 구현 (별도 태스크)
- [ ] 관리자 계정 MFA 강제 코드 추가 (`lib/admin-auth.ts`)
- [ ] `mcw_users` 스키마에 `mfa_enabled`, `mfa_enforced_at` 컬럼 추가
- [ ] 관리자 전원 MFA 등록 (데드라인 공지)
- [x] Origin 검증 미들웨어 — **완료** (`middleware.ts`)

## 관련

- Secret rotation: `docs/secret-rotation.md`
- Incident response: `docs/runbooks/incident-response.md`
- Admin auth: `lib/admin-auth.ts` (MFA 강제 로직 추가 지점)
