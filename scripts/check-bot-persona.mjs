import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const parseEnv = p => Object.fromEntries(
  readFileSync(p,'utf-8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
    .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];})
);
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}});

// 최근 10분 내 seonhoegyesa 봇 대화 + 메시지
const { data: convs } = await s.from('conversations')
  .select('id,bot_id,user_id,created_at')
  .eq('bot_id', 'bot_mo83mh1h_rzeznd')
  .gte('created_at', new Date(Date.now() - 10*60*1000).toISOString())
  .order('created_at', {ascending:false})
  .limit(5);
console.log('최근 10분 선회계사 봇 대화:', convs);

if (convs && convs.length > 0) {
  const latestConvId = convs[0].id;
  const { data: msgs } = await s.from('messages')
    .select('role,content,created_at')
    .eq('conversation_id', latestConvId)
    .order('created_at', {ascending:true});
  console.log(`\n대화 ${latestConvId} 메시지:`);
  msgs?.forEach(m => console.log(`  [${m.role}] ${m.content.slice(0,80)}${m.content.length>80?'...':''}`));
}
