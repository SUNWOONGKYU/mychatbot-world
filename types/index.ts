// @task S1BI1 - Next.js 프로젝트 초기화 + Tailwind CSS 설정
// 공통 TypeScript 타입 정의
// 각 도메인별 타입은 해당 태스크에서 확장 예정

// ============================
// 기본 공통 타입
// ============================

/** API 응답 래퍼 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/** 페이지네이션 파라미터 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/** 페이지네이션 결과 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================
// 챗봇 관련 타입 (S2F1에서 확장 예정)
// ============================

/** 챗봇 기본 타입 */
export interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isPublic: boolean;
}

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  chatbotId?: string;
}

/** 채팅 세션 */
export interface ChatSession {
  id: string;
  chatbotId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ============================
// 사용자 관련 타입 (S1M1에서 확장 예정)
// ============================

/** 사용자 프로필 */
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ============================
// UI 컴포넌트 타입
// ============================

/** 공통 컴포넌트 Props */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/** 로딩 상태 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
