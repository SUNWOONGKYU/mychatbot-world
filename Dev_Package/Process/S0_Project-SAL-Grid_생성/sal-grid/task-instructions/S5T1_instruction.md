# S5T1: E2E 테스트 환경 구축 (Playwright)

## Task 정보
- **Task ID**: S5T1
- **Task Name**: E2E 테스트 환경 구축 (Playwright)
- **Stage**: S5 (품질 개선)
- **Area**: T (Testing)
- **Dependencies**: S4T4, S4T5

## Task 목표

Playwright를 사용하여 E2E 테스트 환경을 구축한다. 이후 S5T2(Happy Path 테스트), S5T3(API 통합 테스트)의 기반이 된다.

## 구현 범위

### 1. Playwright 설치
```bash
npm install -D @playwright/test
npx playwright install
```

### 2. playwright.config.ts 설정
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. 디렉토리 구조 생성
```
tests/
├── e2e/                    ← Playwright E2E 테스트
│   ├── fixtures/           ← 테스트 픽스처
│   └── helpers/            ← 테스트 헬퍼
└── unit/                   ← 기존 vitest 단위 테스트
```

### 4. GitHub Actions CI 통합
- `.github/workflows/e2e.yml` 추가
- PR 시 E2E 테스트 자동 실행

### 5. 테스트 계정 설정
- `.env.test` 파일에 테스트용 계정 정보
- 테스트 실행 전 DB 시드 데이터 설정

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `playwright.config.ts` | Playwright 설정 |
| `tests/e2e/.gitkeep` | E2E 테스트 디렉토리 |
| `.github/workflows/e2e.yml` | CI 워크플로우 |
| `package.json` | e2e 테스트 스크립트 추가 |

## 완료 기준

- [ ] Playwright 설치 완료
- [ ] `playwright.config.ts` 설정 완료
- [ ] `npm run test:e2e` 명령 실행 가능
- [ ] GitHub Actions CI 통합
- [ ] 최소 1개 샘플 테스트 실행 성공
