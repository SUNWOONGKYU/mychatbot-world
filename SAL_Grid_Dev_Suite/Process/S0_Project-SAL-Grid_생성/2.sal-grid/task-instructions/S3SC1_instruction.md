# Task Instruction - S3SC1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S3** = 개발 2차 (Additional Development)

### Area 명칭
- **SC** = Security (보안/인증/인가)

---

# Task Instruction - S3SC1

## Task ID
S3SC1

## Task Name
API 인증 미들웨어 (Rate Limiting, CORS 강화)

## Task Goal
Next.js App Router 환경에서 API 보안을 강화하는 미들웨어 모듈을 구현한다. 토큰 버킷 알고리즘 기반 Rate Limiting, CORS 화이트리스트, API 키 검증, 요청 로깅을 포함하여 외부 API 호출로부터 서비스를 보호한다.

## Prerequisites (Dependencies)
- S1SC1 — 기본 인증(Auth) 미들웨어 완료
- S2BA1 — 챗봇 핵심 API 완료 (미들웨어 적용 대상)

## Specific Instructions

### 1. Rate Limiting 미들웨어 (토큰 버킷)

**`lib/middleware/rate-limit.ts`**
```typescript
/**
 * @task S3SC1
 * @description Rate Limiting — 토큰 버킷 알고리즘
 */
import { NextRequest, NextResponse } from 'next/server';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const RATE_LIMIT_CONFIG = {
  maxTokens: 60,        // 분당 최대 60회
  refillRate: 1,        // 초당 1 토큰 보충
  windowMs: 60_000,     // 1분 윈도우
};

export function rateLimitMiddleware(req: NextRequest): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();

  let bucket = buckets.get(ip) ?? { tokens: RATE_LIMIT_CONFIG.maxTokens, lastRefill: now };

  // 토큰 보충
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(
    RATE_LIMIT_CONFIG.maxTokens,
    bucket.tokens + elapsed * RATE_LIMIT_CONFIG.refillRate
  );
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(ip, bucket);
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  bucket.tokens -= 1;
  buckets.set(ip, bucket);
  return null; // 통과
}
```

### 2. CORS 미들웨어 (화이트리스트)

**`lib/middleware/cors.ts`**
```typescript
/**
 * @task S3SC1
 * @description CORS 화이트리스트 미들웨어
 */
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://mychatbot.world',
  'https://www.mychatbot.world',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
].filter(Boolean);

export function corsMiddleware(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin') ?? '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.headers.set('Access-Control-Max-Age', '86400');
  }

  return res;
}
```

### 3. API 키 검증 미들웨어

**`lib/middleware/auth.ts`**
```typescript
/**
 * @task S3SC1
 * @description API 키 검증 미들웨어
 */
import { NextRequest, NextResponse } from 'next/server';

const VALID_API_KEYS = new Set([
  process.env.INTERNAL_API_KEY,
  process.env.PARTNER_API_KEY,
].filter(Boolean) as string[]);

export function apiKeyMiddleware(req: NextRequest): NextResponse | null {
  // 공개 엔드포인트는 통과
  const publicPaths = ['/api/health', '/api/auth'];
  if (publicPaths.some(p => req.nextUrl.pathname.startsWith(p))) {
    return null;
  }

  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // 통과
}
```

### 4. 요청 로깅 미들웨어
- `lib/middleware/logger.ts` 작성
- 로깅 항목: timestamp, method, path, ip, user_agent, status_code
- 개발 환경: console.log, 프로덕션: structured JSON 로그

### 5. middleware.ts에 통합
- `middleware.ts` (루트)에서 위 미들웨어를 순서대로 체이닝
- 순서: CORS → Rate Limit → API Key → Logger

## Expected Output Files
- `Process/S3_개발-2차/Security/lib/middleware/rate-limit.ts`
- `Process/S3_개발-2차/Security/lib/middleware/cors.ts`
- `Process/S3_개발-2차/Security/lib/middleware/auth.ts`
- `Process/S3_개발-2차/Security/lib/middleware/logger.ts`
- `Process/S3_개발-2차/Security/middleware.ts` (수정)

## Completion Criteria
- [ ] Rate Limiting이 분당 60회 초과 시 429 반환
- [ ] CORS 화이트리스트에 없는 오리진 차단
- [ ] API 키 없는 요청 401 반환 (공개 엔드포인트 제외)
- [ ] 요청 로그가 구조화된 형식으로 출력
- [ ] TypeScript 타입 오류 없음
- [ ] 미들웨어 체이닝 순서 올바름

## Tech Stack
- TypeScript, Next.js (App Router)
- Next.js middleware (Edge Runtime)

## Tools
- npm (빌드/타입 검사)

## Task Agent
`security-specialist-core`

## Verification Agent
`security-specialist-core`

## Execution Type
AI-Only

## Remarks
- Edge Runtime 제약 주의: Node.js 전용 API 사용 불가
- `buckets` Map은 서버리스 환경에서 인스턴스 간 공유 안 됨 (분산 환경은 Redis 필요, S4에서 고도화)
- CORS 설정은 환경변수로 관리 권장

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S3SC1 → `Process/S3_개발-2차/Security/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Security/`

---

## 📝 파일 명명 규칙
- kebab-case: `rate-limit.ts`, `cors.ts`, `auth.ts`
- 파일 상단 `@task S3SC1` 주석 필수
