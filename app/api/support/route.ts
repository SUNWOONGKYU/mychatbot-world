/**
 * @task CS1
 * @description 고객센터 문의 접수 API
 *
 * POST /api/support — 문의 폼 데이터 Supabase 저장
 *   요청: { type, name, email, phone?, subject, content }
 *   응답: { success: true, id: string }
 *
 * 테이블: support_inquiries
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAsync } from '@/lib/rate-limiter';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

const ALLOWED_TYPES = ['general', 'billing', 'technical', 'report', 'partnership', 'other'] as const;

// 공개 폼이라 인증 불가 → IP 기반 제한으로 스팸 방지 (시간당 10회)
const RATE_SUPPORT = { limit: 10, windowMs: 3_600_000 };

export async function POST(req: NextRequest): Promise<NextResponse> {
  // IP Rate Limit
  const rl = await rateLimitAsync(req, RATE_SUPPORT, 'support:post');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { type, name, email, phone, subject, content } = body as Record<string, string>;

  if (!type || !name || !email || !subject || !content) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '유효하지 않은 이메일 형식입니다.' }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: '문의 내용은 5000자를 초과할 수 없습니다.' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('support_inquiries')
    .insert({
      type: ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number]) ? type : 'other',
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      phone: phone ? String(phone).slice(0, 30) : null,
      subject: String(subject).slice(0, 200),
      content: String(content).slice(0, 5000),
      status: 'pending',
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[support POST] Supabase error:', error.message);
    return NextResponse.json({ error: '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
