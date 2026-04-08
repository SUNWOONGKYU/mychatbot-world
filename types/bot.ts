/** 챗봇 항목 (API 응답 구조) */
export interface Bot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  deploy_url: string | null;
  qr_svg: string | null;
  created_at: string;
  updated_at: string;
  conversation_count?: number;
}
