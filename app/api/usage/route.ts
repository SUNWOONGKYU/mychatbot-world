/**
 * @task U1
 * @description AI 사용량 통계 API
 *
 * GET /api/usage — 이번 달 AI 사용량 집계
 *   헤더: Authorization: Bearer {token}
 *   응답: { period, total_credits, total_tokens, total_requests, by_model, by_bot }
 *
 * 테이블: mcw_credit_usage (우선) → mcw_ai_usage (폴백)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ModelStat {
  model: string;
  credits: number;
  tokens: number;
  requests: number;
}

interface BotStat {
  bot_id: string | null;
  credits: number;
  requests: number;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
  }

  // 이번 달 범위 계산
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // mcw_credit_usage 시도
  const { data: creditData, error: creditErr } = await supabase
    .from('mcw_credit_usage')
    .select('amount, model, tokens, bot_id, created_at')
    .eq('user_id', user.id)
    .gte('created_at', from)
    .lte('created_at', to);

  if (!creditErr && creditData) {
    return NextResponse.json(aggregateCreditUsage(creditData, from, to));
  }

  // mcw_ai_usage 폴백
  const { data: aiData, error: aiErr } = await supabase
    .from('mcw_ai_usage')
    .select('cost, model, total_tokens, bot_id, created_at')
    .eq('user_id', user.id)
    .gte('created_at', from)
    .lte('created_at', to);

  if (!aiErr && aiData) {
    return NextResponse.json(aggregateAiUsage(aiData, from, to));
  }

  // 테이블 없음 — 빈 응답
  return NextResponse.json({
    period: { from, to },
    total_credits: 0,
    total_tokens: 0,
    total_requests: 0,
    by_model: [],
    by_bot: [],
  });
}

function aggregateCreditUsage(rows: any[], from: string, to: string) {
  let total_credits = 0;
  let total_tokens = 0;
  const modelMap = new Map<string, ModelStat>();
  const botMap = new Map<string | null, BotStat>();

  for (const r of rows) {
    const credits  = Number(r.amount ?? r.credits_used ?? 0);
    const tokens   = Number(r.tokens ?? 0);
    const model    = String(r.model ?? '알 수 없음');
    const bot_id   = r.bot_id ?? null;

    total_credits += credits;
    total_tokens  += tokens;

    const ms = modelMap.get(model) ?? { model, credits: 0, tokens: 0, requests: 0 };
    ms.credits  += credits;
    ms.tokens   += tokens;
    ms.requests += 1;
    modelMap.set(model, ms);

    const bs = botMap.get(bot_id) ?? { bot_id, credits: 0, requests: 0 };
    bs.credits  += credits;
    bs.requests += 1;
    botMap.set(bot_id, bs);
  }

  return {
    period: { from, to },
    total_credits,
    total_tokens,
    total_requests: rows.length,
    by_model: [...modelMap.values()].sort((a, b) => b.credits - a.credits),
    by_bot:   [...botMap.values()].filter(b => b.bot_id !== null).sort((a, b) => b.credits - a.credits),
  };
}

function aggregateAiUsage(rows: any[], from: string, to: string) {
  let total_credits = 0;
  let total_tokens = 0;
  const modelMap = new Map<string, ModelStat>();
  const botMap = new Map<string | null, BotStat>();

  for (const r of rows) {
    const credits = Number(r.cost ?? 0);
    const tokens  = Number(r.total_tokens ?? 0);
    const model   = String(r.model ?? '알 수 없음');
    const bot_id  = r.bot_id ?? null;

    total_credits += credits;
    total_tokens  += tokens;

    const ms = modelMap.get(model) ?? { model, credits: 0, tokens: 0, requests: 0 };
    ms.credits  += credits;
    ms.tokens   += tokens;
    ms.requests += 1;
    modelMap.set(model, ms);

    const bs = botMap.get(bot_id) ?? { bot_id, credits: 0, requests: 0 };
    bs.credits  += credits;
    bs.requests += 1;
    botMap.set(bot_id, bs);
  }

  return {
    period: { from, to },
    total_credits,
    total_tokens,
    total_requests: rows.length,
    by_model: [...modelMap.values()].sort((a, b) => b.credits - a.credits),
    by_bot:   [...botMap.values()].filter(b => b.bot_id !== null).sort((a, b) => b.credits - a.credits),
  };
}
