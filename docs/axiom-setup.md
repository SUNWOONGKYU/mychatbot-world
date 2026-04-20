# Axiom Log Drain 설정 가이드

> @task S9BI3
> Vercel 배포 로그 → Axiom 으로 장기 보관 + 쿼리 (14일 → 무제한)

## 왜 필요한가

Vercel 기본 로그 보관은 **최근 요청만**. 다음이 어렵다:
- 7일 전 결제 실패 건 조회
- 특정 유저의 전체 요청 이력 추적
- 에러 trend 분석 (주간 5xx 추이)
- 대시보드/알림 구축

Axiom 을 log drain 으로 연결하면 구조화된 로그가 무제한 쌓이고 SQL/APL 쿼리 가능.

## 가격

- **Free tier**: 500 GB/월 수집, 30일 보관 → CoCoBot 초기 트래픽에 충분
- Paid: 사용량 기반 ($0.25/GB 수집)

## 설정 순서 (PO 수동)

### 1. Axiom 계정 + Dataset 생성

1. https://axiom.co 계정 생성
2. Organization 생성 → Dataset `cocobot-production` 생성
3. API Token 발급 (Ingest 권한) → 기록

### 2. Vercel Integration

1. Vercel Dashboard → Integrations → **Axiom** 검색 → Install
2. 프로젝트 선택: `mychatbot-world`
3. Axiom Dataset 선택: `cocobot-production`
4. 저장 → Vercel Functions / Edge 로그가 자동 drain 시작

### 3. 환경변수 (선택 — 서버 측 구조화 로그)

서버 코드에서 `console.log` 외에 Axiom SDK로 직접 이벤트 보내려면:

```
AXIOM_DATASET=cocobot-production
AXIOM_TOKEN=xaat-xxxxxxxx
```

Vercel Integration 만으로도 request/response 로그는 자동 수집됨. SDK는 선택.

### 4. 검증

1. Vercel에서 요청 1건 발생
2. Axiom Dashboard → Dataset → Stream → 1분 이내 이벤트 도착 확인
3. `_time`, `message`, `level`, `path`, `status` 필드 확인

## 유지보수

- 월 수집량 모니터링 (free tier 500GB 근접 시 알림)
- Dataset retention 정책 확인 (기본 30일)
- PII 샘플링 점검 (Sentry scrubber와 동일 기준 — 이메일/토큰 마스킹)

## 관련

- 저장 쿼리 6종: `docs/axiom-queries.md`
- 알림 설정: Axiom Monitors (Slack/Email 연동)
- Sentry 연동: Axiom → Sentry Error correlation (선택)
