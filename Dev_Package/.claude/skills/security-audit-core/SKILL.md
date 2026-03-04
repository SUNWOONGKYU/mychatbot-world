# /security-audit-core

> **SAL Grid Dev Suite** — OWASP Top 10 기반 보안 취약점 검사 및 감사 스킬
>
> **사용 시점**: 프로젝트 배포 전, 인증/인가 구현 후, 의존성 업데이트 후 보안 점검이 필요할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능

---

## 원칙 요약

- **허용**: CLI 보안 스캔 도구 실행, 코드 분석으로 취약점 탐지, 보안 보고서 파일 생성
- **금지**: 웹 기반 스캔 도구 수동 사용, Dashboard 수동 설정 변경, 사용자에게 수동 검토 요청
- **역할**: OWASP Top 10 점검 · 인증/인가 및 RLS 검증 · 민감 정보 보호 · 의존성 취약점 탐지 · 보안 보고서 작성

---

## 보안 감사 프로세스

### 1. 초기 스캔

```bash
# 의존성 취약점 검사 (프로젝트 루트에서 실행)
npm audit

# 고위험 취약점 확인
npm audit --audit-level=high

# 자동 수정 가능한 항목
npm audit fix
```

### 2. OWASP Top 10 체크리스트

#### A01: Broken Access Control (접근 제어 취약점)

**체크 항목**:
- [ ] RLS (Row Level Security) 정책이 모든 테이블에 활성화되었는가?
- [ ] API Routes에 인증 미들웨어가 있는가?
- [ ] 사용자가 자신의 데이터만 접근하는가?
- [ ] 관리자 기능에 역할 기반 접근 제어가 있는가?

**검사 방법** (React/Next.js):
```typescript
// 좋은 예: 인증 확인
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 사용자 데이터만 조회
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id);

  return NextResponse.json({ data });
}

// 나쁜 예: 인증 없음
export async function GET(request: NextRequest) {
  const { data } = await supabase.from('items').select('*'); // 모든 데이터 노출!
  return NextResponse.json({ data });
}
```

**검사 방법** (Vanilla):
```javascript
// 좋은 예: 요청 시 인증 헤더 검증
export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  // ...
}
```

**RLS 정책 확인**:
```sql
-- 테이블별 RLS 활성화 확인
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- RLS 정책 확인
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

#### A02: Cryptographic Failures (암호화 실패)

**체크 항목**:
- [ ] HTTPS 사용 (Vercel 등 배포 플랫폼은 기본 제공)
- [ ] 환경변수에 민감 정보 저장
- [ ] 비밀번호 평문 저장 금지 (Supabase Auth 사용)
- [ ] API 키가 코드에 하드코딩되지 않았는가?

**검사 방법**:
```bash
# 하드코딩된 시크릿 검색 (소스 디렉토리 지정)
grep -r "SUPABASE" --include="*.ts" --include="*.tsx" --include="*.js" src/

# 하드코딩된 비밀번호 검색
grep -r "password\s*=\s*['\"]" --include="*.ts" --include="*.js" src/
```

**환경변수 체크**:
```typescript
// 좋은 예
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 나쁜 예
const supabaseUrl = "https://{SUPABASE_URL}.supabase.co"; // 하드코딩!
```

---

#### A03: Injection (인젝션)

**체크 항목**:
- [ ] SQL Injection 방지 (Supabase 클라이언트 사용)
- [ ] NoSQL Injection 방지
- [ ] Command Injection 방지
- [ ] 사용자 입력 검증

**검사 방법**:
```typescript
// 좋은 예: Supabase 클라이언트 사용 (자동 이스케이프)
const { data } = await supabase
  .from('items')
  .select('*')
  .eq('name', userInput);

// 나쁜 예: 원시 SQL (사용 금지)
const query = `SELECT * FROM items WHERE name = '${userInput}'`; // SQL Injection 위험!
```

**입력 검증 패턴**:
```typescript
import { z } from 'zod';

// Zod를 사용한 입력 검증
const searchSchema = z.object({
  query: z.string().min(1).max(100),
  page: z.number().int().positive().max(1000),
  category: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      query: searchParams.get('query'),
      page: parseInt(searchParams.get('page') || '1'),
      category: searchParams.get('category'),
    };

    const validated = searchSchema.parse(params);

    const { data } = await supabase
      .from('items')
      .select('*')
      .ilike('name', `%${validated.query}%`);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    throw error;
  }
}
```

---

#### A04: Insecure Design (불안전한 설계)

**체크 항목**:
- [ ] 보안이 설계 단계부터 고려되었는가?
- [ ] Threat modeling이 수행되었는가?
- [ ] 최소 권한 원칙이 적용되었는가?
- [ ] 실패 시 안전한 기본값 사용

**검사 예시**:
```typescript
// 좋은 예: 기본적으로 비공개
interface Item {
  id: string;
  user_id: string;
  content: string;
  is_public: boolean; // 기본값: false
}

// RLS 정책: 자신의 항목 또는 공개 항목만 조회
CREATE POLICY "Users can view own or public items"
ON items FOR SELECT
USING (auth.uid() = user_id OR is_public = true);
```

---

#### A05: Security Misconfiguration (보안 설정 오류)

**체크 항목**:
- [ ] CORS 설정이 올바른가?
- [ ] 불필요한 HTTP 헤더가 제거되었는가?
- [ ] 에러 메시지가 과도한 정보를 노출하지 않는가?
- [ ] 개발 도구가 프로덕션에 포함되지 않았는가?

**Next.js 보안 헤더 설정**:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
```

**Vanilla (서버리스 함수) 보안 헤더**:
```javascript
// api/Backend_APIs/some-endpoint.js
export default function handler(req, res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // ...
}
```

**에러 처리**:
```typescript
// 나쁜 예: 상세한 에러 노출
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// 좋은 예: 일반적인 에러 메시지
catch (error) {
  console.error('Internal error:', error); // 로그에만 기록
  return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
}
```

---

#### A06: Vulnerable and Outdated Components (취약한 구성 요소)

**체크 항목**:
- [ ] 의존성이 최신 상태인가?
- [ ] 알려진 취약점이 있는 패키지 사용 중인가?
- [ ] 사용하지 않는 의존성이 제거되었는가?

**자동 검사**:
```bash
# 취약점 검사
npm audit

# 업데이트 가능한 패키지 확인
npm outdated

# 자동 수정
npm audit fix

# 주요 버전 업그레이드 (주의 필요)
npm audit fix --force
```

---

#### A07: Identification and Authentication Failures (인증 실패)

**체크 항목**:
- [ ] 세션 관리가 안전한가?
- [ ] 비밀번호 정책이 강력한가?
- [ ] 다중 인증(MFA) 지원하는가?
- [ ] 세션 고정 공격 방지

**Supabase Auth 체크**:
```typescript
// 좋은 예: 세션 확인
export async function authenticateUser(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

---

#### A08: Software and Data Integrity Failures (무결성 실패)

**체크 항목**:
- [ ] CI/CD 파이프라인이 안전한가?
- [ ] 무결성 검증이 있는가? (SRI, 체크섬)
- [ ] 역직렬화 공격 방지

**예시**:
```typescript
// 좋은 예: 타입 검증
import { z } from 'zod';

const ItemSchema = z.object({
  id: z.string().uuid(),
  value: z.number().min(1).max(5),
  comment: z.string().max(1000),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = ItemSchema.parse(body); // 검증 실패 시 에러
  // ...
}
```

---

#### A09: Security Logging and Monitoring Failures (로깅/모니터링 실패)

**체크 항목**:
- [ ] 중요 이벤트가 로깅되는가?
- [ ] 로그에 민감 정보가 포함되지 않는가?
- [ ] 실패한 로그인 시도를 추적하는가?
- [ ] 비정상적인 패턴 감지

**로깅 패턴**:
```typescript
// 좋은 예: 구조화된 로깅
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request);

  logger.info('Action performed', {
    user_id: user.id,
    timestamp: new Date().toISOString(),
    endpoint: '/api/items',
  });

  // 나쁜 예: 민감 정보 로깅
  // logger.info('User login', { password: '...', email: user.email }); // 절대 금지!
}
```

---

#### A10: Server-Side Request Forgery (SSRF)

**체크 항목**:
- [ ] 외부 URL 요청 시 검증하는가?
- [ ] 내부 네트워크 접근이 차단되었는가?
- [ ] URL 파라미터를 그대로 사용하지 않는가?

**예시**:
```typescript
// 나쁜 예: 검증 없는 외부 요청
export async function POST(request: NextRequest) {
  const { url } = await request.json();
  const response = await fetch(url); // SSRF 위험!
  return NextResponse.json(await response.json());
}

// 좋은 예: URL 검증
const ALLOWED_DOMAINS = ['api.{PROJECT_DOMAIN}', 'api.example.com'];

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  const parsedUrl = new URL(url);

  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
  }

  const response = await fetch(url);
  return NextResponse.json(await response.json());
}
```

---

## Supabase RLS 정책 검증

### RLS 활성화 확인
```bash
# Supabase CLI 사용
npx supabase db dump --table your_table --schema public
```

### 필수 RLS 정책 예시

```sql
-- 1. 공개 데이터 테이블: 모두 읽기, 인증된 사용자만 생성
CREATE POLICY "Anyone can view items"
ON items FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert items"
ON items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 2. 사용자 전용 데이터: 자신의 레코드만 CRUD
CREATE POLICY "Users can view own records"
ON user_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own records"
ON user_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
ON user_data FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
ON user_data FOR DELETE
USING (auth.uid() = user_id);

-- 3. 프로필 테이블: 자신의 프로필만 접근
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

---

## 보안 감사 보고서 템플릿

```markdown
# 보안 감사 보고서

**감사 날짜**: [YYYY-MM-DD]
**감사자**: Claude Code
**프로젝트**: {PROJECT_NAME}

---

## 요약

### 전체 보안 점수: X/100

**위험도 분포**:
- Critical: N개
- High: N개
- Medium: N개
- Low: N개

**OWASP Top 10 준수율**: X%

---

## Critical Issues (즉시 수정 필요)

### 1. [취약점 제목]

**위험도**: Critical
**카테고리**: OWASP A01 - Broken Access Control
**영향도**: 사용자 데이터 무단 접근 가능

**발견 위치**:
- `src/api/items/route.ts:25` (React) 또는 `api/Backend_APIs/items.js:30` (Vanilla)

**취약점 설명**:
[현재 취약한 코드 설명]

**공격 시나리오**:
1. 인증되지 않은 사용자가 API 접근
2. 모든 사용자 데이터 조회 가능
3. 개인정보 유출

**수정 방안**:
[수정된 코드 예시]

**예상 수정 시간**: 30분

---

## OWASP Top 10 체크리스트

- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection
- [ ] A04: Insecure Design
- [ ] A05: Security Misconfiguration
- [ ] A06: Vulnerable Components
- [ ] A07: Authentication Failures
- [ ] A08: Integrity Failures
- [ ] A09: Logging Failures
- [ ] A10: SSRF

---

## 의존성 취약점

**npm audit 결과**:
```
found X vulnerabilities (Y high, Z critical)
```

**조치 필요 패키지**:
1. `package-name@version` - CVE-XXXX-XXXX (Critical)
   - 수정 버전: `X.X.X`
   - 명령어: `npm install package-name@X.X.X`

---

## 권장 사항

### 즉시 조치
1. Critical 취약점 수정
2. RLS 정책 활성화
3. 의존성 업데이트

### 단기 조치 (1주일)
1. High 우선순위 취약점 수정
2. 보안 헤더 추가
3. 입력 검증 강화

### 중기 조치 (1개월)
1. 보안 모니터링 시스템 구축
2. 정기적인 보안 감사 자동화
3. 보안 교육 및 문서화
```

---

## 자동화 스크립트

```bash
#!/bin/bash
# security-audit.sh

echo "보안 감사 시작..."

# 1. 의존성 취약점 검사
echo "의존성 검사 중..."
npm audit --json > audit-report.json

# 2. 환경변수 누출 검사
echo "환경변수 하드코딩 검사 중..."
grep -r "SUPABASE.*=" --include="*.ts" --include="*.tsx" --include="*.js" src/ || echo "환경변수 안전"

# 3. TODO/FIXME 보안 이슈
echo "보안 TODO 확인 중..."
grep -r "TODO.*security\|FIXME.*security" --include="*.ts" --include="*.js" src/

echo "보안 감사 완료!"
```

---

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)

---

**이 스킬을 활성화하면, OWASP Top 10 기반으로 체계적인 보안 감사를 수행하여 이 프로젝트의 보안을 강화합니다.**
