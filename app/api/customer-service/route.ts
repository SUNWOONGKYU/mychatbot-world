/**
 * @task S6BE1 — 고객센터 문의 접수 API
 * @description POST /api/customer-service
 *
 * - 공개 엔드포인트 (비로그인 문의 허용)
 * - mcw_customer_inquiries 테이블에 저장
 * - 테이블 부재 시(42P01) 서버 콘솔 로그로 폴백 — 데이터 소실 방지
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limiter';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface InquiryPayload {
  type: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  content: string;
}

function validate(body: unknown): InquiryPayload | { error: string } {
  if (!body || typeof body !== 'object') return { error: '요청 본문이 올바르지 않습니다.' };
  const b = body as Record<string, unknown>;
  const required = ['type', 'name', 'email', 'subject', 'content'];
  for (const key of required) {
    if (typeof b[key] !== 'string' || !(b[key] as string).trim()) {
      return { error: `필수 항목 누락: ${key}` };
    }
  }
  const email = String(b.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: '이메일 형식이 올바르지 않습니다.' };
  return {
    type: String(b.type).trim().slice(0, 50),
    name: String(b.name).trim().slice(0, 100),
    email,
    phone: typeof b.phone === 'string' ? b.phone.trim().slice(0, 30) : '',
    subject: String(b.subject).trim().slice(0, 200),
    content: String(b.content).trim().slice(0, 5000),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 스팸 방지: 시간당 5회/IP
  const rl = rateLimit(req, { limit: 5, windowMs: 3_600_000 }, 'customer-service');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '잠시 후 다시 시도해 주세요.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '요청 본문이 JSON 형식이 아닙니다.' }, { status: 400 });
  }

  const parsed = validate(body);
  if ('error' in parsed) return NextResponse.json(parsed, { status: 400 });

  const supabase = getSupabase();
  const now = new Date().toISOString();
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    null;

  const { error } = await supabase.from('mcw_customer_inquiries').insert({
    inquiry_type: parsed.type,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone || null,
    subject: parsed.subject,
    content: parsed.content,
    ip_address: ip,
    status: 'pending',
    created_at: now,
  });

  if (error) {
    // 테이블 부재(42P01) 시 서버 로그로 백업 — 수동 수집 가능
    if (error.code === '42P01') {
      console.warn(
        '[customer-service] mcw_customer_inquiries 테이블이 존재하지 않아 로그로 대체:',
        JSON.stringify({ ...parsed, ip, at: now }),
      );
      return NextResponse.json({ success: true, logged: true });
    }
    console.error('[customer-service] insert failed:', error.message);
    return NextResponse.json(
      { error: '문의 저장에 실패했습니다.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
