# 도메인 연결 가이드

<!-- @task S4DO2 -->
<!-- Stage: S4 — 개발 마무리 / Area: DO — DevOps -->
<!-- 작성일: 2026-03-05 -->

---

## 개요

이 가이드는 mychatbot-world 프로젝트의 Vercel 배포 환경에 커스텀 도메인을 연결하는 절차를 다룹니다.
실제 도메인 구매 및 DNS 레코드 설정은 PO가 수행하며, 본 가이드는 전체 절차와 설정 방법을 정리합니다.

---

## 1. 전제 조건

- Vercel 배포가 완료된 상태 (S4DO1 완료)
- 커스텀 도메인을 구매한 상태 (도메인 등록 기관 계정 필요)
- Vercel 프로젝트에 대한 Owner 또는 Admin 권한

---

## 2. Vercel Dashboard에서 도메인 연결

### 2-1. 프로젝트 설정 진입

1. [https://vercel.com/dashboard](https://vercel.com/dashboard) 접속
2. `mychatbot-world` 프로젝트 선택
3. 상단 탭에서 **Settings** 클릭
4. 좌측 메뉴에서 **Domains** 선택

### 2-2. 도메인 추가

1. 입력창에 연결할 도메인 입력 (예: `mychatbot.world` 또는 `www.mychatbot.world`)
2. **Add** 버튼 클릭
3. Vercel이 DNS 설정 가이드를 자동으로 제공함

---

## 3. DNS 레코드 설정

도메인 등록 기관(가비아, 카페24, Cloudflare, GoDaddy 등)의 DNS 관리 페이지에서 아래 레코드를 추가합니다.

### 3-1. 루트 도메인 연결 (`mychatbot.world`)

**방법 A — A 레코드 (IPv4)**

| 타입 | 호스트 | 값             | TTL  |
|------|--------|----------------|------|
| A    | @      | 76.76.21.21    | 자동 |

**방법 B — ALIAS / ANAME 레코드 (일부 등록기관 지원)**

| 타입  | 호스트 | 값                        | TTL  |
|-------|--------|---------------------------|------|
| ALIAS | @      | cname.vercel-dns.com.     | 자동 |

> 참고: A 레코드가 범용적으로 호환됩니다. Cloudflare를 사용하는 경우 CNAME Flattening을 통해 루트 도메인에 CNAME 적용이 가능합니다.

### 3-2. 서브도메인 연결 (`www.mychatbot.world`)

| 타입  | 호스트 | 값                    | TTL  |
|-------|--------|-----------------------|------|
| CNAME | www    | cname.vercel-dns.com. | 자동 |

### 3-3. DNS 전파 대기

- 설정 후 전파 시간: 최소 수 분 ~ 최대 48시간 (일반적으로 1시간 이내)
- 전파 확인 도구: [https://dnschecker.org](https://dnschecker.org)

---

## 4. SSL 인증서 자동 발급

Vercel은 도메인 연결이 확인되면 **Let's Encrypt** 인증서를 자동으로 발급합니다.

- 별도 설정 불필요
- Vercel Dashboard > Domains 화면에서 인증서 발급 상태 확인 가능
- 발급 완료 후 `https://` 접속이 자동으로 활성화됨

### 발급 소요 시간

| 단계 | 시간 |
|------|------|
| DNS 전파 완료 후 인증서 신청 | 자동 (즉시) |
| 인증서 발급 완료 | 1~5분 |

---

## 5. 도메인 검증 방법

### 5-1. Vercel Dashboard 확인

- Domains 페이지에서 도메인 옆 상태 표시 확인
  - 녹색 체크: 연결 완료
  - 경고 아이콘: DNS 미전파 또는 설정 오류

### 5-2. 브라우저 확인

```
https://mychatbot.world
```
- HTTPS로 접속되면 SSL 인증서 발급 완료
- 브라우저 주소창의 자물쇠 아이콘 확인

### 5-3. 헬스체크 스크립트 실행

```bash
node domain-healthcheck.js mychatbot.world
```

(같은 디렉토리의 `domain-healthcheck.js` 참조)

---

## 6. Vercel CLI로 도메인 추가

Dashboard 대신 CLI를 사용할 경우:

```bash
# Vercel CLI 설치 (미설치 시)
npm install -g vercel

# Vercel 로그인
vercel login

# 도메인 추가
vercel domains add <domain>

# 예시
vercel domains add mychatbot.world
vercel domains add www.mychatbot.world

# 도메인 목록 확인
vercel domains ls

# 특정 프로젝트에 도메인 연결
vercel --prod --scope <team-or-username>
```

---

## 7. HSTS 헤더 추가 (보안 강화)

현재 `vercel.json`에는 HSTS 헤더가 없습니다. 커스텀 도메인 연결 후 보안 강화를 위해 아래 내용을 `vercel.json`의 `headers` 배열에 추가하는 것을 권장합니다.

### 추가할 헤더 설정

```json
{
  "source": "/(.*)",
  "headers": [
    {
      "key": "Strict-Transport-Security",
      "value": "max-age=63072000; includeSubDomains; preload"
    },
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "X-Frame-Options",
      "value": "SAMEORIGIN"
    },
    {
      "key": "X-XSS-Protection",
      "value": "1; mode=block"
    },
    {
      "key": "Referrer-Policy",
      "value": "strict-origin-when-cross-origin"
    }
  ]
}
```

### 적용 위치

`vercel.json`의 `"headers"` 배열 마지막에 위 블록을 추가합니다.

> 주의: `Strict-Transport-Security`의 `preload` 옵션은 HSTS Preload List 등록을 위한 것입니다.
> 실제 preload 등록은 [https://hstspreload.org](https://hstspreload.org) 에서 별도로 신청해야 합니다.
> 잘못 설정 시 HTTP 접속이 영구 차단될 수 있으니 테스트 후 적용하세요.

---

## 8. 문제 해결

### DNS가 전파되지 않는 경우

- TTL 값이 너무 높으면 변경 반영이 느릴 수 있음 (TTL을 300초로 낮춘 후 변경)
- 기존 캐시 영향: `ipconfig /flushdns` (Windows) 또는 `sudo dscacheutil -flushcache` (macOS)

### "Invalid Configuration" 오류

- 도메인 등록기관에서 설정한 레코드 타입과 값이 Vercel 가이드와 일치하는지 재확인
- A 레코드 값: `76.76.21.21` (Vercel 공식 IP)
- CNAME 값: `cname.vercel-dns.com.` (끝에 마침표 포함)

### SSL 인증서 발급 실패

- DNS 전파가 완료되지 않은 상태에서 발급 시도 시 실패 가능
- Vercel Dashboard에서 도메인 삭제 후 재추가하면 재시도됨

---

## 참고 링크

- [Vercel Custom Domains 공식 문서](https://vercel.com/docs/projects/domains)
- [Vercel DNS 설정 가이드](https://vercel.com/docs/projects/domains/add-a-domain)
- [HSTS Preload List](https://hstspreload.org)
- [DNS Checker](https://dnschecker.org)
