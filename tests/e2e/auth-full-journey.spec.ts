/**
 * 회원가입 → 이메일 인증(수동) → 로그인 → 비밀번호 재설정 전체 플로우
 *
 * 사용법:
 *   TEST_BASE_URL=https://mychatbot.world \
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... TEST_NEW_PASSWORD=... \
 *   npx playwright test tests/e2e/auth-full-journey.spec.ts --project=chromium --reporter=list
 *
 * 각 테스트는 독립이 아니라 '설계된 순서'로 실행되어야 함 (--workers=1 권장).
 * 일부 단계(이메일 인증, 재설정 링크 클릭)는 PO가 수동으로 해야 하므로
 * 해당 지점에서 테스트가 의도적으로 멈추고 안내 출력을 남김.
 */
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_USER_EMAIL ?? '';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
const NEW_PASSWORD = process.env.TEST_NEW_PASSWORD ?? '';

test.describe.configure({ mode: 'serial' });

test.describe('Auth Full Journey', () => {

  test('1) 회원가입 — 입력 폼 제출 → "인증 이메일 발송" 화면', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'env missing');

    await page.goto('/signup');
    await expect(page.getByPlaceholder('이메일 주소를 입력하세요')).toBeVisible();

    await page.getByPlaceholder('이메일 주소를 입력하세요').fill(EMAIL);
    await page.getByPlaceholder('표시될 이름을 입력하세요').fill('E2E테스터');
    await page.getByPlaceholder('6자 이상 입력하세요').fill(PASSWORD);
    await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill(PASSWORD);
    await page.getByRole('button', { name: '가입하기' }).click();

    // 성공 화면: "인증 이메일 발송 완료"
    await expect(page.getByText('인증 이메일 발송 완료', { exact: false })).toBeVisible({ timeout: 15_000 });
    console.log('  [RESULT] 회원가입 제출 OK → 인증 이메일 발송 화면 노출');
  });

  test('3) 정상 로그인 — 세션 쿠키 발급 + 리다이렉트', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'env missing');

    await page.goto('/login');
    await page.getByPlaceholder('이메일 주소를 입력하세요').fill(EMAIL);
    await page.getByPlaceholder('비밀번호를 입력하세요').fill(PASSWORD);
    await page.getByRole('button', { name: '로그인', exact: true }).click();

    // /login 벗어나면 성공
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
    const cookies = await page.context().cookies();
    const authCookie = cookies.find((c) => c.name.includes('auth-token'));
    console.log(`  [RESULT] 최종 URL: ${page.url()}`);
    console.log(`  [RESULT] auth 쿠키: ${authCookie ? authCookie.name : 'NONE'}`);
    expect(authCookie).toBeDefined();
  });

  test('4) 비밀번호 재설정 이메일 발송 요청', async ({ page }) => {
    test.skip(!EMAIL, 'env missing');

    await page.goto('/reset-password');
    await page.getByPlaceholder('가입한 이메일을 입력하세요').fill(EMAIL);
    await page.getByRole('button', { name: '재설정 링크 보내기' }).click();

    // 성공 화면 확인
    await expect(page.getByText('이메일 발송 완료', { exact: false })).toBeVisible({ timeout: 15_000 });
    const body = await page.locator('body').innerText();
    console.log(`  [RESULT] 재설정 이메일 발송 화면: ${body.slice(0, 200).replace(/\s+/g, ' ')}`);
  });
});
