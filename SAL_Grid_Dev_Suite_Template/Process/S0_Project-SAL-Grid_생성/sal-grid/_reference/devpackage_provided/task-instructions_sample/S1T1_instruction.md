# Task Instruction - S1T1

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
S1T1

## Task Name
테스트 환경 설정

## Task Goal
Jest/Vitest 및 Playwright 테스트 환경 구축

## Prerequisites (Dependencies)
- S1F1 (Vercel 프로젝트 설정) 완료

## Specific Instructions

### 1. 테스트 디렉토리 구조
```
P3_프로토타입_제작/Frontend/Prototype/
├── tests/
│   ├── unit/           # 단위 테스트
│   ├── integration/    # 통합 테스트
│   └── e2e/            # E2E 테스트 (Playwright)
├── jest.config.js      # Jest 설정
├── playwright.config.js # Playwright 설정
└── package.json        # 테스트 스크립트
```

### 2. package.json 테스트 의존성 추가
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0"
  },
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 3. Jest 설정 (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true
};
```

### 4. Playwright 설정 (playwright.config.js)
```javascript
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } }
  ]
});
```

### 5. 샘플 테스트 파일 생성
- `tests/unit/sample.test.js` - 기본 단위 테스트
- `tests/e2e/homepage.spec.js` - 홈페이지 E2E 테스트

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/jest.config.js`
- `P3_프로토타입_제작/Frontend/Prototype/playwright.config.js`
- `P3_프로토타입_제작/Frontend/Prototype/tests/unit/sample.test.js`
- `P3_프로토타입_제작/Frontend/Prototype/tests/e2e/homepage.spec.js`
- `P3_프로토타입_제작/Frontend/Prototype/package.json` (업데이트)

## Completion Criteria
- [ ] Jest 설정 파일 생성
- [ ] Playwright 설정 파일 생성
- [ ] 테스트 디렉토리 구조 생성
- [ ] 샘플 테스트 파일 생성
- [ ] npm test 실행 성공
- [ ] npm run test:e2e 실행 성공

## Tech Stack
- Jest
- Playwright
- Node.js

## Task Agent
`test-engineer`

## Verification Agent
`qa-specialist`

## Tools
- Write, Read
- Bash (npm install, npm test)

## Execution Type
AI-Only

## Remarks
- E2E 테스트는 로컬 서버 실행 필요
- CI/CD에서는 headless 모드로 실행
- 코드 커버리지 목표: 80% 이상

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content

