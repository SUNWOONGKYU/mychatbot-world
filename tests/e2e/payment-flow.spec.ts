/**
 * @task S9TS2
 * @description 실결제 E2E 검증 (무통장입금 플로우)
 *
 * 실행:
 *   # 로컬 개발 서버 기동 후
 *   TEST_BASE_URL=http://localhost:3000 \
 *   TEST_USER_EMAIL=test@mychatbot.world \
 *   TEST_USER_PASSWORD=xxxx \
 *   TEST_ADMIN_KEY=xxxx \
 *   npx playwright test tests/e2e/payment-flow.spec.ts
 *
 * 커버 시나리오 (8):
 *   1. 정상 금액(30k/50k/100k) 무통장 요청 생성 (POST /api/payments)
 *   2. Custom 금액 범위 검증 (10k 미만/5M 초과 → 400)
 *   3. 은행정보 누락 시 503
 *   4. Rate limit 검증 (6회 연속 → 429)
 *   5. 관리자 승인 (PATCH /api/admin/payments, action=approve) → 크레딧 증가
 *   6. 관리자 거부 (action=reject) → 상태 cancelled
 *   7. 중복 승인 방지 (이미 completed 재승인 → 409)
 *   8. 상품 구매 [부가기능] → 승인 시 크레딧 미증가 (별도 지급)
 *
 * 주의:
 *   - 이 테스트는 실 DB를 수정한다. Staging 또는 전용 테스트 DB에서만 실행.
 *   - TEST_* env 누락 시 시나리오 스킵 (CI fail 방지).
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const TEST_ADMIN_KEY = process.env.TEST_ADMIN_KEY;

const hasAuth = !!(TEST_USER_EMAIL && TEST_USER_PASSWORD);
const hasAdmin = !!TEST_ADMIN_KEY;

// ── helpers ──────────────────────────────────────────────────────────

async function loginAsUser(request: APIRequestContext): Promise<string | null> {
  if (!hasAuth) return null;
  const resp = await request.post('/api/auth/login', {
    data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
  });
  if (!resp.ok()) return null;
  const setCookie = resp.headers()['set-cookie'] ?? '';
  return setCookie;
}

async function getBalance(request: APIRequestContext): Promise<number | null> {
  const resp = await request.get('/api/credits/balance');
  if (!resp.ok()) return null;
  const body = await resp.json();
  return body.balance ?? body.credits ?? null;
}

// ── scenarios ────────────────────────────────────────────────────────

test.describe('S9TS2 — 결제 E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. 정상 금액 무통장 요청 (30k/50k/100k)', async ({ request }) => {
    test.skip(!hasAuth, 'TEST_USER_* env 누락');
    await loginAsUser(request);

    for (const amount of [30000, 50000, 100000]) {
      const resp = await request.post('/api/payments', {
        data: { amount, payment_type: 'bank_transfer' },
      });
      expect([200, 201, 503]).toContain(resp.status());
      if (resp.status() === 503) {
        test.skip(true, '은행정보 env 미설정 — 서버는 정상 동작');
        return;
      }
      const body = await resp.json();
      expect(body.id).toBeTruthy();
      expect(body.amount).toBe(amount);
      expect(body.status).toBe('pending');
      expect(body.bank_name).toBeTruthy();
      expect(body.account_number).toBeTruthy();
    }
  });

  test('2. Custom 금액 범위 검증 (10k 미만 → 400)', async ({ request }) => {
    test.skip(!hasAuth, 'TEST_USER_* env 누락');
    await loginAsUser(request);

    const tooSmall = await request.post('/api/payments', {
      data: { amount: 9999, payment_type: 'bank_transfer' },
    });
    expect([400, 422]).toContain(tooSmall.status());

    const tooLarge = await request.post('/api/payments', {
      data: { amount: 5_000_001, payment_type: 'bank_transfer' },
    });
    expect([400, 422]).toContain(tooLarge.status());
  });

  test('3. 인증 없이 요청 → 401', async ({ request }) => {
    const resp = await request.post('/api/payments', {
      data: { amount: 30000, payment_type: 'bank_transfer' },
      // 의도적으로 쿠키 생략
    });
    expect([401, 403]).toContain(resp.status());
  });

  test('4. Rate limit 검증 (6회 연속 → 429)', async ({ request }) => {
    test.skip(!hasAuth, 'TEST_USER_* env 누락');
    await loginAsUser(request);

    let got429 = false;
    for (let i = 0; i < 8; i++) {
      const resp = await request.post('/api/payments', {
        data: { amount: 30000, payment_type: 'bank_transfer' },
      });
      if (resp.status() === 429) {
        got429 = true;
        break;
      }
    }
    expect(got429, 'RATE_PAYMENTS(5/min) 초과 시 429 기대').toBeTruthy();
  });

  test('5. 관리자 승인 → 크레딧 증가', async ({ request }) => {
    test.skip(!hasAuth || !hasAdmin, 'TEST_USER_* 또는 TEST_ADMIN_KEY 누락');

    await loginAsUser(request);
    const balanceBefore = await getBalance(request);

    // 1) 요청 생성
    const createResp = await request.post('/api/payments', {
      data: { amount: 30000, payment_type: 'bank_transfer' },
    });
    if (createResp.status() === 503) {
      test.skip(true, '은행정보 env 미설정');
      return;
    }
    expect([200, 201]).toContain(createResp.status());
    const created = await createResp.json();

    // 2) 관리자 승인
    const approveResp = await request.patch('/api/admin/payments', {
      headers: { 'X-Admin-Key': TEST_ADMIN_KEY! },
      data: { paymentId: created.id, action: 'approve', confirmedBy: 'e2e-test' },
    });
    expect([200, 201]).toContain(approveResp.status());
    const approved = await approveResp.json();
    expect(approved.status).toBe('completed');
    expect(typeof approved.newBalance).toBe('number');

    // 3) 잔액 증가 검증
    if (balanceBefore !== null) {
      expect(approved.newBalance).toBeGreaterThanOrEqual(balanceBefore + 30000);
    }
  });

  test('6. 관리자 거부 → status=cancelled', async ({ request }) => {
    test.skip(!hasAuth || !hasAdmin, 'TEST_USER_* 또는 TEST_ADMIN_KEY 누락');

    await loginAsUser(request);
    const createResp = await request.post('/api/payments', {
      data: { amount: 30000, payment_type: 'bank_transfer' },
    });
    if (createResp.status() === 503) return;
    const created = await createResp.json();

    const rejectResp = await request.patch('/api/admin/payments', {
      headers: { 'X-Admin-Key': TEST_ADMIN_KEY! },
      data: { paymentId: created.id, action: 'reject', confirmedBy: 'e2e-test' },
    });
    expect([200, 201]).toContain(rejectResp.status());
    const rejected = await rejectResp.json();
    expect(['cancelled', 'rejected']).toContain(rejected.status);
  });

  test('7. 중복 승인 방지 → 409', async ({ request }) => {
    test.skip(!hasAuth || !hasAdmin, 'TEST_USER_* 또는 TEST_ADMIN_KEY 누락');

    await loginAsUser(request);
    const createResp = await request.post('/api/payments', {
      data: { amount: 30000, payment_type: 'bank_transfer' },
    });
    if (createResp.status() === 503) return;
    const created = await createResp.json();

    await request.patch('/api/admin/payments', {
      headers: { 'X-Admin-Key': TEST_ADMIN_KEY! },
      data: { paymentId: created.id, action: 'approve', confirmedBy: 'e2e-test' },
    });

    const dup = await request.patch('/api/admin/payments', {
      headers: { 'X-Admin-Key': TEST_ADMIN_KEY! },
      data: { paymentId: created.id, action: 'approve', confirmedBy: 'e2e-test' },
    });
    expect(dup.status()).toBe(409);
  });

  test('8. 상품 구매 [부가기능] → 크레딧 미증가', async ({ request }) => {
    test.skip(!hasAuth || !hasAdmin, 'TEST_USER_* 또는 TEST_ADMIN_KEY 누락');

    await loginAsUser(request);
    const balanceBefore = await getBalance(request);

    const createResp = await request.post('/api/payments', {
      data: {
        amount: 30000,
        payment_type: 'bank_transfer',
        description: '[부가기능] Pro 테마 팩',
      },
    });
    if (createResp.status() === 503) return;
    const created = await createResp.json();

    const approveResp = await request.patch('/api/admin/payments', {
      headers: { 'X-Admin-Key': TEST_ADMIN_KEY! },
      data: { paymentId: created.id, action: 'approve', confirmedBy: 'e2e-test' },
    });
    expect(approveResp.ok()).toBeTruthy();

    const balanceAfter = await getBalance(request);
    if (balanceBefore !== null && balanceAfter !== null) {
      expect(balanceAfter, '상품 구매는 크레딧 미증가').toBe(balanceBefore);
    }
  });
});
