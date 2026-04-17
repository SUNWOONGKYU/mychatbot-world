/**
 * @description 크레딧 충전 신청 (무통장 입금) — pending payment 생성
 * POST /api/Backend_APIs/credit-charge
 * 요청: { amount: number, depositor_name: string }
 * 응답: { ok: true, payment_id: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const AMOUNT_TO_CREDITS: Record<number, number> = {
  5000: 5000,
  10000: 10000,
  30000: 30000,
  50000: 50000,
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // 토큰으로 사용자 확인
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser(token)
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: '인증에 실패했습니다.' }, { status: 401 })
    }
    const userId = userData.user.id

    const body = await req.json()
    const amount = Number(body?.amount)
    const depositorName = String(body?.depositor_name ?? '').trim()

    if (!amount || !AMOUNT_TO_CREDITS[amount]) {
      return NextResponse.json({ error: '올바른 입금 금액을 선택해 주세요.' }, { status: 400 })
    }
    if (!depositorName || depositorName.length > 50) {
      return NextResponse.json({ error: '입금자명을 1~50자로 입력해 주세요.' }, { status: 400 })
    }

    // INSERT는 service_role 필요 (RLS)
    if (!serviceKey) {
      return NextResponse.json(
        { error: '서버 설정 오류 (service_role 미설정)' },
        { status: 500 }
      )
    }
    const adminClient = createClient(supabaseUrl, serviceKey)

    const orderId = `BW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const creditAmount = AMOUNT_TO_CREDITS[amount]

    const { data, error } = await adminClient
      .from('mcw_payments')
      .insert({
        user_id: userId,
        provider: 'bankwire',
        provider_order_id: orderId,
        amount,
        credit_amount: creditAmount,
        status: 'pending',
        payment_method: 'virtualAccount',
        metadata: { depositor_name: depositorName },
      })
      .select('id')
      .single()

    if (error) {
      console.error('[credit-charge] insert error:', error)
      return NextResponse.json({ error: '입금 신청 저장에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, payment_id: data.id, order_id: orderId })
  } catch (err: any) {
    console.error('[credit-charge] error:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
