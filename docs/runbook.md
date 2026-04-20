# 운영 Runbook — 12 시나리오

> @task S9DC2
> **목적**: on-call 담당자가 즉시 조치할 수 있도록 12가지 장애 유형의 증상·진단·조치·에스컬레이션을 정리.
> **관련 문서**: `docs/runbooks/incident-response.md` (심각도 분류), `docs/runbooks/rollback.md`, `docs/runbooks/backup.md`, `docs/runbooks/deploy.md`, `docs/runbooks/on-call.md`

## 에스컬레이션 연락처

1. **On-call 1차**: 현재 당번 엔지니어 (PagerDuty 또는 Slack #ops 고정 핀)
2. **2차 (15분 무응답)**: PO 직접
3. **결제·법무**: PO
4. **DB Critical**: Supabase Support (Pro 플랜)

---

## 1. DB Down (Supabase 장애)

**증상**
- `/api/health` → `database: down`
- 전면 5xx, "연결할 수 없어요" 메시지
- Supabase Status 페이지 장애 공지

**진단**
```bash
curl -sS https://mychatbot.world/api/health | jq .services.database
```
- Supabase Dashboard → Project → Logs → Database 탭 → 최근 에러
- https://status.supabase.com 확인

**조치**
1. **Supabase 플랫폼 장애**: 대기 + 사용자 공지 (landing 배너 + @mychatbotworld 트윗)
2. **단일 프로젝트 장애**: Dashboard → **Restart project**
3. **연결 고갈**: Settings → Connection Pooling → Transaction mode 확인
4. 15분 이상 지속 시 Supabase Support 티켓 (Pro SLA)

**에스컬레이션**: 5분 내 복구 안되면 2차

---

## 2. Redis Down (Upstash 장애)

**증상**
- `/api/health` → `redis: down`
- 세션/랜덤 미미한 느려짐 (앱 기본 동작 가능 — memStore fallback)
- rate limit 동작 불가

**진단**
```bash
curl -sS https://mychatbot.world/api/health | jq .services.redis
```
- Upstash Console → Database → Metrics
- https://status.upstash.com

**조치**
1. 대부분 자동 복구 (Upstash SLA)
2. 회로 차단 상태: lib/circuit-breaker.ts 가 memStore fallback 사용 — 기능 제한적 가용
3. 장기화 시: 새 Upstash DB 생성 → env 교체 → Vercel 재배포

**에스컬레이션**: 30분 이상 시 PO에 공지

---

## 3. OpenRouter 장애 (AI 응답 실패)

**증상**
- 채팅 응답 안 옴, "AI가 잠시 혼잡해요"
- Sentry `AI_BUSY` / 5xx 급증
- `/api/chat` 5xx

**진단**
```bash
curl -I https://openrouter.ai/api/v1/models
```
- Circuit breaker 상태 확인 (Upstash key `cb:openrouter`)
- 에러 메시지에 모델별 오류 코드 확인

**조치**
1. **Circuit breaker open 상태**: 정상 — 60초 후 self-heal
2. **모델별 장애**: lib/openrouter.ts 에서 fallback 모델 사용 (이미 구현)
3. **크레딧 소진**: OpenRouter 대시보드에서 충전 (PO)
4. **키 만료**: 새 키 발급 → Vercel env 업데이트

**에스컬레이션**: 15분 이상 시 사용자 공지 + PO

---

## 4. 결제 실패 (무통장 입금 확인 지연)

**증상**
- `/api/payments` 400/500 급증
- "결제가 완료되지 않았어요" 사용자 제보
- Axiom `cocobot_payment_failures` 쿼리 급증

**진단**
```bash
# 실패 결제 목록
curl -H "x-admin-key: $ADMIN_KEY" https://mychatbot.world/api/admin/payments?status=failed
```
- Supabase Dashboard → `mcw_payments` 테이블 → status 필터
- Vercel Functions 로그 → `/api/admin/payments/[id]/approve` 에러 확인

**조치**
1. **실제 입금 있는데 승인 지연**: PO가 수동 승인 (admin 페이지)
2. **유저 오입금**: 환불 요청 가이드 안내
3. **API 버그**: 관련 코드 롤백 또는 핫픽스

**에스컬레이션**: PO 즉시 (결제=회사 신뢰)

---

## 5. 로그인 불가 (Supabase Auth 장애)

**증상**
- `/login` 제출 후 무한 로딩
- "로그인 실패 — 알 수 없는 오류"
- Sentry `auth.signIn` 에러 스파이크

**진단**
```bash
# Supabase auth endpoint probe
curl -sSI https://<ref>.supabase.co/auth/v1/health
```
- Supabase Dashboard → Auth → Logs
- Magic link 이메일 수신 여부 테스트 (PO 개인 이메일)

**조치**
1. **Supabase Auth 장애**: 대기 (Supabase 플랫폼 이슈)
2. **SMTP 장애**: Magic link 미발송 — 기본 SMTP → Resend 대체 고려
3. **Rate limit**: 동일 IP 5분 5회 초과 시 자동 차단 — 대기 권고

**에스컬레이션**: 10분 내 복구 안되면 PO

---

## 6. Sentry 알림 급증

**증상**
- Sentry `AlertRule` 이 "High error rate" 발동
- Slack #alerts 채널 알림 급증

**진단**
- Sentry Dashboard → Issues → 정렬 `events (24h)` → 상위 1~3건 확인
- 공통 스택트레이스 / release 태그 확인

**조치**
1. **최근 배포가 원인**: Vercel Dashboard → Rollback to previous
2. **특정 엔드포인트**: 해당 코드 핫픽스 PR → 즉시 배포
3. **외부 의존성 (OpenRouter 등)**: 시나리오 3 참조

**에스컬레이션**: on-call 1차 해결 시도 → 30분 내 미해결 시 2차

---

## 7. 무통장입금 대기 폭주

**증상**
- admin 대시보드 pending 결제 > 30건
- 지연 승인으로 고객 이탈 위험

**진단**
```sql
SELECT COUNT(*) FROM mcw_payments WHERE status='pending' AND created_at < NOW() - INTERVAL '1 hour';
```

**조치**
1. PO가 뱅킹 앱 대조 → admin 페이지에서 일괄 승인
2. 자동화 스크립트 (후속): 은행 API 연동 시 자동 매칭
3. 지연 안내 문구 업데이트 (landing + 환불페이지)

**에스컬레이션**: PO 직접 대응

---

## 8. RLS 정책 위반 탐지

**증상**
- Axiom `cocobot_rls_suspicious` 쿼리에서 단일 유저 403 급증
- 로그에 "RLS" / "permission denied" 메시지 급증

**진단**
- `scripts/rls-audit.ts` 실행 → 정책 매트릭스 재검토
- Sentry → user_id 로 그룹핑 → 공격 패턴 확인

**조치**
1. **공격 시도**: 해당 IP/유저 차단 (Vercel Firewall 또는 lib/rate-limit.ts)
2. **정책 버그**: Supabase SQL Editor → 정책 수정 → 테스트
3. **유저 신고**: 법적 대응 (개인정보보호법 위반 시)

**에스컬레이션**: 보안 관련 → PO 즉시 + 법무 상담

---

## 9. Vercel 배포 실패

**증상**
- PR merge 후 Vercel Deployment 상태 `error`
- 프로덕션은 이전 버전 유지 (Vercel 기본 동작 — 실패 시 자동 방어)

**진단**
- Vercel Dashboard → Deployments → 실패 로그 (빌드/라이브러리/런타임)
- `pnpm build` 로컬 재현

**조치**
1. 빌드 에러: 코드 수정 → 새 커밋 푸시
2. 환경변수 누락: Vercel env 재확인 + `lib/env.ts` 검증
3. 긴급 시: 실패 PR revert → 이전 상태 유지

**에스컬레이션**: 개발자 대응 범위. 프로덕션 영향 없으므로 SEV3.

---

## 10. Supabase Migration 실패

**증상**
- `supabase db push` 에러
- Branch DB와 production 스키마 divergence
- 특정 쿼리 "column does not exist" 500

**진단**
- Supabase Dashboard → Database → Migrations → 실패 마이그레이션 로그
- `scripts/schema-audit.ts` 실행 → 현재 상태 확인

**조치**
1. Migration 롤백: `supabase db reset` (주의: branch DB 전용!)
2. 프로덕션 스키마 수동 복구: 역방향 SQL 실행 (Supabase SQL Editor)
3. 백필/데이터 보존: PITR 복원 고려 (`docs/runbooks/backup.md`)

**에스컬레이션**: 프로덕션 스키마 영향 시 PO + Supabase Support

---

## 11. DNS 만료

**증상**
- `mychatbot.world` NXDOMAIN
- 전면 접근 불가

**진단**
```bash
dig mychatbot.world
whois mychatbot.world | grep -i expir
```

**조치**
1. 도메인 등록 기관(가비아/Namecheap 등) 로그인 → 즉시 갱신 결제
2. TTL 감안 — DNS 전파 30분~4시간 소요
3. 갱신 후 Vercel Domains 재연결 확인

**에스컬레이션**: PO 즉시 (카드/결제 접근 필요)

**예방**: 자동 갱신 ON + 만료 30일 전 알림 이메일 체크

---

## 12. SSL 인증서 만료

**증상**
- 브라우저 "NET::ERR_CERT_DATE_INVALID"
- HTTPS 접속 불가, HTTP 접속은 Vercel redirect로 차단

**진단**
```bash
echo | openssl s_client -connect mychatbot.world:443 2>/dev/null | openssl x509 -noout -dates
```

**조치**
1. **Vercel 자동 관리 도메인**: Vercel 이 Let's Encrypt 자동 갱신 — Dashboard → Domains → 상태 확인
2. **수동 관리 CNAME**: DNS 설정 재확인 → Vercel 이 재발급하도록 도메인 re-verify
3. 긴급 시: Cloudflare proxy 활성화로 임시 SSL 커버

**에스컬레이션**: 10분 내 미해결 시 PO

**예방**: UptimeRobot SSL expiry 모니터 (docs/uptimerobot-monitors.md #6)

---

## 포스트모템 템플릿

장애 복구 후 24시간 내 `docs/postmortems/YYYY-MM-DD-<한줄요약>.md` 작성:
- 타임라인 (탐지 → 조치 → 복구)
- 근본 원인 (RCA)
- 영향 범위 (유저 수, 금액, 시간)
- 방지 조치 (Action Items + 담당자)

---

## 관련 문서

- `docs/runbooks/incident-response.md` — 심각도 분류·전체 절차
- `docs/runbooks/rollback.md` — 배포 롤백
- `docs/runbooks/backup.md` — 백업·PITR
- `docs/runbooks/deploy.md` — 배포 체크리스트
- `docs/runbooks/on-call.md` — On-call 교대
- `docs/axiom-queries.md` — 로그 쿼리 6종
- `docs/uptimerobot-monitors.md` — 모니터 6종
