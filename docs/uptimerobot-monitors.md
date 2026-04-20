# UptimeRobot 모니터 설정 가이드 (S9BI4)

> **작성일**: 2026-04-20
> **Target**: mychatbot.world 프로덕션
> **계정**: PO 소유 UptimeRobot 계정 (무료 50 모니터, 5분 간격)

## 개요

6개의 외부 모니터로 다운타임을 조기 감지한다. 장애 발생 시 Slack·Email·SMS로 에스컬레이션.

## 모니터 정의

### 1. 오리진 헬스 (5분)
- **Name**: `MCW-Origin-Health`
- **Type**: HTTP(s)
- **URL**: `https://mychatbot.world/api/health`
- **Interval**: 5 분
- **Keyword**: `"status":"ok"` 또는 `"status":"degraded"` (둘 다 허용)
- **Down 판정**: 응답 5xx 또는 응답 시간 30초 초과
- **Timeout**: 30 s

### 2. 랜딩 페이지 (5분)
- **Name**: `MCW-Landing`
- **Type**: HTTP(s)
- **URL**: `https://mychatbot.world/`
- **Interval**: 5 분
- **Keyword**: `CoCoBot` (HTML 본문에 브랜드명 포함 확인)
- **Down 판정**: 5xx, Keyword 미포함, 응답 30초 초과

### 3. 챗 엔드포인트 헬스 프로브 (10분)
- **Name**: `MCW-Chat-Probe`
- **Type**: HTTP(s) HEAD
- **URL**: `https://mychatbot.world/api/chat`
- **Interval**: 10 분
- **Method**: HEAD (OPTIONS 대체)
- **Expected Status**: 200, 204, 401, 405 (인증/메소드 제한도 살아있음 신호)
- **Down 판정**: 5xx 또는 timeout

### 4. 결제 엔드포인트 (15분)
- **Name**: `MCW-Payments-Probe`
- **Type**: HTTP(s) OPTIONS
- **URL**: `https://mychatbot.world/api/payments`
- **Interval**: 15 분
- **Expected Status**: 200, 204, 401, 405
- **Down 판정**: 5xx, 503

### 5. SAL Grid 헬스 (30분)
- **Name**: `MCW-SalGrid-Probe`
- **Type**: HTTP(s)
- **URL**: `https://mychatbot.world/api/sal-grid` (또는 대체 /api/version)
- **Interval**: 30 분
- **Expected Status**: 200, 401, 404 (API 존재 확인만)

### 6. DNS / SSL 만료 (일 1회)
- **Name**: `MCW-DNS-SSL`
- **Type**: SSL / Domain
- **Hostname**: `mychatbot.world`
- **Interval**: 24 h
- **Alert**: SSL 30일 이내 만료, DNS 레코드 변경 감지

## 알림 정책

| Severity | 조건 | 채널 |
|----------|------|------|
| Critical (P0) | #1, #2 다운 2회 연속 (10분) | SMS + Slack + Email |
| High (P1) | #3, #4 다운 2회 연속 (20분) | Slack + Email |
| Medium (P2) | #5 다운 (30분) | Email |
| Warning | #6 SSL 만료 30일 전 | Email |

- **Alert Contacts**: PO 휴대폰, PO 이메일, Slack `#mcw-alerts` (선택)
- **Maintenance Window**: 매주 화 03:00~03:30 KST 배포 시간 (알림 suppress)

## 상태 페이지 (옵션)

UptimeRobot Pro ($7/mo) 업그레이드 시 `status.mychatbot.world` 공개 상태 페이지 가능. 초기 런칭 단계에선 생략.

## PO 설정 절차

1. https://uptimerobot.com 로그인 → My Settings → API 토큰 확인 (선택, 자동화 시)
2. Dashboard → `+ Add New Monitor`
3. 위 6개 모니터 각각 등록 (Type / URL / Interval / Keyword)
4. Alert Contacts 등록 (휴대폰 번호 OTP 인증 필수)
5. 각 모니터의 Alert Contacts 연결 (Severity별로 분리)
6. 테스트: 2번 모니터 URL을 일시 변경 → 30분 내 알림 수신 확인

## 운영

- 매주 월요일 `Status` 페이지 스크린샷 → `docs/weekly-uptime/` 보관
- 가용성 목표: 99.5% (월 3.6시간 허용 다운)
- 99.5% 미만 시 Post-mortem 작성 의무 (`docs/postmortems/`)

## 상태

- [ ] UptimeRobot 계정 로그인 (PO)
- [ ] 6 모니터 등록 (PO)
- [ ] Alert Contacts 설정 (PO)
- [ ] 첫 24h 모니터링 결과 확인 (PO)
