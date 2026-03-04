# /api-test-core

> **SAL Grid Dev Suite** — API 엔드포인트 기능/성능/보안 테스트 전문 스킬
>
> **사용 시점**: API 엔드포인트 신규 구현 후, 기능 검증, 부하 테스트, 보안 취약점 점검이 필요할 때
> **적용 대상**: Vanilla 및 React/Next.js 모두 적용 가능

---

## 원칙 요약

- **허용**: CLI로 테스트 실행, 자동화 스크립트, 결과 파일 저장
- **금지**: Postman GUI 수동 테스트, 브라우저 수동 호출, 사용자에게 수동 테스트 요청
- **역할**: 엔드포인트 기능 검증 · Request/Response 형식 확인 · 에러 핸들링 테스트 · 인증/인가 확인
- **주의**: 부하 테스트·성능 측정은 `/performance-check-core` 스킬 사용

---

## API 테스트 설정

### 의존성 설치
```bash
# 프로젝트 루트로 이동 후 실행
npm install -D jest @types/jest
npm install -D supertest @types/supertest
npm install -D node-mocks-http
```

### Jest 설정

**React/Next.js 프로젝트**
```javascript
// jest.config.api.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/api/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/api/setup.ts'],
  collectCoverageFrom: ['src/app/api/**/*.ts'],
};
```

**Vanilla/Express 프로젝트**
```javascript
// jest.config.api.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/api/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/api/setup.js'],
  collectCoverageFrom: ['api/**/*.js'],
};
```

---

## API 테스트 실행

```bash
# 모든 API 테스트 실행
npm test -- --config=jest.config.api.js

# 특정 엔드포인트만
npm test -- --config=jest.config.api.js items

# Watch 모드
npm test -- --config=jest.config.api.js --watch

# 커버리지 포함
npm test -- --config=jest.config.api.js --coverage
```

---

## 엔드포인트별 테스트

### 1. GET /api/items - 목록 조회

```typescript
// tests/api/items/get.test.ts (React/Next.js)
import { GET } from '@/app/api/items/route';
import { NextRequest } from 'next/server';

// Supabase 모킹
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        range: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [
              { id: '1', name: '항목 A', status: 'active', score: 4.5 },
              { id: '2', name: '항목 B', status: 'pending', score: 4.2 },
            ],
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('GET /api/items', () => {
  it('should return list of items', async () => {
    const request = new NextRequest('http://localhost:3000/api/items');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toMatchObject({
      id: '1',
      name: '항목 A',
    });
  });

  it('should support pagination', async () => {
    const request = new NextRequest('http://localhost:3000/api/items?page=2&limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.limit).toBe(10);
  });

  it('should filter by status', async () => {
    const request = new NextRequest('http://localhost:3000/api/items?status=active');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.data.forEach((item: any) => {
      expect(item.status).toBe('active');
    });
  });

  it('should validate page parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/items?page=-1');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid page parameter',
    });
  });

  it('should handle database errors', async () => {
    jest.mock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({
            data: null,
            error: new Error('Database connection failed'),
          })),
        })),
      })),
    }));

    const request = new NextRequest('http://localhost:3000/api/items');
    const response = await GET(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Internal server error',
    });
  });
});
```

**Vanilla/Express 버전 (Supertest)**
```javascript
// tests/api/items/get.test.js
const request = require('supertest');
const app = require('../../../app');

describe('GET /api/items', () => {
  it('should return list of items', async () => {
    const res = await request(app)
      .get('/api/items')
      .expect(200);

    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should support pagination', async () => {
    const res = await request(app)
      .get('/api/items?page=2&limit=10')
      .expect(200);

    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(10);
  });

  it('should validate page parameter', async () => {
    await request(app)
      .get('/api/items?page=-1')
      .expect(400);
  });
});
```

---

### 2. POST /api/items - 항목 생성

```typescript
// tests/api/items/post.test.ts
import { POST } from '@/app/api/items/route';
import { NextRequest } from 'next/server';

describe('POST /api/items', () => {
  const validPayload = {
    name: '새 항목',
    description: '항목에 대한 설명입니다. 최소 길이를 초과합니다.',
    category: 'general',
    score: 4.5,
  };

  it('should create item', async () => {
    const request = new NextRequest('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toMatchObject({
      name: validPayload.name,
      description: validPayload.description,
    });
  });

  it('should require authentication', async () => {
    jest.mock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => ({
        auth: {
          getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
        },
      })),
    }));

    const request = new NextRequest('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Unauthorized',
    });
  });

  it('should validate score range', async () => {
    const invalidPayload = { ...validPayload, score: 6 };

    const request = new NextRequest('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Score must be between 0 and 5',
    });
  });

  it('should validate description length', async () => {
    const invalidPayload = { ...validPayload, description: '짧음' };

    const request = new NextRequest('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('Description must be at least'),
    });
  });

  it('should validate id format (UUID)', async () => {
    const invalidPayload = { ...validPayload, parent_id: 'invalid-uuid' };

    const request = new NextRequest('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('Invalid id format'),
    });
  });

  it('should prevent duplicate entries', async () => {
    jest.mock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => ({
        auth: {
          getUser: jest.fn(() => Promise.resolve({
            data: { user: { id: 'user123' } },
          })),
        },
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({
                data: [{ id: 'existing-entry' }],
                error: null,
              })),
            })),
          })),
        })),
      })),
    }));

    const request = new NextRequest('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('already exists'),
    });
  });
});
```

---

### 3. PUT /api/items/[id] - 항목 수정

```typescript
// tests/api/items/put.test.ts
import { PUT } from '@/app/api/items/[id]/route';
import { NextRequest } from 'next/server';

describe('PUT /api/items/[id]', () => {
  const itemId = '123e4567-e89b-12d3-a456-426614174000';

  it('should update item', async () => {
    const request = new NextRequest(`http://localhost:3000/api/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: '수정된 항목',
        score: 5,
      }),
    });

    const response = await PUT(request, { params: { id: itemId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.score).toBe(5);
    expect(data.data.name).toBe('수정된 항목');
  });

  it('should require ownership', async () => {
    jest.mock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => ({
        auth: {
          getUser: jest.fn(() => Promise.resolve({
            data: { user: { id: 'user123' } },
          })),
        },
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: { user_id: 'other-user' },
              error: null,
            })),
          })),
        })),
      })),
    }));

    const request = new NextRequest(`http://localhost:3000/api/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ score: 5 }),
    });

    const response = await PUT(request, { params: { id: itemId } });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'Forbidden',
    });
  });

  it('should handle not found', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const request = new NextRequest(`http://localhost:3000/api/items/${nonExistentId}`, {
      method: 'PUT',
      body: JSON.stringify({ score: 5 }),
    });

    const response = await PUT(request, { params: { id: nonExistentId } });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Item not found',
    });
  });
});
```

---

### 4. DELETE /api/items/[id] - 항목 삭제

```typescript
// tests/api/items/delete.test.ts
import { DELETE } from '@/app/api/items/[id]/route';
import { NextRequest } from 'next/server';

describe('DELETE /api/items/[id]', () => {
  const itemId = '123e4567-e89b-12d3-a456-426614174000';

  it('should delete item', async () => {
    const request = new NextRequest(`http://localhost:3000/api/items/${itemId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: itemId } });

    expect(response.status).toBe(204);
  });

  it('should require authentication', async () => {
    const request = new NextRequest(`http://localhost:3000/api/items/${itemId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: itemId } });

    expect(response.status).toBe(401);
  });

  it('should require ownership', async () => {
    const request = new NextRequest(`http://localhost:3000/api/items/${itemId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: itemId } });

    expect(response.status).toBe(403);
  });
});
```

---

## 성능 / 부하 테스트

> **부하 테스트 / 성능 측정은 `/performance-check-core` 스킬을 사용하세요.**
> 이 스킬은 API 기능 정확성 테스트(단위·통합·계약 테스트)에 집중합니다.

---

## 보안 테스트

### SQL Injection 테스트
```typescript
// tests/api/security/sql-injection.test.ts
describe('SQL Injection Prevention', () => {
  it('should prevent SQL injection in search', async () => {
    const maliciousInput = "'; DROP TABLE items; --";

    const request = new NextRequest(
      `http://localhost:3000/api/items?search=${encodeURIComponent(maliciousInput)}`
    );

    const response = await GET(request);

    // 에러가 발생하지 않고 안전하게 처리되어야 함
    expect(response.status).toBe(200);
  });
});
```

### XSS 테스트
```typescript
// tests/api/security/xss.test.ts
describe('XSS Prevention', () => {
  it('should sanitize text input', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';

    const request = new NextRequest('http://localhost:3000/api/items', {
      method: 'POST',
      body: JSON.stringify({
        name: maliciousInput,
        description: '정상적인 설명입니다.',
        score: 4,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // 스크립트 태그가 이스케이프되거나 제거되어야 함
    if (data.data) {
      expect(data.data.name).not.toContain('<script>');
    }
  });
});
```

### Rate Limiting 테스트
```typescript
// tests/api/security/rate-limit.test.ts
describe('Rate Limiting', () => {
  it('should rate limit excessive requests', async () => {
    const requests = Array.from({ length: 100 }, () =>
      GET(new NextRequest('http://localhost:3000/api/items'))
    );

    const responses = await Promise.all(requests);

    // 일부 요청은 429 (Too Many Requests) 반환해야 함
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

## API 테스트 보고서 템플릿

```markdown
# API 테스트 보고서

**테스트 날짜**: [YYYY-MM-DD HH:mm:ss]
**테스트 환경**: Local Development
**실행자**: Claude Code
**프로젝트**: {PROJECT_NAME}

---

## 요약

### 전체 결과
- 통과: 45개
- 실패: 2개
- **통과율**: 96%

### 카테고리별 결과
- 기능 테스트: 40/42 (95%)
- 보안 테스트: 0/0 (N/A)
- 성능/부하 테스트: `/performance-check-core` 스킬로 별도 수행

---

## 엔드포인트별 테스트 결과

### GET /api/items
- 목록 조회
- 페이지네이션
- 상태 필터
- 입력 검증
- 에러 핸들링

### POST /api/items
- 항목 생성
- 인증 확인
- 점수 범위 검증
- 설명 길이 검증
- UUID 형식 검증
- 중복 항목 방지

### PUT /api/items/[id]
- 항목 수정
- 소유권 확인
- Not Found 처리

### DELETE /api/items/[id]
- 항목 삭제
- 인증 확인
- 소유권 확인

---

## 실패 테스트 상세

### 1. POST /api/items - 점수 범위 검증

**에러**:
```
Expected: 400
Received: 201
```

**원인**: score 값이 범위 초과 시 검증 로직이 작동하지 않음

**수정 방안**: 입력 검증 미들웨어 또는 API 핸들러 내 검증 로직 추가

---

## 성능 테스트 결과

### 응답 시간

| 엔드포인트 | 평균 | P50 | P95 | P99 |
|-----------|------|-----|-----|-----|
| GET /api/items | 85ms | 78ms | 120ms | 145ms |
| POST /api/items | 110ms | 95ms | 180ms | 220ms |
| PUT /api/items/[id] | 92ms | 85ms | 135ms | 160ms |
| DELETE /api/items/[id] | 65ms | 58ms | 95ms | 115ms |

### 부하 테스트 (Artillery)

**시나리오**: 100 req/s, 2분간

- 총 요청: 12,000
- 성공: 11,950 (99.6%)
- 실패: 50 (0.4%)
- 평균 응답 시간: 95ms
- P95: 180ms
- P99: 250ms

---

## 보안 테스트 결과

- SQL Injection 방어: 통과
- XSS 방어: 통과
- Rate Limiting: 미구현 (주의)

---

## 액션 아이템

### 즉시 수정 (P0)
- [ ] 점수 검증 로직 수정
- [ ] 중복 방지 로직 구현

### 단기 개선 (P1)
- [ ] Rate Limiting 구현
- [ ] API 문서 자동 생성 (OpenAPI/Swagger)

### 중기 개선 (P2)
- [ ] 성능 모니터링 대시보드
- [ ] 자동화된 부하 테스트 CI 통합

---

## 다음 테스트 일정

**권장 주기**: 커밋마다 (CI)
**다음 전체 테스트**: [YYYY-MM-DD]
```

---

## API 테스트 자동화 스크립트

```bash
#!/bin/bash
# run-api-tests.sh

echo "API 테스트 시작..."

# 1. 기능 테스트
echo "\n기능 테스트 실행 중..."
npm test -- --config=jest.config.api.js --coverage

# 2. 보안 테스트
echo "\n보안 테스트 실행 중..."
npm test -- --config=jest.config.api.js --testPathPattern=security

echo "\n모든 API 기능 테스트 완료! (부하 테스트는 /performance-check-core 스킬 사용)"
```

---

**이 스킬을 활성화하면, 이 프로젝트의 모든 API 엔드포인트를 체계적으로 테스트하여 안정성과 성능을 보장합니다.**
