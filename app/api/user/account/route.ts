/**
 * @task S5BA4
 * @description DELETE /api/user/account — 계정 완전 삭제 API
 *
 * 처리 순서:
 * 1. Bearer 토큰 인증 (withAuth)
 * 2. 비밀번호 재확인 (재인증)
 * 3. 사용자 데이터 삭제 (cascade: conversations → messages → chatbots → profile)
 * 4. Supabase auth.admin.deleteUser() 호출
 * 5. 204 No Content 반환
 *
 * 의존성: S5S1 (동의 플로우), S5BA1 (Zod)
 */

import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/api-auth';
import { z } from 'zod';

const DeleteAccountSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해 주세요'),
  confirmPhrase: z.literal('계정삭제', { error: '확인 문구가 올바르지 않습니다' }),
});

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const DELETE = withAuth(async (req, ctx) => {
  // 1. 요청 파싱 + 검증
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }

  const parsed = DeleteAccountSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다' },
      { status: 400 }
    );
  }

  const { password } = parsed.data;
  const { userId, email } = ctx;

  if (!email) {
    return Response.json({ error: '이메일 정보를 확인할 수 없습니다' }, { status: 400 });
  }

  // 2. 비밀번호 재확인 (anon key로 재인증)
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error: signInError } = await anonSupabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return Response.json({ error: '비밀번호가 올바르지 않습니다' }, { status: 401 });
  }

  // 3. 사용자 데이터 삭제 (service_role — RLS 우회)
  const supabase = getAdminSupabase();

  // cascade 순서: messages는 conversations FK 의존, chatbots는 user FK
  // Supabase ON DELETE CASCADE 설정 여부에 따라 순서 조정 필요
  const tables: { table: string; column: string }[] = [
    { table: 'messages', column: 'conversation_id' },   // conversations 통해 간접 삭제 가능하나 명시적으로
    { table: 'conversations', column: 'user_id' },
    { table: 'chatbots', column: 'user_id' },
    { table: 'mcw_credits', column: 'user_id' },
    { table: 'profiles', column: 'id' },
  ];

  // messages는 conversation_id로 조회해야 하므로 별도 처리
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId);

  if (convs && convs.length > 0) {
    const convIds = (convs as { id: string }[]).map((c) => c.id);
    await supabase.from('messages').delete().in('conversation_id', convIds);
  }

  for (const { table, column } of tables.filter((t) => t.table !== 'messages')) {
    const { error } = await supabase.from(table).delete().eq(column, userId);
    if (error) {
      console.warn(`[delete-account] ${table} delete warning:`, error.message);
      // 계속 진행 (일부 테이블은 없을 수 있음)
    }
  }

  // 4. auth 사용자 삭제
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('[delete-account] auth.admin.deleteUser failed:', deleteError.message);
    return Response.json({ error: '계정 삭제 중 오류가 발생했습니다' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
});
