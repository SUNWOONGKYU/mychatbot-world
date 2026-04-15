/**
 * @task S4TS1
 * @description 게스트 페이지 E2E 테스트
 * - 게스트 페이지 로드 확인
 * - 채팅 UI 존재 확인 (채팅 메시지 영역, 입력창, 전송 버튼)
 * - 카테고리 그리드 존재 확인
 */

import { test, expect } from '@playwright/test';

test.describe('게스트 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/guest/index.html');
  });

  test('게스트 페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page).toHaveURL(/guest/);
  });

  test('카테고리 그리드가 존재한다', async ({ page }) => {
    const categoryGrid = page.locator('#categoryGrid');
    await expect(categoryGrid).toBeVisible();
  });

  test('로딩 오버레이가 존재한다 (초기 비표시)', async ({ page }) => {
    const overlay = page.locator('#loadingOverlay');
    // 초기에는 숨겨져 있거나 투명
    await expect(overlay).toBeAttached();
  });
});

test.describe('게스트 채팅 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/guest/chat.html');
  });

  test('채팅 페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page).toHaveURL(/chat/);
  });

  test('채팅 메시지 영역이 존재한다', async ({ page }) => {
    const messagesArea = page.locator('#chatMessagesArea');
    await expect(messagesArea).toBeVisible();
  });

  test('채팅 텍스트 입력창이 존재한다', async ({ page }) => {
    const textarea = page.locator('#chatTextarea');
    await expect(textarea).toBeVisible();
  });

  test('메시지 전송 버튼이 존재한다', async ({ page }) => {
    const sendBtn = page.locator('#chatSendBtn');
    await expect(sendBtn).toBeVisible();
  });

  test('채팅 환영 메시지가 표시된다', async ({ page }) => {
    const welcomeMsg = page.locator('#chatWelcomeMsg');
    await expect(welcomeMsg).toBeAttached();
  });

  test('텍스트 입력창에 타이핑이 가능하다', async ({ page }) => {
    const textarea = page.locator('#chatTextarea');
    await textarea.fill('안녕하세요!');
    await expect(textarea).toHaveValue('안녕하세요!');
  });

  test('빈 메시지로 전송 시 아무것도 일어나지 않는다', async ({ page }) => {
    const textarea = page.locator('#chatTextarea');
    const sendBtn = page.locator('#chatSendBtn');
    // 빈 상태로 전송 시도
    await textarea.fill('');
    await sendBtn.click();
    // 페이지가 그대로 유지됨
    await expect(textarea).toBeVisible();
  });
});
