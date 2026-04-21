// 사용자 봇 저장 내용 실측 검증
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

function parseEnv(path) {
  return Object.fromEntries(
    readFileSync(path, 'utf-8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
}
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const URL_VAL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const KEY_VAL = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(URL_VAL, KEY_VAL);

const email = process.argv[2] || 'sunwoongkyu@gmail.com';
const { data: users } = await supabase.auth.admin.listUsers();
const user = users.users.find((u) => u.email === email);
if (!user) {
  console.log('user not found:', email);
  process.exit(1);
}
console.log('user.id:', user.id);

const { data: bots } = await supabase
  .from('mcw_bots')
  .select('*, personas:mcw_personas(*)')
  .eq('owner_id', user.id)
  .order('created_at', { ascending: false });

console.log(`\nbots: ${bots?.length ?? 0}개\n`);
for (const b of bots || []) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('id:', b.id);
  console.log('bot_name:', JSON.stringify(b.bot_name));
  console.log('bot_desc:', JSON.stringify(b.bot_desc));
  console.log('username:', JSON.stringify(b.username));
  console.log('emoji:', JSON.stringify(b.emoji));
  console.log('deploy_url:', JSON.stringify(b.deploy_url));
  console.log('greeting:', JSON.stringify(b.greeting));
  console.log('voice:', JSON.stringify(b.voice));
  console.log('category:', JSON.stringify(b.category));
  console.log('created:', b.created_at);
  console.log('personas:', (b.personas || []).length, '개');
  for (const p of b.personas || []) {
    console.log('  -', JSON.stringify(p.name), '|', JSON.stringify(p.description), '| role:', p.role, '| user_title:', p.user_title);
  }
}
