/**
 * @task S4BA3
 * @description 디지털 유산 전환 API
 *
 * Endpoints:
 * - POST /api/inheritance/transfer          유산 전환 요청 생성 (pending_review 상태)
 * - GET  /api/inheritance/transfer?id=xxx   전환 프로세스 상태 조회
 *
 * Tables:
 * - mcw_inheritance_settings    피상속인 지정 현황
 * - mcw_inheritance_transfers   유산 전환 요청
 * - mcw_inheritance_event_logs  이벤트 로그
 *
 * 중요 제약사항:
 * - 실제 유산 전환(페르소나 소유권 이전)은 관리자 수동 승인 후 수행 (자동 전환 금지)
 * - 사망 증명 문서는 URL만 저장 (파일 업로드는 별도 스토리지 서비스)
 * - 피상속인이 없으면 전환 불가 (데이터 보존 정책)
 * - 전환 상태: pending_review → approved → transferred
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ============================
// Supabase 클라이언트 & 인증
// ============================

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('서버 설정 오류: Supabase 환경 변수가 누락되었습니다.');
  return createClient(url, key) as any;
}

async function authenticate(
  supabase: ReturnType<typeof createClient>,
  authHeader: string | null
): Promise<{ userId: string | null; userEmail: string | null; error: string | null }> {
  if (!authHeader) return { userId: null, userEmail: null, error: '인증이 필요합니다.' };
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { userId: null, userEmail: null, error: '인증 토큰이 없습니다.' };
  const { data, error } = await (supabase as any).auth.getUser(token);
  if (error || !data?.user) {
    return { userId: null, userEmail: null, error: '유효하지 않거나 만료된 토큰입니다.' };
  }
  return { userId: data.user.id, userEmail: data.user.email ?? null, error: null };
}

// ============================
// 타입 정의
// ============================

type TransferStatus = 'pending_review' | 'approved' | 'rejected' | 'transferred';

interface InheritanceTransfer {
  id: string;
  inheritance_id: string;
  requested_by: string;
  original_owner_id: string;
  proof_document_url: string | null;
  status: TransferStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  transferred_at: string | null;
  created_at: string;
  updated_at: string;
}

interface InheritanceSetting {
  id: string;
  owner_id: string;
  heir_id: string | null;
  heir_email: string;
  consent_status: 'pending' | 'accepted' | 'declined';
}

interface PostTransferBody {
  originalOwnerId: string;
  proof: string;  // 사망 증명 문서 URL
  note?: string;
}

interface UserProfileRow {
  role: string | null;
}

// ============================
// 헬퍼 함수
// ============================

function getStatusLabel(status: TransferStatus): string {
  const labels: Record<TransferStatus, string> = {
    pending_review: '검토 대기 중',
    approved: '승인됨 (전환 예정)',
    rejected: '거부됨',
    transferred: '전환 완료',
  };
  return labels[status];
}

function getNextStep(status: TransferStatus): string {
  const steps: Record<TransferStatus, string> = {
    pending_review: '관리자가 사망 증명 서류를 검토하고 있습니다.',
    approved: '관리자가 페르소나 소유권 이전 작업을 진행합니다.',
    rejected: '거부 사유를 확인하고 필요 시 재신청하세요.',
    transferred: '유산 전환이 완료되었습니다.',
  };
  return steps[status];
}

// ============================
// GET /api/inheritance/transfer
// ============================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  const { userId, error: authError } = await authenticate(
    supabase,
    request.headers.get('authorization')
  );
  if (authError || !userId) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const transferId = searchParams.get('id');

  if (!transferId) {
    return NextResponse.json(
      { success: false, error: 'id 쿼리 파라미터가 필요합니다.' },
      { status: 400 }
    );
  }

  const { data: transfer, error: transferError } = await (supabase as any)
    .from('mcw_inheritance_transfers')
    .select('*')
    .eq('id', transferId)
    .maybeSingle();

  if (transferError) {
    console.error('[GET /api/inheritance/transfer]', transferError);
    return NextResponse.json(
      { success: false, error: '전환 요청 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  if (!transfer) {
    return NextResponse.json(
      { success: false, error: '전환 요청을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 접근 권한 확인: 요청자, 원 소유자, 관리자만 조회 가능
  const isRequester = transfer.requested_by === userId;
  const isOriginalOwner = transfer.original_owner_id === userId;

  if (!isRequester && !isOriginalOwner) {
    const { data: userProfile } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (!userProfile?.is_admin) {
      return NextResponse.json(
        { success: false, error: '이 전환 요청에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: transfer.id,
        inheritanceId: transfer.inheritance_id,
        requestedBy: transfer.requested_by,
        originalOwnerId: transfer.original_owner_id,
        proofDocumentUrl: transfer.proof_document_url,
        status: transfer.status,
        adminNote: transfer.admin_note,
        reviewedBy: transfer.reviewed_by,
        reviewedAt: transfer.reviewed_at,
        transferredAt: transfer.transferred_at,
        createdAt: transfer.created_at,
        updatedAt: transfer.updated_at,
        statusLabel: getStatusLabel(transfer.status),
        nextStep: getNextStep(transfer.status),
      },
    },
    { status: 200 }
  );
}

// ============================
// POST /api/inheritance/transfer
// ============================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = getSupabase();
  const { userId, userEmail, error: authError } = await authenticate(
    supabase,
    request.headers.get('authorization')
  );
  if (authError || !userId || !userEmail) {
    return NextResponse.json({ success: false, error: authError }, { status: 401 });
  }

  let body: PostTransferBody;
  try {
    body = (await request.json()) as PostTransferBody;
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { originalOwnerId, proof, note } = body;

  if (!originalOwnerId) {
    return NextResponse.json(
      { success: false, error: 'originalOwnerId가 필요합니다.' },
      { status: 400 }
    );
  }
  if (!proof) {
    return NextResponse.json(
      { success: false, error: 'proof (사망 증명 문서 URL)가 필요합니다.' },
      { status: 400 }
    );
  }
  if (!proof.startsWith('http://') && !proof.startsWith('https://')) {
    return NextResponse.json(
      { success: false, error: 'proof는 유효한 URL이어야 합니다 (http:// 또는 https://).' },
      { status: 400 }
    );
  }

  // 관리자 여부 확인
  const { data: userProfile } = await (supabase as any)
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  const isAdmin = userProfile?.is_admin === true;

  // 원 소유자의 피상속인 설정 조회
  const { data: inheritanceSetting, error: settingError } = await (supabase as any)
    .from('mcw_inheritance_settings')
    .select('*')
    .eq('owner_id', originalOwnerId)
    .maybeSingle();

  if (settingError) {
    console.error('[POST /api/inheritance/transfer] 설정 조회 오류:', settingError);
    return NextResponse.json(
      { success: false, error: '피상속인 설정 조회에 실패했습니다.' },
      { status: 500 }
    );
  }

  if (!inheritanceSetting) {
    return NextResponse.json(
      {
        success: false,
        error:
          '해당 소유자에게 지정된 피상속인이 없습니다. 데이터 보존 정책에 따라 피상속인 없이는 전환이 불가합니다.',
      },
      { status: 400 }
    );
  }

  // 피상속인 동의 확인
  if (inheritanceSetting.consent_status !== 'accepted') {
    return NextResponse.json(
      {
        success: false,
        error: `피상속인이 아직 동의하지 않았습니다. (현재 동의 상태: ${inheritanceSetting.consent_status})`,
      },
      { status: 400 }
    );
  }

  // 요청자가 피상속인이거나 관리자인지 확인
  const isDesignatedHeir =
    inheritanceSetting.heir_id === userId ||
    inheritanceSetting.heir_email.toLowerCase() === userEmail.toLowerCase();

  if (!isAdmin && !isDesignatedHeir) {
    return NextResponse.json(
      {
        success: false,
        error: '유산 전환을 요청할 권한이 없습니다. 지정된 피상속인 또는 관리자만 요청 가능합니다.',
      },
      { status: 403 }
    );
  }

  // 진행 중인 전환 요청 중복 확인
  const { data: existingTransfer } = await (supabase as any)
    .from('mcw_inheritance_transfers')
    .select('id, status')
    .eq('inheritance_id', inheritanceSetting.id)
    .in('status', ['pending_review', 'approved'])
    .maybeSingle();

  if (existingTransfer) {
    return NextResponse.json(
      {
        success: false,
        error: `이미 진행 중인 전환 요청이 있습니다. (ID: ${existingTransfer.id}, 상태: ${existingTransfer.status})`,
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  // 전환 요청 생성 — pending_review 상태 (자동 전환 금지)
  const { data: newTransfer, error: insertError } = await (supabase as any)
    .from('mcw_inheritance_transfers')
    .insert({
      inheritance_id: inheritanceSetting.id,
      requested_by: userId,
      original_owner_id: originalOwnerId,
      proof_document_url: proof,
      status: 'pending_review',
      admin_note: note ?? null,
      reviewed_by: null,
      reviewed_at: null,
      transferred_at: null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (insertError || !newTransfer) {
    console.error('[POST /api/inheritance/transfer] 전환 요청 생성 오류:', insertError);
    return NextResponse.json(
      { success: false, error: '전환 요청 생성에 실패했습니다.' },
      { status: 500 }
    );
  }

  // 이벤트 로그 기록
  await (supabase as any).from('mcw_inheritance_event_logs').insert({
    inheritance_id: inheritanceSetting.id,
    event_type: 'transfer_requested',
    actor_id: userId,
    target_id: originalOwnerId,
    metadata: {
      transfer_id: newTransfer.id,
      proof_document_url: proof,
      note: note ?? null,
    },
    created_at: now,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        transferId: newTransfer.id,
        inheritanceId: inheritanceSetting.id,
        status: 'pending_review',
        message: '유산 전환 요청이 생성되었습니다. 관리자 검토 후 승인이 진행됩니다.',
        nextStep: '관리자가 제출된 사망 증명 서류를 검토한 후 전환 승인 여부를 결정합니다.',
      },
    },
    { status: 201 }
  );
}
