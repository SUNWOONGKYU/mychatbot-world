/**
 * @task S3BA1
 * @description 학습 세션 생성/조회 API
 *
 * POST /api/school/session — 학습 세션 시작
 *   요청: { curriculum_id, scenario_type }
 *   응답: { session: LearningSession }
 *
 * GET /api/school/session — 내 학습 세션 목록 조회
 *   응답: { sessions: LearningSession[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

interface LearningSession {
  id: string;
  user_id: string;
  curriculum_id: string;
  scenario_type: ScenarioType;
  status: SessionStatus;
  score: number | null;
  metadata: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

type ScenarioType = 'roleplay' | 'interview' | 'debate' | 'presentation';
type SessionStatus = 'active' | 'completed' | 'abandoned';

interface PostRequestBody {
  curriculum_id: string;
  scenario_type: ScenarioType;
}

// ============================
// Supabase 서버 클라이언트
// ============================

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

// ============================
// 인증 헬퍼
// ============================

async function getAuthenticatedUser(req: NextRequest) {
  const supabase = getSupabaseServer();

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

// ============================
// POST — 학습 세션 시작
// ============================

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PostRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { curriculum_id, scenario_type } = body;

  if (!curriculum_id || !scenario_type) {
    return NextResponse.json(
      { error: 'curriculum_id and scenario_type are required' },
      { status: 400 }
    );
  }

  const validScenarioTypes: ScenarioType[] = [
    'roleplay',
    'interview',
    'debate',
    'presentation',
  ];
  if (!validScenarioTypes.includes(scenario_type)) {
    return NextResponse.json(
      {
        error: `Invalid scenario_type. Must be one of: ${validScenarioTypes.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('learning_sessions')
    .insert({
      user_id: user.id,
      curriculum_id,
      scenario_type,
      status: 'active' as SessionStatus,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data as LearningSession }, { status: 201 });
}

// ============================
// GET — 내 학습 세션 목록
// ============================

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const curriculum_id = searchParams.get('curriculum_id');
  const status = searchParams.get('status') as SessionStatus | null;

  const supabase = getSupabaseServer();
  let query = supabase
    .from('learning_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  if (curriculum_id) {
    query = query.eq('curriculum_id', curriculum_id);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data as LearningSession[] });
}
