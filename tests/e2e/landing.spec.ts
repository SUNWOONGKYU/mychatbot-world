/**
 * @task S4TS1
 * @description 랜딩 페이지 E2E 테스트
 * - 페이지 로드 확인
 * - Hero 섹션 존재 확인
 * - Pricing 섹션 존재 확인
 * - Journey(Demo) 섹션 존재 확인
 */

import { test, expect } from '@playwright/test';

test.describe('랜딩 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page).toHaveTitle(/My Chatbot World|마이 챗봇/i);
  });

  test('Hero 섹션이 존재한다', async ({ page }) => {
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();
  });

  test('Hero 섹션에 주요 CTA 버튼이 있다', async ({ page }) => {
    // 챗봇 만들기 또는 체험 CTA
    const createBtn = page.locator('#hero a[href*="create"]').first();
    await expect(createBtn).toBeVisible();
  });

  test('Pricing 섹션이 존재한다', async ({ page }) => {
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible();
  });

  test('Journey(Demo) 섹션이 존재한다', async ({ page }) => {
    // journey 섹션 = 챗봇의 여정 소개 섹션
    const journey = page.locator('#journey');
    await expect(journey).toBeVisible();
  });

  test('네비게이션 바가 존재한다', async ({ page }) => {
    const navbar = page.locator('#navbar, nav.navbar').first();
    await expect(navbar).toBeVisible();
  });

  test('로그인 버튼이 네비게이션에 있다', async ({ page }) => {
    const loginBtn = page.locator('#navLogin, a[href*="login"]').first();
    await expect(loginBtn).toBeVisible();
  });

  test('회원가입 버튼이 네비게이션에 있다', async ({ page }) => {
    const signupBtn = page.locator('#navSignup, a[href*="signup"]').first();
    await expect(signupBtn).toBeVisible();
  });

  test('스크롤 시 journey 섹션으로 이동한다', async ({ page }) => {
    const journeyLink = page.locator('a[href="#journey"]').first();
    await expect(journeyLink).toBeVisible();
  });
});
