# 프로덕션 긴급 감사 리포트 (2026-04-20)

> PO 지시: "현재 프로덕션으로 운영 중 — 문제될 만한 사항 전부 찾아라"
> 범위: 실제 코드베이스 (app/, lib/, components/, middleware.ts, next.config.mjs, supabase/)
> 기준: MBO 체크리스트가 아닌 **실제 운영 리스크**만

---

## 🔴 CRITICAL — 즉시 조치 (런칭 상태 유지 위험)

### C1. 법률 공시 정보 미기재 (전자상거래법 위반)
- **파일**: `app/terms/page.tsx:242-244`
- **현재 문구**:
  ```
  사업자등록번호: (등록 시 기재)
  대표자: (기재)
  통신판매업 신고번호: (신고 후 기재)
  주소: (기재)
  ```
- **리스크**: 전자상거래법 §13조 위반. 결제 기능을 제공하면서 공시 의무 미이행 시 공정위 과태료 + 소비자 민원 근거.
- **차단 수준**: 결제 기능이 가동 중이라면 **즉시 차단 또는 정보 기재** 둘 중 하나 필수.
- **조치 옵션**:
  - (A) 실제 사업자등록·통신판매업신고 완료 → 번호 기재
  - (B) 미완료 상태라면 `/api/payments` 라우트 일시 비활성 + 결제 UI 숨김

### C2. 관리자 API 키 타이밍 공격 여지 (부분 완화됨)
- **파일**: `lib/admin-auth.ts:29-31`
- **현재 코드**: 길이 선검사(29행) + `provided === adminKey`(31행)
- **평가**: 길이 체크 덕분에 실용적 공격 난이도는 매우 높음. 그러나 동일 길이 내에서는 비상수 시간 비교.
- **조치**: `crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(adminKey))`로 교체 (Node 내장, 의존성 없음)
- **추가 확인**: `middleware.ts`, `app/api/payments/confirm/route.ts`에도 동일 패턴 있는지 grep 필요

---

## 🟠 HIGH — 1주일 내 조치

### H1. 결제 상태 전이 레이스 컨디션
- **파일**: `app/api/admin/payments/route.ts:166-214`
- **패턴**: `SELECT status` → `UPDATE status='completed'` → `CALL add_credits_tx` (3단계 비원자적)
- **리스크**: 관리자가 동일 paymentId PATCH를 동시 2회 요청 시 크레딧 이중 지급 가능성 (실제 발생 확률은 낮으나 금전 이슈)
- **완화책 권고**: Supabase RPC 하나로 `atomic_approve_payment(payment_id)` 래핑 (SELECT...FOR UPDATE + UPDATE + credit insert)

### H2. 사용자당 결제 생성 Rate Limit 없음
- **파일**: `app/api/payments/route.ts` (POST 엔드포인트)
- **리스크**: 악성 사용자가 pending 결제를 대량 생성해 관리자 대시보드 플러딩
- **조치**: 사용자당 24시간 결제 생성 ≤10건 쿼터

### H3. `/api/chat` 사용자 메시지 중복 기록 가능성
- **파일**: `app/api/chat/route.ts:626-637`
- **패턴**: 네트워크 단절 시 클라이언트 재시도 → 동일 user message 2회 저장
- **리스크**: 채팅 로그 중복 + 크레딧 이중 차감 가능성
- **조치**: 클라이언트에 `message_id` UUID 생성 → 서버에서 unique 제약으로 멱등 처리

### H4. 법률 페이지 이메일 작동 확인 미수행
- **파일**: `app/privacy/page.tsx` (privacy@mychatbot.world)
- **리스크**: 개인정보 열람·정정·삭제 요청 수신 불가 시 개인정보보호법 위반
- **조치**: 실제 이메일 수신 여부 PO 확인 + SLA 명시 (예: "영업일 3일 내 회신")

---

## 🟡 MEDIUM — 기술부채

### M1. 환경변수 하드 폴백 (localhost)
- **파일**: `app/api/chat/route.ts`, `app/sitemap.ts` 등
- **패턴**: `process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'`
- **리스크**: Vercel 환경변수 누락 시 프로덕션에서 localhost URL 반환 → 외부 링크 깨짐
- **조치**: `lib/env.ts` 부팅 시점 검증 강제 (throw if missing in production)

### M2. RPC 실패 시 "completed" 오표시
- **파일**: `app/api/admin/payments/route.ts:207 → 244`
- **패턴**: 결제 status='completed' 저장 → 이후 `add_credits_tx` 호출
- **리스크**: RPC 실패 시 결제는 완료로 표시되나 크레딧 미지급 (사용자 혼란)
- **조치**: RPC를 먼저 호출 + 성공 시에만 status 업데이트 (또는 단일 RPC로 통합)

### M3. CSP `unsafe-inline` 확인 필요
- **파일**: `next.config.mjs`
- **조치**: Vercel 빌드 시 `NODE_ENV=production` 분기에서 unsafe-inline 제거됐는지 배포 헤더 검증 (`curl -I https://mychatbot.world`)

### M4. Chat 컨텍스트 오버플로 fallback 무음 실패
- **파일**: `app/api/chat/route.ts:438-492`
- **패턴**: 모든 모델 실패 시 조용히 `continue` → 사용자는 품질 저하 인지 불가
- **조치**: 마지막 모델까지 실패 시 명시적 에러 응답

---

## 🟢 LOW — 품질 개선

### L1. Rate-limit 경로 설정 중복
- **파일**: `middleware.ts` AI_PATHS vs `lib/rate-limiter/*`
- **조치**: 단일 source 로 통합

### L2. 에러 로깅에 Supabase 내부 메시지 그대로 노출 가능
- **파일**: `app/api/admin/payments/route.ts:156` 등
- **조치**: Production 로그에서 fetchError.message 직접 출력 대신 sanitize

### L3. 루트 error.tsx에서 Sentry 선택 의존
- **파일**: `app/error.tsx`
- **조치**: Sentry 미설정 환경에서 조용히 통과하는지 확인 (코드상 graceful disable 되어 있으면 OK)

---

## 최종 판정

**현재 사이트는 "동작은 한다"이나 법률적으로 취약한 상태.**

### 최우선 24시간 내 결정
1. **C1 (법률 공시)** — 결제 기능 유지하려면 실제 사업자 정보 기재 필수. 미완료 시 결제 기능 일시 차단 권고.
2. **C2 (타이밍 공격)** — 길이 체크로 실용적 공격은 어렵지만, `crypto.timingSafeEqual` 30줄 수정으로 완전 해소 가능. 즉시 수정 권장.

### 1주일 내
- H1~H4 각 항목 검토 후 조치.

### 그 외
- Sentry/PostHog/Axiom 등 MBO에 있던 "외부 서비스 미가입" 항목은 **운영 차단 요소 아님**. 나중에 천천히.
- Lighthouse·a11y·bundle 실측도 **런칭 차단 아님**. 사용자 이슈 보고되면 그때 대응.

### 실제로 "지금 운영 중인데 문제"는 딱 2개
- **결제 받고 있는데 사업자 공시 미기재** → 법적 리스크
- **관리자 키 비교 방식** → 이론적 보안 리스크 (실용 난이도 매우 높음)

나머지는 "있으면 좋지만 없어도 사이트는 돈다" 수준.
