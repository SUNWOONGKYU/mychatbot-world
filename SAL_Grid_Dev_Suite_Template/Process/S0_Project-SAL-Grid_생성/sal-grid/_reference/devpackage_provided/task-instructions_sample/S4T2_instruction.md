# Task Instruction - S4T2

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S4T2

## Task Name
API 통합 테스트

## Task Goal
모든 Serverless API 엔드포인트 통합 테스트 작성 및 실행

## Prerequisites (Dependencies)
- S4BA2 (결제 웹훅 API) 완료

## Specific Instructions

### 1. Jest 설정
- 위치: `jest.config.js`

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
};
```

### 2. 테스트 설정
- 위치: `tests/setup.js`

```javascript
// tests/setup.js
require('dotenv').config({ path: '.env.test' });

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

global.BASE_URL = BASE_URL;
global.testToken = null;

// 테스트 전 인증 토큰 획득
beforeAll(async () => {
  // 테스트 사용자 로그인
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD
    })
  });
  const data = await response.json();
  global.testToken = data.access_token;
});
```

### 3. 인증 API 테스트
- 위치: `tests/integration/auth.test.js`

```javascript
// tests/integration/auth.test.js
describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    test('should create new user', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test_${Date.now()}@example.com`,
          password: 'Test1234!@#'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
    });

    test('should reject invalid email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'Test1234!@#'
        })
      });

      expect(response.status).toBe(400);
    });

    test('should reject weak password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123'
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.access_token).toBeDefined();
    });
  });
});
```

### 4. 구독 API 테스트
- 위치: `tests/integration/subscription.test.js`

```javascript
// tests/integration/subscription.test.js
describe('Subscription API', () => {
  describe('GET /api/subscription/status', () => {
    test('should return subscription status', async () => {
      const response = await fetch(`${BASE_URL}/api/subscription/status`, {
        headers: { 'Authorization': `Bearer ${global.testToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBeDefined();
    });

    test('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/subscription/status`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/subscription/create', () => {
    test('should create subscription request', async () => {
      const response = await fetch(`${BASE_URL}/api/subscription/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${global.testToken}`
        },
        body: JSON.stringify({
          plan: 'basic',
          period: 'monthly'
        })
      });

      expect([200, 201]).toContain(response.status);
    });
  });
});
```

### 5. AI API 테스트
- 위치: `tests/integration/ai.test.js`

```javascript
// tests/integration/ai.test.js
describe('AI API', () => {
  describe('POST /api/ai/chat', () => {
    test('should respond with Gemini', async () => {
      const response = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${global.testToken}`
        },
        body: JSON.stringify({
          provider: 'gemini',
          message: 'Hello, test message'
        })
      });

      expect([200, 402]).toContain(response.status); // 200 성공 또는 402 크레딧 부족
    });
  });

  describe('GET /api/ai/health', () => {
    test('should return AI services status', async () => {
      const response = await fetch(`${BASE_URL}/api/ai/health`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.services).toBeDefined();
    });
  });

  describe('GET /api/ai/pricing', () => {
    test('should return AI pricing', async () => {
      const response = await fetch(`${BASE_URL}/api/ai/pricing`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.prices).toBeDefined();
    });
  });
});
```

### 6. 결제 API 테스트
- 위치: `tests/integration/payment.test.js`

```javascript
// tests/integration/payment.test.js
describe('Payment API', () => {
  describe('POST /api/payment/confirm', () => {
    test('should require all fields', async () => {
      const response = await fetch(`${BASE_URL}/api/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });
  });

  describe('POST /api/webhook/toss-payments', () => {
    test('should reject invalid signature', async () => {
      const response = await fetch(`${BASE_URL}/api/webhook/toss-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'toss-signature': 'invalid'
        },
        body: JSON.stringify({ eventType: 'TEST' })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/credit/balance', () => {
    test('should return credit balance', async () => {
      const response = await fetch(`${BASE_URL}/api/credit/balance`, {
        headers: { 'Authorization': `Bearer ${global.testToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data.credit).toBe('number');
    });
  });
});
```

### 7. 프로젝트 API 테스트
- 위치: `tests/integration/projects.test.js`

```javascript
// tests/integration/projects.test.js
describe('Projects API', () => {
  let createdProjectId;

  describe('POST /api/projects', () => {
    test('should create project', async () => {
      const response = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${global.testToken}`
        },
        body: JSON.stringify({
          name: 'Test Project',
          description: 'Integration test project'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.project.id).toBeDefined();
      createdProjectId = data.project.id;
    });
  });

  describe('GET /api/projects', () => {
    test('should return user projects', async () => {
      const response = await fetch(`${BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${global.testToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.projects)).toBe(true);
    });
  });

  describe('PUT /api/projects/:id', () => {
    test('should update project', async () => {
      if (!createdProjectId) return;

      const response = await fetch(`${BASE_URL}/api/projects/${createdProjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${global.testToken}`
        },
        body: JSON.stringify({
          name: 'Updated Project'
        })
      });

      expect(response.status).toBe(200);
    });
  });
});
```

### 8. Health Check API 테스트
- 위치: `tests/integration/health.test.js`

```javascript
// tests/integration/health.test.js
describe('Health Check API', () => {
  describe('GET /api/health', () => {
    test('should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(data.services).toBeDefined();
    });
  });
});
```

### 9. package.json 스크립트
```json
{
  "scripts": {
    "test:api": "jest --config jest.config.js",
    "test:api:watch": "jest --config jest.config.js --watch",
    "test:api:coverage": "jest --config jest.config.js --coverage"
  }
}
```

### 10. 테스트 환경 변수
- 위치: `.env.test`

```
TEST_API_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## Expected Output Files
- `jest.config.js`
- `tests/setup.js`
- `tests/integration/auth.test.js`
- `tests/integration/subscription.test.js`
- `tests/integration/ai.test.js`
- `tests/integration/payment.test.js`
- `tests/integration/projects.test.js`
- `tests/integration/health.test.js`
- `.env.test`

## Completion Criteria
- [ ] Jest 설정 완료
- [ ] 인증 API 테스트 (signup, login)
- [ ] 구독 API 테스트 (status, create)
- [ ] AI API 테스트 (chat, health, pricing)
- [ ] 결제 API 테스트 (confirm, webhook, credit)
- [ ] 프로젝트 API 테스트 (CRUD)
- [ ] Health Check 테스트
- [ ] 모든 테스트 통과
- [ ] 코드 커버리지 80% 이상

## Tech Stack
- Jest
- Node.js
- fetch

## Task Agent
`test-engineer`

## Verification Agent
`qa-specialist`

## Tools
- Write, Read
- Bash (npm test)

## Execution Type
AI-Only

## Remarks
- 테스트 전용 환경 변수 사용 (.env.test)
- 테스트 사용자 사전 생성 필요
- CI/CD 파이프라인 통합 권장
- API Mock 필요한 경우 별도 설정

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S4T2 → `S4_개발-3차/Testing/`

### 제2 규칙: Production 코드는 이중 저장
- 테스트 코드는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
