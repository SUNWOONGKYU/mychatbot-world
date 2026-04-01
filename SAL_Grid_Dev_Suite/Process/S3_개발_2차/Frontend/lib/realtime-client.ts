/**
 * @task S3FE4
 * @description Supabase Realtime 클라이언트 — Community FE 전용 re-export
 * S3BA4에서 작성된 realtime-client를 FE에서 사용하기 위한 진입점
 */
export {
  subscribeToPost,
  subscribeToYard,
  unsubscribeChannel,
} from '@/lib/realtime-client';

export type {
  CommunityEvent,
  BroadcastPayload,
  YardMessage,
  PresenceState,
} from '@/lib/realtime-client';
