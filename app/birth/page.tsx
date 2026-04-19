/**
 * @task S2FE5 - Birth 페이지 React 전환
 * @file app/birth/page.tsx
 * @description 코코봇 생성 완료 탄생 애니메이션 페이지
 *
 * URL: /birth?botId={id}
 * - botId로 /api/bots/{id} 조회
 * - 실패(봇 없음, 파라미터 없음) 시 /home 리디렉트
 * - 순서형 애니메이션: 아이콘 → "탄생했습니다!" → URL → QR → 공유버튼
 *
 * Server Component (Next.js App Router)
 * - searchParams: botId 수신
 * - 데이터 페칭 실패 시 redirect('/home')
 *
 * @see components/birth/animation.tsx
 * @see components/birth/qr-display.tsx
 * @see components/birth/share-buttons.tsx
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { BirthPageClient } from './page-client';

/** Next.js 15 App Router — searchParams는 Promise<...> */
interface BirthPageProps {
  searchParams: Promise<{ botId?: string }>;
}

/**
 * 봇 데이터 타입 (API /api/bots/{id} 응답)
 * types/index.ts의 Chatbot과 호환
 */
interface BotData {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  deployUrl?: string;
  createdAt: string;
}

/**
 * /api/bots/{botId} 조회
 * 실패 시 null 반환
 */
async function fetchBot(botId: string, baseUrl: string): Promise<BotData | null> {
  try {
    const res = await fetch(`${baseUrl}/api/bots/${botId}`, {
      // 빌드 캐시 비활성화 — 항상 최신 봇 정보 조회
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const json = await res.json();
    // API 응답: { data: BotData } 또는 BotData 직접
    return (json.data ?? json) as BotData;
  } catch (err) {
    console.error('[BirthPage] 봇 조회 실패:', err);
    return null;
  }
}

/**
 * 동적 메타데이터 — 봇 이름을 타이틀에 포함
 */
export async function generateMetadata({
  searchParams,
}: BirthPageProps): Promise<Metadata> {
  const { botId } = await searchParams;
  if (!botId) return { title: '코코봇 탄생 — CoCoBot' };

  return {
    title: `코코봇 탄생 — CoCoBot`,
    description: '새로운 코코봇이 탄생했습니다!',
  };
}

/**
 * BirthPage — 코코봇 탄생 완료 페이지 (Server Component)
 *
 * 1. searchParams에서 botId 추출
 * 2. botId 없으면 /home 리디렉트
 * 3. /api/bots/{botId} 조회 → 실패 시 /home 리디렉트
 * 4. BirthPageClient에 봇 데이터 전달
 */
export default async function BirthPage({ searchParams }: BirthPageProps) {
  const { botId } = await searchParams;

  // botId 파라미터 없으면 홈으로
  if (!botId) {
    redirect('/home');
  }

  // 서버사이드 절대 URL 구성
  // NEXT_PUBLIC_BASE_URL 환경변수 우선, 없으면 localhost:3000
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  const bot = await fetchBot(botId, baseUrl);

  // 봇 조회 실패 시 홈으로
  if (!bot) {
    redirect('/home');
  }

  // 배포 URL: bot.deployUrl 있으면 사용, 없으면 /chat/{id} 경로 구성
  const deployUrl =
    bot.deployUrl ?? `${baseUrl}/chat/${bot.id}`;

  return (
    <BirthPageClient
      bot={bot}
      deployUrl={deployUrl}
    />
  );
}
