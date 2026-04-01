# API 에러 코드표

> MyChatbot World API 공통 에러 응답 형식 및 전체 에러 코드 목록

---

## 에러 응답 공통 형식

모든 에러 응답은 아래 형식의 JSON 바디를 반환합니다:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 에러 설명",
    "details": {}
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `code` | string | 서비스 내부 에러 코드 (고유 식별자) |
| `message` | string | 사용자에게 표시 가능한 에러 설명 (한국어) |
| `details` | object | 추가 컨텍스트 (선택적, 비어 있을 수 있음) |

---

## 표준 HTTP 상태 코드

| 상태 코드 | 의미 | 설명 |
|-----------|------|------|
| `200 OK` | 성공 | 요청 정상 처리 |
| `201 Created` | 리소스 생성됨 | POST 요청으로 새 리소스가 생성됨 |
| `400 Bad Request` | 잘못된 요청 | 요청 파라미터 또는 바디 형식 오류 |
| `401 Unauthorized` | 인증 실패 | 토큰 없음, 만료, 또는 유효하지 않음 |
| `402 Payment Required` | 결제 필요 | 크레딧 부족 등 결제 관련 거절 |
| `403 Forbidden` | 권한 없음 | 인증은 되었지만 해당 리소스에 접근 권한 없음 |
| `404 Not Found` | 리소스 없음 | 요청한 리소스가 존재하지 않음 |
| `409 Conflict` | 충돌 | 이미 존재하거나 처리된 리소스 |
| `422 Unprocessable Entity` | 처리 불가 | 입력값이 비즈니스 규칙을 위반 |
| `429 Too Many Requests` | 요청 초과 | Rate limit 초과 |
| `500 Internal Server Error` | 서버 오류 | 예상치 못한 서버 내부 오류 |

---

## 에러 코드 전체 목록

### AUTH — 인증/인가 관련

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `AUTH_001` | 401 | 인증 토큰 없음 — Authorization 헤더가 없거나 Bearer 형식이 아님 | Authorization 헤더에 Bearer 토큰 포함 |
| `AUTH_002` | 401 | 토큰 만료 — JWT 만료 시간이 지남 | 리프레시 토큰으로 새 토큰 발급 후 재요청 |
| `AUTH_003` | 401 | 유효하지 않은 토큰 — 서명 불일치 또는 변조된 토큰 | 다시 로그인하여 새 토큰 발급 |
| `AUTH_004` | 403 | 권한 없음 — 자신의 리소스가 아닌 타 사용자 리소스 접근 시도 | 본인 소유 리소스만 접근 가능 |

**예시:**
```json
{
  "error": {
    "code": "AUTH_001",
    "message": "인증이 필요합니다. Authorization 헤더를 확인해 주세요.",
    "details": {}
  }
}
```

---

### PAY — 결제/크레딧 관련

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `PAY_001` | 402 | 크레딧 잔액 부족 — 요청한 작업에 필요한 크레딧이 부족함 | MyPage > 크레딧에서 충전 |
| `PAY_002` | 400 | 최소 정산 금액 미달 — 정산 요청 금액이 최솟값(10,000원) 미만 | 최솟값 이상 금액으로 재요청 |
| `PAY_003` | 400 | 허용되지 않는 충전 금액 — 1,000/5,000/10,000/50,000원 외 금액 입력 | 허용된 단위로 금액 변경 |
| `PAY_004` | 404 | 결제 내역 없음 — 요청한 paymentId가 존재하지 않음 | 유효한 paymentId 확인 |
| `PAY_005` | 409 | 이미 처리된 결제 — 동일 결제 내역 중복 처리 시도 | 결제 상태 조회 후 처리 여부 확인 |

**예시:**
```json
{
  "error": {
    "code": "PAY_001",
    "message": "크레딧 잔액이 부족합니다. 충전 후 다시 시도해 주세요.",
    "details": {
      "required_credits": 5,
      "current_balance": 2
    }
  }
}
```

---

### INH — 피상속(Digital Inheritance) 관련

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `INH_001` | 409 | 이미 처리된 피상속 요청 — 동의/거부가 완료된 요청에 재처리 시도 | 현재 피상속 상태 조회 후 확인 |
| `INH_002` | 403 | 피상속인 권한 없음 — 피상속인으로 지정되지 않은 사용자가 동의 처리 시도 | 올바른 피상속인 계정으로 로그인 |
| `INH_003` | 404 | 피상속인 없음 — 피상속인이 지정되지 않은 상태에서 전환 요청 | 먼저 피상속인을 지정한 후 전환 요청 |
| `INH_004` | 400 | 자기 자신을 피상속인으로 지정 불가 | 다른 사용자를 피상속인으로 지정 |
| `INH_005` | 409 | 이미 피상속인이 지정된 상태 — 중복 지정 시도 | 기존 피상속인을 해제 후 재지정 |

**예시:**
```json
{
  "error": {
    "code": "INH_001",
    "message": "이미 처리된 피상속 요청입니다.",
    "details": {
      "consent_status": "accepted",
      "processed_at": "2026-03-15T10:30:00Z"
    }
  }
}
```

---

### BOT — 봇/페르소나 관련

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `BOT_001` | 404 | 봇을 찾을 수 없음 — 요청한 botId가 존재하지 않음 | 유효한 botId 확인 |
| `BOT_002` | 403 | 봇 접근 권한 없음 — 비공개 봇에 대한 타 사용자 접근 | 본인 봇 또는 공개 봇만 접근 가능 |
| `BOT_003` | 422 | 봇 생성 실패 — AI 분석 중 오류 발생 | 봇 설명을 더 구체적으로 수정 후 재시도 |
| `BOT_004` | 422 | 봇 이름 중복 — 같은 사용자의 동일 이름 봇 존재 | 다른 봇 이름 사용 |

---

### CHAT — 대화 관련

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `CHAT_001` | 400 | 메시지 없음 — 빈 message 필드 | 메시지 내용 포함 |
| `CHAT_002` | 400 | 잘못된 emotionLevel — 범위(1~100) 초과 | 유효 범위 내 값으로 수정 |
| `CHAT_003` | 500 | AI 모델 응답 실패 — OpenRouter API 오류 | 잠시 후 재시도 |

---

### KB — Knowledge Base 관련

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `KB_001` | 400 | 파일 크기 초과 — 업로드 파일이 10MB를 초과 | 파일 크기 축소 후 재업로드 |
| `KB_002` | 400 | 지원하지 않는 파일 형식 — PDF, TXT, DOCX 외 형식 | 지원 형식으로 변환 후 업로드 |
| `KB_003` | 500 | 임베딩 생성 실패 — 벡터 변환 중 오류 발생 | 잠시 후 재시도 |

---

### JOB — 채용/Jobs 관련

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `JOB_001` | 404 | 채용 공고 없음 — 요청한 job_id가 존재하지 않음 | 유효한 job_id 확인 |
| `JOB_002` | 409 | 이미 채용 완료된 공고 — 마감된 공고에 지원 시도 | 다른 공고 탐색 |
| `JOB_003` | 403 | 고용주 권한 없음 — 고용주만 가능한 작업을 다른 역할이 시도 | 고용주 계정으로 재시도 |

---

### SYS — 시스템 공통

| 에러 코드 | HTTP 상태 | 설명 | 처리 방법 |
|-----------|-----------|------|-----------|
| `SYS_001` | 500 | 서버 내부 오류 — 예상치 못한 오류 | 잠시 후 재시도, 지속 시 고객센터 문의 |
| `SYS_002` | 500 | 데이터베이스 오류 — DB 연결 실패 | 잠시 후 재시도 |
| `SYS_003` | 400 | 잘못된 요청 형식 — JSON 파싱 오류 | 요청 바디의 JSON 형식 확인 |
| `SYS_004` | 429 | Rate limit 초과 — 단시간 내 과도한 요청 | 잠시 대기 후 재시도 |

---

## 에러 처리 예제 코드

### JavaScript

```javascript
async function callApi(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    const code = error?.error?.code;

    switch (code) {
      case 'AUTH_002':
        // 토큰 만료 — 갱신 후 재시도
        await refreshToken();
        return callApi(endpoint, options);

      case 'PAY_001':
        // 크레딧 부족 — 충전 페이지로 이동
        window.location.href = '/mypage/credits';
        break;

      default:
        throw new Error(error?.error?.message || '알 수 없는 오류가 발생했습니다.');
    }
  }

  return response.json();
}
```

### Python

```python
import requests

def call_api(endpoint, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    response = requests.request(method, endpoint, json=data, headers=headers)

    if not response.ok:
        error = response.json().get("error", {})
        code = error.get("code", "")
        message = error.get("message", "Unknown error")

        if code == "AUTH_002":
            raise TokenExpiredError("Token expired. Please refresh.")
        elif code == "PAY_001":
            raise InsufficientCreditsError(message)
        else:
            raise ApiError(f"[{code}] {message}")

    return response.json()
```
