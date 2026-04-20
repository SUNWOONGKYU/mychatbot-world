/**
 * @task S5T2
 * @description 인증 플로우 E2E Happy Path 테스트
 *
 * 시나리오:
 * 1. 회원가입 페이지 접근 + 폼 유효성 검증
 * 2. 로그인 페이지 접근 + 폼 렌더링 확인
 * 3. 약관/개인정보 링크 접근 가능 확인
 * 4. health 엔드포인트 확인
 */

import { test, expect } from '@playwright/test';

test.describe('회원가입 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
  });

  test('필수 입력 필드가 모두 존재한다', async ({ page }) => {
    await expect(page.getByLabel(/이메일/)).toBeVisible();
    await expect(page.getByLabel(/이름.*닉네임/)).toBeVisible();
    await expect(page.getByLabel(/^비밀번호$/)).toBeVisible();
    await expect(page.getByLabel(/비밀번호 확인/)).toBeVisible();
  });

  test('필수 동의 체크박스가 존재한다', async ({ page }) => {
    await expect(page.getByText(/이용약관/)).toBeVisible();
    await expect(page.getByText(/개인정보처리방침/)).toBeVisible();
    await expect(page.getByText(/마케팅 정보 수신/)).toBeVisible();
  });

  test('빈 폼 제출 시 유효성 에러가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: '가입하기' }).click();
    await expect(page.getByText(/이메일을 입력해 주세요/)).toBeVisible();
  });

  test('비밀번호 불일치 시 에러가 표시된다', async ({ page }) => {
    await page.getByLabel(/이메일/).fill('test@example.com');
    await page.getByLabel(/이름.*닉네임/).fill('테스터');
    await page.getByLabel(/^비밀번호$/).fill('password123');
    await page.getByLabel(/비밀번호 확인/).fill('differentpassword');
    await page.getByRole('button', { name: '가입하기' }).click();
    await expect(page.getByText(/비밀번호가 일치하지 않습니다/)).toBeVisible();
  });

  test('동의 미체크 시 에러가 표시된다', async ({ page }) => {
    await page.getByLabel(/이메일/).fill('test@example.com');
    await page.getByLabel(/이름.*닉네임/).fill('테스터');
    await page.getByLabel(/^비밀번호$/).fill('password123');
    await page.getByLabel(/비밀번호 확인/).fill('password123');
    await page.getByRole('button', { name: '가입하기' }).click();
    await expect(page.getByText(/이용약관 및 개인정보처리방침에 동의해 주세요/)).toBeVisible();
  });

  test('로그인 페이지 링크가 존재한다', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: '로그인' });
    await expect(loginLink).toBeVisible();
  });
});

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('이메일, 비밀번호 필드가 존재한다', async ({ page }) => {
    await expect(page.getByLabel(/이메일/)).toBeVisible();
    await expect(page.getByLabel(/비밀번호/)).toBeVisible();
  });

  test('회원가입 링크가 존재한다', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /회원가입/ });
    await expect(signupLink).toBeVisible();
  });
});

test.describe('약관 및 정책 페이지', () => {
  test('이용약관 페이지에 접근 가능하다', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/error|404/);
  });

  test('개인정보처리방침 페이지에 접근 가능하다', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/error|404/);
  });

  test('보안 정책 페이지에 접근 가능하다', async ({ page }) => {
    await page.goto('/security');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('API Health', () => {
  test('GET /api/health 가 200을 반환한다', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('mychatbot-world');
    expect(body.timestamp).toBeTruthy();
  });
});

test.describe('security.txt', () => {
  test('/.well-known/security.txt 가 접근 가능하다', async ({ request }) => {
    const res = await request.get('/.well-known/security.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Contact:');
    expect(body).toContain('Expires:');
  });
});
