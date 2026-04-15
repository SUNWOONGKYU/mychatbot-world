/**
 * @task S5DO1
 * @description GET /api/health — 헬스체크 엔드포인트
 * 모니터링 도구, 로드밸런서, uptime 서비스에서 서비스 상태 확인에 사용
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mychatbot-world',
    },
    { status: 200 }
  );
}
