/**
 * @description 마켓플레이스 스킬 업로드 / 구독
 * POST /api/Backend_APIs/marketplace?action=publish|draft|subscribe
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createClient(url, serviceKey)
}

async function getUserId(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const client = createClient(url, anon)
  const { data, error } = await client.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user.id
}

export async function POST(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action') || 'publish'
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const userId = await getUserId(token)
    if (!userId) return NextResponse.json({ error: '인증 실패' }, { status: 401 })

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: '서버 설정 오류 (service_role 미설정)' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))

    if (action === 'publish' || action === 'draft') {
      const skillName = String(body?.skillName ?? '').trim()
      const description = String(body?.description ?? '').trim()
      const longDescription = String(body?.long_description ?? '').trim()
      const category = String(body?.category ?? '').trim()
      const tags = Array.isArray(body?.tags) ? body.tags.slice(0, 5) : []
      const price = Number(body?.price ?? 0) || 0
      const botId = String(body?.botId ?? '').trim()
      const isDraft = Boolean(body?.is_draft) || action === 'draft'

      if (!skillName || !description || !category) {
        return NextResponse.json(
          { error: '필수 항목(스킬명/설명/카테고리)을 입력해 주세요.' },
          { status: 400 }
        )
      }
      if (skillName.length > 100 || description.length > 500) {
        return NextResponse.json({ error: '입력값이 너무 깁니다.' }, { status: 400 })
      }
      if (price < 0 || price > 1000000) {
        return NextResponse.json({ error: '가격 범위가 올바르지 않습니다.' }, { status: 400 })
      }

      const { data, error } = await admin
        .from('mcw_skills')
        .insert({
          name: skillName,
          description,
          category,
          price,
          is_active: !isDraft,
          metadata: {
            author_id: userId,
            long_description: longDescription,
            tags,
            bot_id: botId || null,
            status: isDraft ? 'draft' : 'published',
          },
        })
        .select('id')
        .single()

      if (error) {
        console.error('[marketplace] insert error:', error)
        return NextResponse.json({ error: '업로드 저장 실패' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, id: data.id, status: isDraft ? 'draft' : 'published' })
    }

    if (action === 'subscribe') {
      const skillId = String(body?.skill_id ?? '').trim()
      if (!skillId) {
        return NextResponse.json({ error: 'skill_id가 필요합니다.' }, { status: 400 })
      }

      // mcw_skill_subscriptions 테이블이 없을 수 있어 metadata로 대체 기록
      const { data: existing } = await admin
        .from('mcw_skills')
        .select('id, metadata')
        .eq('id', skillId)
        .single()
      if (!existing) {
        return NextResponse.json({ error: '스킬을 찾을 수 없습니다.' }, { status: 404 })
      }

      const meta = (existing.metadata as any) || {}
      const subs: string[] = Array.isArray(meta.subscribers) ? meta.subscribers : []
      if (!subs.includes(userId)) subs.push(userId)

      const { error: upErr } = await admin
        .from('mcw_skills')
        .update({ metadata: { ...meta, subscribers: subs } })
        .eq('id', skillId)

      if (upErr) {
        console.error('[marketplace] subscribe error:', upErr)
        return NextResponse.json({ error: '구독 저장 실패' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, subscribed: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[marketplace] error:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const client = admin ?? createClient(url, anon)

    const category = req.nextUrl.searchParams.get('category')
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 20), 100)

    let query = client
      .from('mcw_skills')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) {
      console.error('[marketplace GET] error:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }
    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    console.error('[marketplace GET] exception:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
