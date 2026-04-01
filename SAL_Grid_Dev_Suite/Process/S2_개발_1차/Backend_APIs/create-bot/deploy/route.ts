/**
 * @task S2BA1
 * @description 배포 URL + QR 발급 API
 *
 * POST /api/create-bot/deploy
 * Request: { botId: string }
 * Response: { deployUrl, qrSvg, qrDataUrl }
 *
 * - Supabase auth 인증 필수 (봇 소유자 확인)
 * - mcw_bots 테이블에서 botId 소유권 검증
 * - 배포 URL: /bot/{botId} 형식
 * - QR: generateQR 유틸 사용
 * - TypeScript strict 준수
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { generateQR } from '@/lib/qr-generator';

/** 배포 요청 바디 */
interface DeployRequest {
  botId: string;
}

/** 배포 응답 데이터 */
interface DeployData {
  botId: string;
  deployUrl: string;
  qrSvg: string;
  qrDataUrl: string;
}

/** 배포 API 응답 */
interface DeployResponse {
  success: boolean;
  data?: DeployData;
  error?: string;
}

/**
 * POST /api/create-bot/deploy
 * 챗봇 배포 URL을 생성하고 QR코드를 발급한다.
 */
export async function POST(request: NextRequest): Promise<NextResponse<DeployResponse>> {
  // ── 1. 인증 검증 ────────────────────────────────────────────────────────────
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }

  const userId = session.user.id;

  // ── 2. 요청 파싱 및 유효성 검사 ────────────────────────────────────────────
  let body: DeployRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: '요청 바디를 파싱할 수 없습니다.' },
      { status: 400 }
    );
  }

  const { botId } = body;

  if (!botId?.trim()) {
    return NextResponse.json(
      { success: false, error: 'botId는 필수 항목입니다.' },
      { status: 400 }
    );
  }

  // ── 3. 봇 소유권 검증 ──────────────────────────────────────────────────────
  const { data: bot, error: botError } = await supabase
    .from('mcw_bots')
    .select('id, username, owner_id')
    .eq('id', botId)
    .single();

  if (botError || !bot) {
    return NextResponse.json(
      { success: false, error: '챗봇을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // owner_id는 TEXT (Supabase auth UUID 또는 'admin')
  if (bot.owner_id !== userId && bot.owner_id !== 'admin') {
    return NextResponse.json(
      { success: false, error: '이 챗봇에 대한 권한이 없습니다.' },
      { status: 403 }
    );
  }

  // ── 4. 배포 URL 생성 ────────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mychatbot.world';

  // username이 있으면 /bot/{username}, 없으면 /bot/{botId} 사용
  const slug = bot.username ?? botId;
  const deployUrl = `${baseUrl}/bot/${slug}`;

  // ── 5. QR코드 생성 ──────────────────────────────────────────────────────────
  let qrSvg = '';
  let qrDataUrl = '';

  try {
    const qrResult = await generateQR(deployUrl, {
      size: 300,
      margin: 4,
      errorCorrectionLevel: 'M',
      darkColor: '#1a1a2e',
      lightColor: '#ffffff',
    });
    qrSvg = qrResult.svg;
    qrDataUrl = qrResult.dataUrl;
  } catch (qrError) {
    console.error('[deploy] QR 생성 오류:', qrError);
    // QR 실패해도 URL은 반환
  }

  // ── 6. 응답 반환 ────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    data: {
      botId,
      deployUrl,
      qrSvg,
      qrDataUrl,
    },
  });
}
