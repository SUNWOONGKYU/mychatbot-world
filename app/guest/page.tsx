/**
 * @task S2F6 — 게스트 체험 모드 UI
 * @description 게스트 페이지 래퍼 — Suspense 경계 + 메타데이터
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import GuestPageInner from './page-client';

export const metadata: Metadata = {
  title: '게스트 체험 — My Chatbot World',
  description: '회원가입 없이 AI 챗봇을 무료로 체험해보세요. 직업 카테고리를 선택하면 바로 시작할 수 있습니다.',
};

export default function GuestPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#f8fafc',
          }}
        >
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading...</p>
        </div>
      }
    >
      <GuestPageInner />
    </Suspense>
  );
}
