# 쿠폰 발급 스킬 (Coupon Integration Skill)

챗봇 대화 중 자동으로 쿠폰을 생성하고 발급하는 연동 스킬입니다.

## 기능 요약

| Action | 설명 |
|--------|------|
| `issue` | 새 쿠폰 코드 생성 및 발급 |
| `validate` | 쿠폰 코드 유효성 검증 (만료/사용 여부) |

## 쿠폰 코드 형식

```
MCW-XXXXXX
예시: MCW-A3F9C2
```

- `crypto.randomBytes` 기반 암호학적 난수 사용
- 6자리 대문자 16진수 (16^6 = 약 1600만 가지 조합)

---

## 설치 방법

### 1. Supabase 테이블 생성

Supabase SQL Editor에서 아래 쿼리를 실행합니다:

```sql
CREATE TABLE IF NOT EXISTS skill_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id TEXT NOT NULL,
  code TEXT NOT NULL,
  recipient_name TEXT DEFAULT '고객',
  discount_label TEXT DEFAULT '',
  expiry_date TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 쿠폰 코드 중복 방지 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS skill_coupons_code_idx ON skill_coupons(code);

-- 봇별 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS skill_coupons_bot_id_idx ON skill_coupons(bot_id);

-- RLS 활성화
ALTER TABLE skill_coupons ENABLE ROW LEVEL SECURITY;

-- Service Role 전체 허용
CREATE POLICY "service_role_full" ON skill_coupons
  FOR ALL USING (auth.role() = 'service_role');
```

### 2. 환경 변수 확인

`.env.local` 또는 Vercel 환경 변수에 다음이 설정되어 있어야 합니다:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. `skill-integrations.js`에 핸들러 연결

`api/skill-integrations.js`의 `switch(skillId)` 블록에 이미 `coupon` 케이스가 있습니다. `handleCoupon` 함수가 이 파일의 로직을 사용합니다.

---

## API 사용법

모든 요청은 `POST /api/skill-integrations`로 전송합니다.

### 헤더

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### 쿠폰 발급 (issue)

**요청:**
```json
{
  "skillId": "coupon",
  "action": "issue",
  "botId": "bot_abc123",
  "payload": {
    "recipientName": "홍길동",
    "expiryDays": 30,
    "discountLabel": "10% 할인"
  }
}
```

**응답:**
```json
{
  "success": true,
  "code": "MCW-A3F9C2",
  "expiryDate": "2026년 4월 28일",
  "expiryDays": 30,
  "recipientName": "홍길동",
  "persisted": true,
  "message": "홍길동님께 쿠폰이 발급되었습니다!\n쿠폰 코드: **MCW-A3F9C2** (10% 할인)\n유효기간: 2026년 4월 28일까지"
}
```

**payload 파라미터:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `recipientName` | string | 아니오 | '고객' | 수령인 이름 |
| `expiryDays` | number | 아니오 | 30 | 유효기간 (일) |
| `discountLabel` | string | 아니오 | '' | 할인 설명 (예: '10% 할인') |

### 쿠폰 유효성 검증 (validate)

**요청:**
```json
{
  "skillId": "coupon",
  "action": "validate",
  "botId": "bot_abc123",
  "payload": {
    "code": "MCW-A3F9C2"
  }
}
```

**응답 (유효):**
```json
{
  "valid": true,
  "code": "MCW-A3F9C2",
  "expiryDate": "2026년 4월 28일",
  "remainingDays": 30,
  "message": "유효한 쿠폰입니다! — 10% 할인\n유효기간: 2026년 4월 28일까지 (30일 남음)"
}
```

**응답 (이미 사용됨):**
```json
{
  "valid": false,
  "code": "MCW-A3F9C2",
  "usedAt": "2026-03-20T10:00:00.000Z",
  "message": "이미 사용된 쿠폰입니다. (코드: MCW-A3F9C2)"
}
```

**응답 (만료):**
```json
{
  "valid": false,
  "code": "MCW-A3F9C2",
  "expiryDate": "2026년 3월 1일",
  "message": "만료된 쿠폰입니다. (유효기간: 2026년 3월 1일까지)"
}
```

**응답 (코드 없음):**
```json
{
  "valid": false,
  "code": "MCW-XXXXXX",
  "message": "입력하신 쿠폰 코드(MCW-XXXXXX)를 찾을 수 없습니다."
}
```

---

## Supabase 테이블 구조

### `skill_coupons`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK, 자동 생성 |
| `bot_id` | TEXT | 봇 식별자 |
| `code` | TEXT | 쿠폰 코드 (UNIQUE, MCW-XXXXXX) |
| `recipient_name` | TEXT | 수령인 이름 |
| `discount_label` | TEXT | 할인 설명 |
| `expiry_date` | TIMESTAMPTZ | 유효기간 |
| `is_used` | BOOLEAN | 사용 여부 |
| `used_at` | TIMESTAMPTZ | 사용 시각 |
| `created_at` | TIMESTAMPTZ | 발급 시각 |

---

## 동작 흐름

```
사용자: "할인 쿠폰 있나요?"
    ↓
AI 판단: 쿠폰 발급 적절 → issue 액션 호출
    ↓
generateCouponCode() → MCW-A3F9C2
    ↓
유효기간 계산 (now + expiryDays)
    ↓
Supabase skill_coupons INSERT
    ↓
AI 응답: "MCW-A3F9C2 쿠폰이 발급되었습니다. 유효기간: 2026년 4월 28일"
```

---

## 폴백 동작

Supabase 저장 실패 시에도 쿠폰 코드는 정상 반환됩니다 (`persisted: false`).
단, 저장되지 않은 쿠폰은 validate 시 '찾을 수 없음'으로 처리됩니다.

---

## 쿠폰 사용 처리

쿠폰 사용 후 `is_used` 상태를 갱신하려면 `handler.js`의 `markCouponUsed` 함수를 직접 호출합니다:

```js
import { markCouponUsed } from '../skill-market/integration-skills/coupon/handler.js';

// validate 성공 후 실제 사용 처리
const ok = await markCouponUsed('MCW-A3F9C2', botId);
```

이 함수는 `skill-integrations.js` API를 거치지 않고 서버 내부에서 직접 호출합니다.

---

## 트러블슈팅

**Q. 쿠폰 발급은 성공했는데 validate 시 "찾을 수 없음" 오류**
- Supabase 연결 실패로 인해 폴백 모드(`persisted: false`)로 발급된 경우입니다.
- 응답의 `persisted` 필드를 확인하세요. `false`이면 DB에 저장되지 않은 코드입니다.
- Supabase 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)를 점검하세요.

**Q. `skill_coupons` 테이블이 없다는 오류**
- Supabase 대시보드에서 `skill_coupons` 테이블이 존재하는지 확인하세요.
- 테이블 생성 SQL은 이 README 상단의 "Supabase 테이블 구조" 섹션을 참고하세요.
- RLS(Row Level Security)가 활성화된 경우 `service_role` 키를 사용해야 합니다.

**Q. 동일 사용자에게 쿠폰이 중복 발급됨**
- `systemPrompt`의 "한 대화에서 동일 사용자에게 쿠폰을 중복 발급하지 않습니다" 규칙은 AI 판단에 의존합니다.
- 코드 레벨 중복 방지가 필요하면 `botId + recipientName` 기준 중복 검사 로직을 `issueCoupon` 함수에 추가하세요.

**Q. Vercel 환경에서 `SUPABASE_SERVICE_ROLE_KEY` 읽기 실패**
- Vercel 프로젝트 설정 → Environment Variables에서 키가 `Production` 환경에 등록됐는지 확인하세요.
- 환경 변수 추가 후 반드시 재배포(Redeploy)해야 적용됩니다.

---

## 관련 파일

- `skill.json` — 메타데이터 및 systemPrompt
- `handler.js` — 쿠폰 발급/검증 로직 (`handleCoupon`, `markCouponUsed` export)
- `api/skill-integrations.js` — 메인 API 핸들러의 `coupon` 케이스
