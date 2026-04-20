#!/usr/bin/env tsx
/**
 * @task S9DV1
 * @description Staging 환경 시드 스크립트 — 테스트 유저·봇·크레딧·결제 주입
 *
 * 실행:
 *   SUPABASE_URL=<staging-branch-url> \
 *   SUPABASE_SERVICE_ROLE_KEY=<staging-service-key> \
 *   pnpm tsx scripts/seed-staging.ts
 *
 * 안전장치:
 *   - SUPABASE_URL 에 'prod' 또는 프로덕션 프로젝트 ID 포함 시 중단
 *   - STAGING_SEED_CONFIRM=yes 환경변수 없으면 dry-run
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONFIRM = process.env.STAGING_SEED_CONFIRM === 'yes';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 필수');
  process.exit(2);
}

// 프로덕션 오염 방지 — URL 에 'staging' 또는 'preview' 문자열 포함 필수
const urlLower = SUPABASE_URL.toLowerCase();
const PROD_PROJECT_ID = process.env.PRODUCTION_PROJECT_ID ?? '';
if (PROD_PROJECT_ID && urlLower.includes(PROD_PROJECT_ID.toLowerCase())) {
  console.error('❌ 프로덕션 프로젝트 URL 감지 — 시드 중단');
  process.exit(3);
}
if (!urlLower.includes('staging') && !urlLower.includes('preview') && !urlLower.includes('branch')) {
  console.warn('⚠️  URL에 staging/preview/branch 문자열이 없음. STAGING_SEED_CONFIRM=yes 필수.');
  if (!CONFIRM) {
    console.error('중단 — 확인 환경변수 없음');
    process.exit(4);
  }
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const TEST_USERS = [
  { email: 'test+001@mychatbot.world', password: 'StagingTest!2026', name: '테스터1호' },
  { email: 'test+002@mychatbot.world', password: 'StagingTest!2026', name: '테스터2호' },
  { email: 'test+003@mychatbot.world', password: 'StagingTest!2026', name: '테스터3호' },
];

const SAMPLE_BOTS = [
  { name: '상담봇', description: '친절한 고객 상담 AI', persona: 'friendly-support' },
  { name: '코드리뷰봇', description: '코드를 리뷰하고 개선점을 찾습니다', persona: 'code-reviewer' },
  { name: '글쓰기봇', description: '문장을 다듬어주는 작가', persona: 'writer' },
  { name: '번역봇', description: '한영 번역 전문', persona: 'translator' },
  { name: '학습봇', description: '개념을 쉽게 설명', persona: 'tutor' },
];

async function createUsers(): Promise<string[]> {
  const ids: string[] = [];
  for (const u of TEST_USERS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, seeded: true },
    });
    if (error) {
      console.warn(`유저 생성 실패 ${u.email}: ${error.message}`);
      continue;
    }
    ids.push(data.user.id);
    console.log(`✅ 유저 ${u.email} = ${data.user.id}`);
  }
  return ids;
}

async function seedCredits(userIds: string[]) {
  for (const uid of userIds) {
    const { error } = await admin.from('mcw_credits').upsert({
      user_id: uid,
      balance: 100_000,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn(`크레딧 시드 실패 ${uid}: ${error.message}`);
    else console.log(`✅ 크레딧 100,000 → ${uid}`);
  }
}

async function seedBots(ownerId: string) {
  for (const bot of SAMPLE_BOTS) {
    const { error } = await admin.from('mcw_bots').insert({
      owner_id: ownerId,
      name: bot.name,
      description: bot.description,
      persona: bot.persona,
      created_at: new Date().toISOString(),
    });
    if (error) console.warn(`봇 시드 실패 ${bot.name}: ${error.message}`);
    else console.log(`✅ 봇 ${bot.name}`);
  }
}

async function seedPayment(userId: string) {
  const { error } = await admin.from('mcw_payments').insert({
    user_id: userId,
    amount: 10_000,
    status: 'approved',
    method: 'bank_transfer',
    created_at: new Date().toISOString(),
  });
  if (error) console.warn(`결제 시드 실패: ${error.message}`);
  else console.log(`✅ 결제 1건 (승인됨)`);
}

async function main() {
  console.log(`Staging Seed 대상: ${SUPABASE_URL}`);
  if (!CONFIRM) {
    console.log('DRY RUN — 실제 쓰기하려면 STAGING_SEED_CONFIRM=yes 설정');
    return;
  }
  const userIds = await createUsers();
  if (userIds.length === 0) {
    console.error('유저 생성 실패 — 중단');
    process.exit(5);
  }
  await seedCredits(userIds);
  await seedBots(userIds[0]);
  await seedPayment(userIds[0]);
  console.log('\n시드 완료');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
