/**
 * E2E: wksun999@naver.com 계정으로 로그인 → 위저드 Step1~8 진행 → /mypage 확인
 * 목적: 봇 생성 저장 실패 원인 재현/검증
 */
import { chromium } from 'playwright';

const EMAIL = 'wksun999@naver.com';
const PASSWORD = 'na*5215900';
const BASE = 'https://mychatbot.world';

const browser = await chromium.launch({ headless: false, slowMo: 150 });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  bypassCSP: true,
});
const page = await ctx.newPage();

const logs = [];
const errors = [];
const failedReq = [];
page.on('console', m => {
  const text = `[${m.type()}] ${m.text()}`;
  logs.push(text);
  if (m.type() === 'error') errors.push(m.text());
});
page.on('requestfailed', r => failedReq.push(`${r.url()} - ${r.failure()?.errorText}`));
page.on('response', async r => {
  const url = r.url();
  if (url.includes('/api/create-bot') || url.includes('/api/bots')) {
    let body = '';
    try { body = await r.text(); } catch {}
    logs.push(`[RESP ${r.status()}] ${url}\n${body.slice(0, 500)}`);
  }
});

async function step(name, fn) {
  console.log(`\n═══ ${name}`);
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}:`, e.message);
    await page.screenshot({ path: `scripts/e2e-fail-${Date.now()}.png`, fullPage: true });
    throw e;
  }
}

try {
  // 1) 로그인
  await step('로그인', async () => {
    await page.goto(`${BASE}/login?_=${Date.now()}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'scripts/e2e-01-login.png' });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 20000 });
    console.log('  → 로그인 후 URL:', page.url());
  });

  // 2) 위저드 시작
  await step('Step1 기본정보', async () => {
    await page.goto(`${BASE}/create?_=${Date.now()}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'scripts/e2e-02-step1.png' });
    await page.fill('input#botName', 'E2E테스트봇');
    await page.fill('input#botDesc', 'Playwright E2E 테스트용 코코봇입니다');
    // "다음" 버튼 클릭 — confirm 대화상자 수락
    page.once('dialog', d => d.accept());
    await page.click('button:has-text("다음")');
    await page.waitForTimeout(800);
  });

  await step('Step2 페르소나', async () => {
    await page.screenshot({ path: 'scripts/e2e-03-step2.png' });
    // "기업경영자" 프리셋 선택 (name/userTitle/role 자동 입력)
    await page.click('button:has-text("기업경영자")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("다음: 인터뷰")');
    await page.waitForTimeout(800);
  });

  await step('Step3 인터뷰', async () => {
    await page.screenshot({ path: 'scripts/e2e-04-step3.png' });
    // 텍스트 모드로 전환
    await page.click('button:has-text("텍스트 입력")');
    await page.waitForTimeout(400);
    const ta = page.locator('textarea').first();
    await ta.waitFor({ state: 'visible', timeout: 5000 });
    await ta.fill('저는 소프트웨어 엔지니어입니다. 백엔드 개발, 데이터베이스 설계, API 설계를 주로 합니다. 취미는 독서와 산책입니다. 질문에 성실하게 답변하고 고객을 돕는 역할을 맡고 싶습니다.');
    await page.click('button:has-text("AI 분석 시작")');
    await page.waitForTimeout(2000);
  });

  await step('Step4 분석', async () => {
    await page.waitForTimeout(8000); // AI 분석 대기
    await page.screenshot({ path: 'scripts/e2e-05-step4.png', fullPage: true });
    await page.click('button:has-text("다음: 목소리")');
    await page.waitForTimeout(800);
  });

  await step('Step5 목소리', async () => {
    await page.screenshot({ path: 'scripts/e2e-06-step5.png' });
    await page.click('button:has-text("다음: 아바타")');
    await page.waitForTimeout(800);
  });

  await step('Step6 아바타', async () => {
    await page.screenshot({ path: 'scripts/e2e-07-step6.png' });
    await page.click('button:has-text("다음: 테마")');
    await page.waitForTimeout(800);
  });

  await step('Step7 테마', async () => {
    await page.screenshot({ path: 'scripts/e2e-08-step7.png' });
    await page.click('button:has-text("다음: 배포")');
    await page.waitForTimeout(1200);
  });

  await step('Step8 생성 결과', async () => {
    // 최대 15초 대기 (create-bot API)
    await page.waitForTimeout(15000);
    await page.screenshot({ path: 'scripts/e2e-09-step8.png', fullPage: true });
  });

  await step('/mypage 확인', async () => {
    await page.goto(`${BASE}/mypage?_=${Date.now()}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'scripts/e2e-10-mypage-default.png', fullPage: true });
    // "코코봇 관리" 탭 클릭 — 데스크톱 사이드바의 tab-bots id 사용
    await page.locator('#tab-bots').click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'scripts/e2e-11-mypage-bots.png', fullPage: true });
  });

} catch (e) {
  console.error('\n!!! 실패:', e.message);
} finally {
  console.log('\n=== Errors ===');
  errors.forEach(e => console.log(e));
  console.log('\n=== Failed Requests ===');
  failedReq.forEach(f => console.log(f));
  console.log('\n=== API Logs ===');
  logs.filter(l => l.includes('[RESP') || l.includes('create-bot')).forEach(l => console.log(l));
  await browser.close();
}
