# 이메일 전송 스킬 (email-send)

Resend API를 이용해 챗봇에서 자동으로 이메일을 발송하는 연동 스킬입니다.

## 사용 사례

- 고객 문의사항을 담당자 이메일로 자동 전달
- 예약 완료 시 확인 이메일 발송
- 쿠폰 코드를 이메일로 전달
- 중요 알림을 이메일로 발송

---

## 설치 및 설정

### 1단계: Resend 계정 생성 및 API 키 발급

1. [https://resend.com](https://resend.com) 접속 후 회원가입
2. 로그인 후 **API Keys** 메뉴 이동
3. **"Create API Key"** 클릭
   - Name: `mychatbot-world` (식별용 이름)
   - Permission: `Sending access`
4. 생성된 API 키 복사 (`re_xxxxxxxxxx` 형식)

> **무료 플랜 제한**: 월 3,000건, 1일 100건. 소규모 챗봇에 충분합니다.

### 2단계: 발신자 도메인 인증 (선택 — 프로덕션 필수)

무료 플랜은 `onboarding@resend.dev` 발신 주소로 테스트 가능합니다.
커스텀 도메인 (`noreply@yoursite.com`) 사용 시 도메인 인증이 필요합니다.

1. Resend 대시보드 → **Domains** → **Add Domain**
2. 도메인 입력 후 DNS 레코드 추가 (SPF, DKIM, DMARC)
3. 도메인 인증 완료 확인

### 3단계: 환경 변수 설정

`.env.local` 파일에 API 키를 추가합니다:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

Vercel 배포 시 Vercel 대시보드 → **Settings** → **Environment Variables** 에서 추가합니다.

### 4단계: 스킬 등록

챗봇 관리자 페이지에서 **이메일 전송** 스킬을 활성화합니다.

---

## API 사용법

### 이메일 발송 (`action: "send"`)

```http
POST /api/skill-integrations
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "skillId": "email-send",
  "action": "send",
  "payload": {
    "to": "recipient@example.com",
    "subject": "[문의] 서비스 이용 관련 문의",
    "body": "안녕하세요.\n\n서비스 이용과 관련하여 문의드립니다...",
    "from": "noreply@mychatbot.world"
  }
}
```

**응답 (성공)**
```json
{
  "success": true,
  "emailId": "49a3999c-0ce1-4ea6-ab68-b08a0efa6b11",
  "message": "recipient@example.com으로 이메일이 성공적으로 발송되었습니다."
}
```

**응답 (시뮬레이션 — API 키 미설정)**
```json
{
  "success": true,
  "mode": "simulation",
  "message": "[시뮬레이션] 이메일이 recipient@example.com으로 발송 예약되었습니다."
}
```

### 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `to` | string | 필수 | 수신자 이메일 주소 |
| `subject` | string | 필수 | 이메일 제목 |
| `body` | string | 필수 | 이메일 본문 (평문 텍스트) |
| `from` | string | 선택 | 발신자 이메일 (기본: `noreply@mychatbot.world`) |
| `html` | string | 선택 | HTML 본문 (body보다 우선 적용) |

---

## 파일 구조

```
email-send/
├── skill.json    # 스킬 메타데이터 + systemPrompt
├── handler.js    # Resend API 연동 핸들러
└── README.md     # 이 파일
```

## 연동 방식

`handler.js`의 `routeEmailSend` 함수를 `api/skill-integrations.js`에서 임포트해 사용합니다.
`routeEmailSend`는 내부적으로 `handleEmailSend`를 호출하고 HTTP 응답까지 처리합니다.

```js
// api/skill-integrations.js 에서
import { routeEmailSend } from '../skill-market/integration-skills/email-send/handler.js';

case 'email-send':
  return await routeEmailSend(req, res, action, payload);
```

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `mode: "simulation"` 반환 | `RESEND_API_KEY` 미설정 | `.env.local`에 키 추가 후 재시작 |
| 이메일 수신 안 됨 | 스팸 폴더 확인 | 도메인 인증으로 발신 신뢰도 향상 |
| `422` 오류 | 발신 도메인 미인증 | Resend 대시보드에서 도메인 인증 완료 |
| 월 3,000건 초과 | 무료 플랜 한도 | Resend 유료 플랜 업그레이드 |
