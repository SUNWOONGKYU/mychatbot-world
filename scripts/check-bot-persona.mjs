import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const parseEnv = p => Object.fromEntries(
  readFileSync(p,'utf-8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];})
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}});

// Test inserting conversation with bot_id='seonhoegyesa' (username) to see if FK exists
const { data, error } = await s.from('conversations').insert({ user_id: '00000000-0000-0000-0000-000000000000', bot_id: 'seonhoegyesa' }).select().single();
console.log('conversations insert test:', { data, error });
if (data) {
  await s.from('conversations').delete().eq('id', data.id);
}

// Check recent conversations for this user
const { data: convs } = await s.from('conversations').select('id,bot_id,user_id,created_at').order('created_at', {ascending:false}).limit(5);
console.log('\nrecent conversations:', convs);
