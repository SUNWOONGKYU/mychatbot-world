/**
 * @task S3BA1
 * @description 커리큘럼 진도 관리 API
 *
 * GET /api/school/progress — 사용자 전체 커리큘럼 진도 조회
 *   쿼리: ?curriculum_id=xxx (선택, 특정 커리큘럼만 조회)
 *   응답: { progress_list: LearningProgress[] }
 *
 * PUT /api/school/progress — 특정 모듈 진도율 업데이트
 *   요청: { curriculum_id, module_id, progress_rate, status? }
 *   응답: { progress: LearningProgress }
 *
 * learning_progress 테이블 CRUD
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================
// 타입 정의
// ============================

type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

interface LearningProgress {
  id: string;
  user_id: string;
  curriculum_id: string;
  module_id: string;
  progress_rate: number; // 0~100
  status: ProgressStatus;
  last_accessed_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PutRequestBody {
  /** 커리큘럼 ID */
  curriculum_id: string;
  /** 모듈 ID */
  module_id: string;
  /** 진도율 (0~100) */
  progress_rate: number;
  /** 상태 (기본값: 진도율에 따라 자동 결정) */
  status?: ProgressStatus;
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
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ============================
// 진도율 → 상태 자동 결정
// ============================

function deriveStatus(progressRate: number): ProgressStatus {
  if (progressRate === 0) return 'not_started';
  if (progressRate >= 100) return 'completed';
  return 'in_progress';
}

// ============================
// GET — 진도 조회
// ============================

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const curriculum_id = searchParams.get('curriculum_id');
  const module_id = searchParams.get('module_id');

  const supabase = getSupabaseServer();
  let query = supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('last_accessed_at', { ascending: false });

  if (curriculum_id) {
    query = query.eq('curriculum_id', curriculum_id);
  }
  if (module_id) {
    query = query.eq('module_id', module_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 커리큘럼별 요약 통계 계산
  const progressList = data as LearningProgress[];
  const summary = computeProgressSummary(progressList);

  return NextResponse.json({
    progress_list: progressList,
    summary,
  });
}

// ============================
// 진도 요약 계산
// ============================

interface ProgressSummary {
  [curriculum_id: string]: {
    total_modules: number;
    completed_modules: number;
    average_progress: number;
    overall_status: ProgressStatus;
  };
}

function computeProgressSummary(progressList: LearningProgress[]): ProgressSummary {
  const summary: ProgressSummary = {};

  for (const progress of progressList) {
    const cid = progress.curriculum_id;
    if (!summary[cid]) {
      summary[cid] = {
        total_modules: 0,
        completed_modules: 0,
        average_progress: 0,
        overall_status: 'not_started',
      };
    }

    summary[cid].total_modules += 1;
    if (progress.status === 'completed') {
      summary[cid].completed_modules += 1;
    }
  }

  // 평균 진도율 및 전체 상태 계산
  for (const cid of Object.keys(summary)) {
    const curriculumProgress = progressList.filter(
      (p: any) => p.curriculum_id === cid
    );
    const totalRate = curriculumProgress.reduce(
      (sum: any, p: any) => sum + p.progress_rate,
      0
    );
    summary[cid].average_progress = Math.round(
      totalRate / curriculumProgress.length
    );
    summary[cid].overall_status = deriveStatus(summary[cid].average_progress);
  }

  return summary;
}

// ============================
// PUT — 진도 업데이트
// ============================

export async function PUT(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PutRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { curriculum_id, module_id, progress_rate, status } = body;

  // 입력 검증
  if (!curriculum_id || !module_id) {
    return NextResponse.json(
      { error: 'curriculum_id and module_id are required' },
      { status: 400 }
    );
  }

  if (
    typeof progress_rate !== 'number' ||
    progress_rate < 0 ||
    progress_rate > 100
  ) {
    return NextResponse.json(
      { error: 'progress_rate must be a number between 0 and 100' },
      { status: 400 }
    );
  }

  const validStatuses: ProgressStatus[] = [
    'not_started',
    'in_progress',
    'completed',
  ];
  if (status !== undefined && !validStatuses.includes(status)) {
    return NextResponse.json(
      {
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // 상태 결정: 명시적으로 제공된 경우 사용, 아니면 진도율에서 자동 계산
  const resolvedStatus: ProgressStatus = status ?? deriveStatus(progress_rate);
  const now = new Date().toISOString();

  const supabase = getSupabaseServer();

  // UPSERT: 기존 레코드 없으면 INSERT, 있으면 UPDATE
  const { data, error } = await supabase
    .from('learning_progress')
    .upsert(
      {
        user_id: user.id,
        curriculum_id,
        module_id,
        progress_rate: Math.round(progress_rate),
        status: resolvedStatus,
        last_accessed_at: now,
        completed_at:
          resolvedStatus === 'completed' ? now : null,
        updated_at: now,
      },
      {
        onConflict: 'user_id,curriculum_id,module_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data as LearningProgress });
}
