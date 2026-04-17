/**
 * @description 봇별 대화 로그 조회 (페르소나 필터)
 * GET /api/bots/:id/logs?persona_id=...&limit=50
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'bot id 필요' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const client = createClient(url, key)

    const personaId = req.nextUrl.searchParams.get('persona_id')
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 100), 500)
    const sessionId = req.nextUrl.searchParams.get('session_id')

    let q = client
      .from('mcw_chat_logs')
      .select('id, role, content, persona_id, session_id, created_at')
      .eq('bot_id', id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (personaId) q = q.eq('persona_id', personaId)
    if (sessionId) q = q.eq('session_id', sessionId)

    const { data, error } = await q
    if (error) {
      console.error('[bots/logs] error:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    // 통계
    const logs = data ?? []
    const userCount = logs.filter(l => l.role === 'user').length
    const assistantCount = logs.filter(l => l.role === 'assistant').length
    const sessions = new Set(logs.map(l => l.session_id)).size

    return NextResponse.json({
      logs: logs.reverse(), // 시간순
      stats: {
        total: logs.length,
        user: userCount,
        assistant: assistantCount,
        sessions,
      },
    })
  } catch (err) {
    console.error('[bots/logs] exception:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
