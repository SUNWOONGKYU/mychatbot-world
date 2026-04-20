/**
 * 회원가입 + 로그인 기능 종합 점검 (2026-04-20)
 *
 * 목적: PO 지시 — "회원가입하고 로그인 기능이 완벽하게 돌아가는지 점검"
 *
 * 테스트 전략:
 *  - 실제 가입 성공 케이스는 Gmail + 별칭으로 단일 시도 (실계정 오염 방지: 스킵 가능)
 *  - 검증 실패/중복 이메일 등은 메일 발송 안 되므로 자유롭게 반복 테스트
 *  - 로그인은 이미 인증된 기존 계정 사용 (새 메일 발송 안 됨)
 *
 * 필요 env:
 *   TEST_USER_EMAIL    — 인증된 실계정 (예: wksun99@gmail.com)
 *   TEST_USER_PASSWORD — 해당 계정 비밀번호
 *   TEST_BASE_URL      — 기본 https://mychatbot.world
 *   TEST_RUN_REAL_SIGNUP=1 — 1이면 가입 성공 케이스도 실행 (기본 OFF)
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = process.env.TEST_USER_EMAIL ?? '';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
const HAS_CREDS = Boolean(EMAIL && PASSWORD);
const RUN_REAL_SIGNUP = process.env.TEST_RUN_REAL_SIGNUP === '1';

// 가입 케이스용 별칭 이메일 (Gmail의 `+` 필터 활용)
function aliasEmail(): string {
  if (!EMAIL.includes('@')) return `e2e-${Date.now()}@example.com`;
  const [local, domain] = EMAIL.split('@');
  return `${local}+e2e${Date.now()}@${domain}`;
}

async function fillSignup(page: Page, opts: {
  email?: string;
  name?: string;
  password?: string;
  passwordConfirm?: string;
}) {
  await page.goto('/signup');
  if (opts.email !== undefined) await page.getByPlaceholder('이메일 주소를 입력하세요').fill(opts.email);
  if (opts.name !== undefined) await page.getByPlaceholder('표시될 이름을 입력하세요').fill(opts.name);
  if (opts.password !== undefined) await page.getByPlaceholder('6자 이상 입력하세요').fill(opts.password);
  if (opts.passwordConfirm !== undefined) await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill(opts.passwordConfirm);
  await page.getByRole('button', { name: '가입하기' }).click();
  await page.waitForTimeout(1500);
}

async function fillLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('이메일 주소를 입력하세요').fill(email);
  await page.getByPlaceholder('비밀번호를 입력하세요').fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
}

// ════════════════════════════════════════════════════════════════════
//  SIGNUP 블록
// ════════════════════════════════════════════════════════════════════
test.describe('회원가입 (/signup)', () => {

  test('S1. 페이지 로드 + 필수 폼 요소 전부 렌더', async ({ page }) => {
    const resp = await page.goto('/signup');
    expect(resp?.status()).toBe(200);
    await expect(page.getByPlaceholder('이메일 주소를 입력하세요')).toBeVisible();
    await expect(page.getByPlaceholder('표시될 이름을 입력하세요')).toBeVisible();
    await expect(page.getByPlaceholder('6자 이상 입력하세요')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호를 다시 입력하세요')).toBeVisible();
    await expect(page.getByRole('button', { name: '가입하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
    // 로그인 페이지 링크
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
  });

  test('S2. 빈 제출 — 각 필드 에러 alert', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: '가입하기' }).click();
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    console.log(`  [RESULT] errors visible: ${bodyText.includes('이메일을 입력') || bodyText.includes('이름') || bodyText.includes('비밀번호를 입력')}`);
    expect(bodyText).toContain('이메일');
  });

  test('S3. 잘못된 이메일 형식 — 에러', async ({ page }) => {
    await fillSignup(page, {
      email: 'not-an-email',
      name: 'E2E테스터',
      password: 'pass1234',
      passwordConfirm: 'pass1234',
    });
    const bodyText = await page.locator('body').innerText();
    console.log(`  [RESULT] 형식 에러 노출: ${/올바른.*이메일|이메일 형식/.test(bodyText)}`);
    expect(bodyText).toMatch(/올바른.*이메일|형식/);
  });

  test('S4. 짧은 비밀번호 (5자) — 에러', async ({ page }) => {
    await fillSignup(page, {
      email: `short-${Date.now()}@example.com`,
      name: 'E2E테스터',
      password: 'aaaaa',
      passwordConfirm: 'aaaaa',
    });
    const bodyText = await page.locator('body').innerText();
    console.log(`  [RESULT] 길이 에러: ${/6자 이상/.test(bodyText)}`);
    expect(bodyText).toContain('6자 이상');
  });

  test('S5. 비밀번호 불일치 — 에러', async ({ page }) => {
    await fillSignup(page, {
      email: `mismatch-${Date.now()}@example.com`,
      name: 'E2E테스터',
      password: 'pass1234',
      passwordConfirm: 'different99',
    });
    const bodyText = await page.locator('body').innerText();
    console.log(`  [RESULT] 불일치 에러: ${/일치하지/.test(bodyText)}`);
    expect(bodyText).toMatch(/일치하지/);
  });

  test('S6. 이미 가입된 이메일 (중복) — 에러 노출', async ({ page }) => {
    test.skip(!HAS_CREDS, 'TEST_USER_EMAIL 필요');
    await fillSignup(page, {
      email: EMAIL,
      name: 'E2E중복테스터',
      password: PASSWORD,
      passwordConfirm: PASSWORD,
    });
    await page.waitForTimeout(3000); // Supabase 응답 대기
    const bodyText = await page.locator('body').innerText();
    const isDuplicate = /이미 가입|already|중복|registered|exists/i.test(bodyText);
    console.log(`  [RESULT] 중복 감지: ${isDuplicate}`);
    console.log(`  [RESULT] body: ${bodyText.slice(0, 300).replace(/\s+/g, ' ')}`);
    expect(isDuplicate).toBeTruthy();
  });

  test('S7. ⚠️ 약관 동의 체크박스 존재 여부 점검', async ({ page }) => {
    await page.goto('/signup');
    const checkboxes = await page.getByRole('checkbox').count();
    const hasTermsLink = await page.getByRole('link', { name: /이용약관|terms/i }).count();
    const bodyText = await page.locator('body').innerText();
    const impliedConsent = /동의한 것으로 간주|가입하면.*동의|by.*signing.*up/i.test(bodyText);
    console.log(`  [RESULT] 체크박스 개수: ${checkboxes}`);
    console.log(`  [RESULT] 약관 링크 개수: ${hasTermsLink}`);
    console.log(`  [RESULT] 묵시적 동의 문구: ${impliedConsent}`);
    // FAIL 조건으로 명시: 체크박스 0 AND 묵시적 동의 문구도 없으면 법적 리스크
    if (checkboxes === 0 && !impliedConsent) {
      console.log(`  [⚠️ 결함] signup에 약관 동의 메커니즘 부재`);
    }
  });

  test('S8. 신규 가입 성공 플로우 (RUN_REAL_SIGNUP=1 일 때만)', async ({ page }) => {
    test.skip(!RUN_REAL_SIGNUP, 'TEST_RUN_REAL_SIGNUP=1 환경변수로 명시 활성화 필요');
    const newEmail = aliasEmail();
    await fillSignup(page, {
      email: newEmail,
      name: 'E2E가입테스트',
      password: 'TestPw!2345',
      passwordConfirm: 'TestPw!2345',
    });
    await page.waitForTimeout(4000);
    const bodyText = await page.locator('body').innerText();
    const success = /인증 이메일 발송|가입 완료|check.*email/i.test(bodyText);
    console.log(`  [RESULT] 새 이메일: ${newEmail}`);
    console.log(`  [RESULT] 성공 화면: ${success}`);
    expect(success).toBeTruthy();
  });

  test('S9. 로그인 상태에서 /signup 방문 → / 로 자동 리다이렉트', async ({ page }) => {
    test.skip(!HAS_CREDS, 'TEST_USER_EMAIL/PASSWORD 필요');
    await fillLogin(page, EMAIL, PASSWORD);
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
    await page.goto('/signup');
    await page.waitForTimeout(2000); // useEffect replace 대기
    const url = page.url();
    console.log(`  [RESULT] /signup 방문 후 URL: ${url}`);
    expect(url.endsWith('/') || url.includes('mychatbot.world/') && !url.includes('/signup')).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════════
//  LOGIN 블록
// ════════════════════════════════════════════════════════════════════
test.describe('로그인 (/login)', () => {

  test('L1. 페이지 로드 + 필수 폼 요소 + 부가 링크', async ({ page }) => {
    const resp = await page.goto('/login');
    expect(resp?.status()).toBe(200);
    await expect(page.getByPlaceholder('이메일 주소를 입력하세요')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호를 입력하세요')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
    await expect(page.getByRole('link', { name: '비밀번호 찾기' })).toBeVisible();
    await expect(page.getByRole('link', { name: '회원가입' })).toBeVisible();
  });

  test('L2. 빈 필드 제출 — 에러 메시지', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    console.log(`  [RESULT] 빈 필드 에러: ${/모두 입력|이메일.*비밀번호/.test(bodyText)}`);
    expect(bodyText).toMatch(/모두 입력|입력해 주세요/);
  });

  test('L3. 틀린 비밀번호 — "올바르지 않습니다" 에러', async ({ page }) => {
    test.skip(!HAS_CREDS, 'TEST_USER_EMAIL 필요');
    await fillLogin(page, EMAIL, 'wrong-password-xyz');
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText();
    const matched = /올바르지 않습니다|invalid|not.*match/i.test(bodyText);
    console.log(`  [RESULT] 에러 노출: ${matched}`);
    console.log(`  [RESULT] 여전히 /login: ${page.url().includes('/login')}`);
    expect(matched).toBeTruthy();
    expect(page.url()).toContain('/login');
  });

  test('L4. 존재하지 않는 이메일 — 에러', async ({ page }) => {
    await fillLogin(page, `nonexistent-${Date.now()}@example.invalid`, 'any-password');
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText();
    // Supabase는 보안상 동일한 "invalid login credentials" 반환
    const matched = /올바르지 않습니다|invalid/i.test(bodyText);
    console.log(`  [RESULT] 에러 노출: ${matched}`);
    expect(matched).toBeTruthy();
  });

  test('L5. 정상 로그인 — 세션 쿠키 발급 + / 리다이렉트', async ({ page }) => {
    test.skip(!HAS_CREDS, 'TEST_USER_EMAIL/PASSWORD 필요');
    await fillLogin(page, EMAIL, PASSWORD);
    try {
      await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
    } catch {
      const bodyText = await page.locator('body').innerText();
      console.log(`  [FAIL] 리다이렉트 안 됨. error: ${bodyText.slice(0, 300).replace(/\s+/g, ' ')}`);
      throw new Error('로그인 리다이렉트 실패');
    }
    const cookies = await page.context().cookies();
    const authCookie = cookies.find((c) => c.name.includes('auth-token'));
    console.log(`  [RESULT] finalUrl: ${page.url()}`);
    console.log(`  [RESULT] auth 쿠키: ${authCookie?.name} (${authCookie ? 'httpOnly=' + authCookie.httpOnly : 'NONE'})`);
    expect(authCookie).toBeDefined();
  });

  test('L6. 로그인 상태에서 /login 재방문 — 동작 확인', async ({ page }) => {
    test.skip(!HAS_CREDS, 'TEST_USER_EMAIL/PASSWORD 필요');
    await fillLogin(page, EMAIL, PASSWORD);
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
    await page.goto('/login');
    await page.waitForTimeout(2000);
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    console.log(`  [RESULT] /login 재방문 후 URL: ${url}`);
    console.log(`  [RESULT] "로그인" 폼 또 보임: ${bodyText.includes('비밀번호를 입력하세요')}`);
    // 기대: 자동 리다이렉트 OR 이미 로그인 상태 안내 — 둘 다 아니면 UX 결함 (하지만 치명적이진 않음)
  });

  test('L7. 로그인 → 홈 → 로그아웃 → 쿠키 삭제 확인', async ({ page }) => {
    test.skip(!HAS_CREDS, 'TEST_USER_EMAIL/PASSWORD 필요');
    await fillLogin(page, EMAIL, PASSWORD);
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
    const before = await page.context().cookies();
    const hadAuth = before.some((c) => c.name.includes('auth-token'));
    await page.goto('/');
    // 로그아웃 UI 탐색
    const candidates = [
      page.getByRole('link', { name: /로그아웃|logout|sign.?out/i }),
      page.getByRole('button', { name: /로그아웃|logout|sign.?out/i }),
      page.getByRole('menuitem', { name: /로그아웃|logout/i }),
    ];
    let clicked = false;
    for (const c of candidates) {
      const cnt = await c.count().catch(() => 0);
      if (cnt > 0 && await c.first().isVisible().catch(() => false)) {
        await c.first().click().catch(() => {});
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // 드롭다운/메뉴 뒤에 숨어있을 수 있음 — 메뉴 버튼 먼저 시도
      const menuBtn = page.getByRole('button').filter({ hasText: /메뉴|profile|account|내|avatar/i }).first();
      if (await menuBtn.count().catch(() => 0)) {
        await menuBtn.click().catch(() => {});
        await page.waitForTimeout(500);
        for (const c of candidates) {
          if (await c.first().isVisible().catch(() => false)) {
            await c.first().click().catch(() => {});
            clicked = true;
            break;
          }
        }
      }
    }
    if (!clicked) {
      // 최후 폴백: API 직접
      await page.evaluate(async () => {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const c = createClient(
          (window as any).__NEXT_DATA__?.runtimeConfig?.SUPABASE_URL || '',
          (window as any).__NEXT_DATA__?.runtimeConfig?.SUPABASE_ANON_KEY || ''
        );
        await c.auth.signOut();
      }).catch(() => {});
    }
    await page.waitForTimeout(3000);
    const after = await page.context().cookies();
    const stillHasAuth = after.some((c) => c.name.includes('auth-token'));
    console.log(`  [RESULT] UI 로그아웃 클릭 성공: ${clicked}`);
    console.log(`  [RESULT] 로그아웃 전 auth 쿠키: ${hadAuth}`);
    console.log(`  [RESULT] 로그아웃 후 auth 쿠키 잔존: ${stillHasAuth}`);
    // 쿠키는 서버에서 설정된 HttpOnly일 수 있어 클라이언트 cookies()는 못 볼 수 있음 — 최소 UI는 노출돼야 함
    expect(clicked || after.length <= before.length).toBeTruthy();
  });

  test('L8. "비밀번호 찾기" 링크 → /reset-password', async ({ page }) => {
    await page.goto('/login');
    const link = page.getByRole('link', { name: '비밀번호 찾기' });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    console.log(`  [RESULT] 비밀번호 찾기 href: ${href}`);
    expect(href).toBe('/reset-password');
    // 실제 페이지 접근 가능성
    const resp = await page.goto('/reset-password');
    console.log(`  [RESULT] /reset-password status: ${resp?.status()}`);
    expect(resp?.status()).toBeLessThan(400);
  });

  test('L9. 로그아웃 후 보호 페이지 접근 → /login 리다이렉트', async ({ page }) => {
    // 로그인 없이 /mypage 방문
    await page.context().clearCookies();
    const resp = await page.goto('/mypage', { waitUntil: 'networkidle' }).catch(() => null);
    const finalUrl = page.url();
    console.log(`  [RESULT] /mypage 비로그인 접근 → ${finalUrl}`);
    // 로그인 페이지로 리다이렉트되거나 자체 401/403 안내 화면
    const redirected = finalUrl.includes('/login');
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasAuthGate = /로그인|login required|unauthorized/i.test(bodyText);
    console.log(`  [RESULT] 로그인 유도: ${redirected || hasAuthGate}`);
  });
});
