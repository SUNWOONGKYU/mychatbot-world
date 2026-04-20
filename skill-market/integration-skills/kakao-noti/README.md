# 카카오톡 알림 스킬 (kakao-noti)

챗봇 대화 중 중요한 이벤트 발생 시 고객 카카오톡으로 알림톡을 자동 발송합니다.

---

## 사전 요구사항

### 1. 카카오 비즈니스 채널 개설

카카오 알림톡은 **카카오 비즈니스 채널(구 카카오 플러스친구)** 이 반드시 필요합니다.

1. [카카오 비즈니스](https://business.kakao.com) 접속 → **채널 개설** 클릭
2. 채널명, 카테고리, 사업자등록번호 입력
3. 비즈니스 인증 심사 완료 (영업일 기준 2~5일 소요)
4. 채널 승인 후 **발신 프로필 키 (Sender Key, 40자)** 발급됨

> 개인 채널은 알림톡 발송 불가. 반드시 비즈니스 인증 채널이어야 합니다.

---

### 2. 알림톡 템플릿 등록

알림톡은 **사전 승인된 템플릿** 으로만 발송 가능합니다 (카카오 정책).

1. 카카오 비즈니스 채널 관리자 → **알림톡 관리** → **템플릿 등록**
2. 템플릿 유형 선택: 일반형 / 부가정보형 / 광고추가형 / 복합형
3. 템플릿 내용 작성 (변수는 `#{변수명}` 형식으로 삽입)
4. 카카오 검수 신청 → 승인 완료 후 **템플릿 코드(tpl_code)** 확인

예시 템플릿:
```
[#{채널명}] 예약 확인 안내
#{고객명}님, #{예약일시} 예약이 확정되었습니다.
문의: #{전화번호}
```

---

### 3. Aligo 카카오 비즈메시지 서비스 가입

이 스킬은 [Aligo 카카오 비즈메시지](https://smartsms.aligo.in) 서비스를 통해 발송합니다.

1. [Aligo 회원가입](https://smartsms.aligo.in) 완료
2. 카카오 비즈메시지 서비스 신청
3. 카카오 비즈니스 채널의 발신 프로필 키(Sender Key) 연동
4. API 키 발급: 마이페이지 → API 설정 → API 키 확인

> Aligo 외 다른 발송 대행사(NHN Cloud, 솔라피 등)를 사용할 경우 `handler.js`의 API URL과 파라미터를 해당 대행사 스펙에 맞게 수정하세요.

---

## 환경변수 설정

Vercel 프로젝트 설정 → Environment Variables에 다음 4개를 추가하세요:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `KAKAO_BIZM_API_KEY` | Aligo API 키 | `a1b2c3d4e5f6...` |
| `KAKAO_BIZM_USERID` | Aligo 서비스 아이디 | `myservice` |
| `KAKAO_SENDER_KEY` | 카카오 발신 프로필 키 (40자) | `abc123...` (40자) |
| `KAKAO_SENDER_PHONE` | 채널에 등록된 발신자 번호 | `0212345678` |

```bash
# .env.local (로컬 개발용, Git에 커밋하지 마세요)
KAKAO_BIZM_API_KEY=여기에_알리고_API_키
KAKAO_BIZM_USERID=여기에_알리고_서비스ID
KAKAO_SENDER_KEY=여기에_카카오_발신프로필키_40자
KAKAO_SENDER_PHONE=0212345678
```

---

## API 사용법

### 알림톡 발송 (send)

**요청:**
```http
POST /api/skill-integrations
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "skillId": "kakao-noti",
  "action": "send",
  "payload": {
    "phone": "01012345678",
    "message": "[마이챗봇] 홍길동님, 2024-01-15 14:00 예약이 확정되었습니다.",
    "templateCode": "TPL_001"
  }
}
```

**응답 (성공):**
```json
{
  "success": true,
  "msgId": "M12345678",
  "message": "010-****-5678으로 카카오톡 알림이 발송되었습니다."
}
```

**응답 (환경변수 미설정 시 시뮬레이션):**
```json
{
  "success": true,
  "message": "010-****-5678으로 카카오톡 알림이 발송 예약되었습니다.",
  "mode": "simulation"
}
```

**응답 (실패):**
```json
{
  "success": false,
  "error": "알림톡 발송 실패: 템플릿 코드가 유효하지 않습니다. (code: E100)"
}
```

### payload 파라미터

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `phone` | 필수 | 수신자 전화번호 (하이픈 포함/미포함 모두 가능) |
| `message` | 필수 | 발송할 메시지 내용 (최대 1000자, 승인된 템플릿 내용과 일치해야 함) |
| `templateCode` | 권장 | 카카오 승인 템플릿 코드. 미입력 시 Aligo API에서 오류를 반환할 수 있으므로 프로덕션에서는 반드시 입력하세요. |

> **주의**: 카카오 알림톡은 사전 승인된 템플릿으로만 발송 가능합니다. `templateCode`를 생략하면 Aligo API에서 오류를 반환합니다. 개발/테스트 환경에서는 생략 시 시뮬레이션 모드로 동작합니다. 템플릿 등록은 위 "사전 요구사항 2단계"를 참조하세요.

---

## 주의사항 및 제한

### 카카오 알림톡 정책
- 알림톡은 **사전 승인된 템플릿** 으로만 발송 가능 (광고성 내용 포함 시 별도 심사)
- 수신자가 카카오톡 미설치 또는 비활성 상태이면 문자(SMS)로 대체 발송 가능 (failover 설정)
- **야간 발송 제한**: 마케팅 알림의 경우 21:00 ~ 08:00 발송 금지

### 스팸 방지
- 동일 수신자에게 24시간 내 과도한 발송은 카카오 정책 위반 가능
- 수신 거부 요청 즉시 반영 필수

### 비용
- Aligo 알림톡 단가: 약 7.5원/건 (부가세 별도, 플랜에 따라 상이)
- [Aligo 요금제 확인](https://smartsms.aligo.in/plan.html)

---

## 대체 발송 대행사

Aligo 대신 다른 서비스 사용 시 `handler.js`의 API URL과 파라미터를 수정하세요:

| 대행사 | API URL | 특징 |
|--------|---------|------|
| **Aligo** | `https://kakaoapi.aligo.in/akv10/alimtalk/send/` | 이 스킬 기본값 |
| **솔라피 (Solapi)** | `https://api.solapi.com/messages/v4/send` | REST API, 다양한 메시지 유형 |
| **NHN Cloud** | `https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/{appkey}/messages` | 엔터프라이즈급 |
| **네이버 클라우드** | `https://sens.apigw.ntruss.com/alimtalk/v2/services/{serviceId}/messages` | 네이버 생태계 |

---

## 파일 구조

```
kakao-noti/
├── skill.json    # 스킬 메타데이터 + systemPrompt
├── handler.js    # Aligo 카카오 비즈메시지 API 연동 핸들러
└── README.md     # 이 파일
```

---

## 문제 해결

**Q. "템플릿 코드가 유효하지 않습니다" 오류**
- 카카오 비즈니스 채널에서 템플릿 승인 여부 확인
- 템플릿 코드 오타 확인
- 템플릿 내 변수(`#{변수명}`)와 실제 메시지 내용 불일치 확인

**Q. 환경변수를 설정했는데도 시뮬레이션 모드로 동작**
- Vercel 재배포 후 확인 (환경변수 추가 후 반드시 재배포 필요)
- `KAKAO_SENDER_KEY`가 정확히 40자인지 확인

**Q. 발송은 성공했지만 카카오톡이 오지 않음**
- 수신자 카카오톡 알림 설정 확인 (비즈니스 채널 차단 여부)
- 카카오 채널 친구 추가 상태 확인 (일부 메시지 유형은 친구 추가 필요)
- Aligo 발송 내역에서 실제 발송 성공 여부 확인
