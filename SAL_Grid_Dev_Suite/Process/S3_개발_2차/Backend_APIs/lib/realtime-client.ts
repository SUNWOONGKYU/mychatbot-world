/**
 * @task S3BA4
 * @description Supabase Realtime 클라이언트 유틸리티
 * - 게시글별 실시간 구독 (new_comment, new_like, new_reply)
 * - 마당(yard) Presence + broadcast 구독
 * - 클라이언트 사이드에서만 사용 (FE Task에서 import)
 */
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

/** Realtime 이벤트 타입 */
export type CommunityEvent = 'new_comment' | 'new_like' | 'new_reply';

/** Realtime 브로드캐스트 페이로드 */
export interface BroadcastPayload<T = Record<string, unknown>> {
  event: CommunityEvent;
  payload: T & {
    sender_id?: string;
    timestamp?: string;
  };
}

/** 마당 메시지 */
export interface YardMessage {
  id: string;
  user_id: string;
  content: string;
  expires_at: string;
  created_at: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

/** Presence 상태 */
export interface PresenceState {
  user_id: string;
  online_at: string;
}

/**
 * Supabase 클라이언트 (클라이언트 사이드 전용)
 * 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * 게시글 실시간 구독
 * - 댓글 추가, 좋아요, 대댓글 이벤트 수신
 * @param postId 게시글 ID
 * @param callback 이벤트 수신 콜백
 * @returns RealtimeChannel (unsubscribe 용도로 사용)
 *
 * @example
 * const channel = subscribeToPost('post-123', (payload) => {
 *   console.log(payload.event, payload.payload);
 * });
 * // 언마운트 시
 * channel.unsubscribe();
 */
export function subscribeToPost(
  postId: string,
  callback: (payload: BroadcastPayload) => void
): RealtimeChannel {
  const supabase = getSupabaseClient();

  return supabase
    .channel(`community-${postId}`)
    .on(
      'broadcast',
      { event: 'new_comment' },
      (data) => callback(data as unknown as BroadcastPayload)
    )
    .on(
      'broadcast',
      { event: 'new_like' },
      (data) => callback(data as unknown as BroadcastPayload)
    )
    .on(
      'broadcast',
      { event: 'new_reply' },
      (data) => callback(data as unknown as BroadcastPayload)
    )
    .subscribe();
}

/**
 * 마당(Yard) 실시간 구독 — 메시지 + Presence (접속자 수)
 * @param userId 현재 사용자 ID (Presence 등록에 사용)
 * @param onMessage 새 메시지 수신 콜백
 * @param onPresenceChange 접속자 변경 콜백 (현재 접속자 Set 반환)
 * @returns RealtimeChannel
 *
 * @example
 * const channel = subscribeToYard(
 *   'user-456',
 *   (message) => addMessage(message),
 *   (users) => setOnlineCount(users.size)
 * );
 * channel.unsubscribe();
 */
export function subscribeToYard(
  userId: string,
  onMessage: (message: YardMessage) => void,
  onPresenceChange: (onlineUsers: Set<string>) => void
): RealtimeChannel {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel('community-yard', {
      config: { presence: { key: userId } },
    })
    .on('broadcast', { event: 'new_message' }, (data) => {
      const payload = data as unknown as { payload: { message: YardMessage } };
      onMessage(payload.payload.message);
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>();
      const userSet = new Set(Object.keys(state));
      onPresenceChange(userSet);
    })
    .on('presence', { event: 'join' }, () => {
      const state = channel.presenceState<PresenceState>();
      onPresenceChange(new Set(Object.keys(state)));
    })
    .on('presence', { event: 'leave' }, () => {
      const state = channel.presenceState<PresenceState>();
      onPresenceChange(new Set(Object.keys(state)));
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Presence 등록
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}

/**
 * 채널 구독 해제 (클린업 헬퍼)
 * @param channel 구독 해제할 채널
 */
export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.removeChannel(channel);
}
