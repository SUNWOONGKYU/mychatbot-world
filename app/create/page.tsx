/**
 * @task S2FE1
 * @description Create 위저드 페이지 — Vanilla 원본 8단계 충실 전환
 *
 * Step 1: 기본정보 (챗봇 이름, 한줄소개, URL 사용자명)
 * Step 2: 대표 페르소나 설정 (이름, 호칭, 역할, 감정슬라이더, AI모델)
 * Step 3: 인터뷰 (음성/텍스트 입력)
 * Step 4: AI 분석 중 → 결과 확인 (인사말 TTS 미리듣기 포함)
 * Step 5: 완성 (목소리 선택 + 챗봇 생성하기)
 * Step 6: 아바타 설정 (이모지 선택 + 이미지 업로드)
 * Step 7: 테마 선택 (다크/라이트 + 색상 + 미리보기)
 * Step 8: 배포 (채널 선택 + URL 복사 + QR 코드)
 */
'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const CreateWizard = dynamic(() => import('@/components/create/CreateWizard'), { ssr: false });

export default function CreatePage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen"
      style={{
        background: 'rgb(var(--bg-base))',
        paddingTop: '80px',
        paddingBottom: '40px',
      }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1rem' }}>
        <CreateWizard onComplete={(botId: string) => router.push(`/birth/${botId}`)} />
      </div>
    </main>
  );
}
