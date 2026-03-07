// @task S3BA7
/**
 * Community Category API - Vercel Serverless Function
 * GET /api/Backend_APIs/community-category — 카테고리 목록 조회
 *
 * 별도 DB 테이블 없이 하드코딩된 카테고리 목록을 반환한다.
 * 카테고리: 자유게시판, 봇자랑, 질문답변, 팁공유, 공지사항
 */

/**
 * 봇카페 커뮤니티 카테고리 목록.
 * slug: URL 파라미터로 사용되는 영문 식별자
 * name: 화면에 표시되는 한국어 레이블
 * description: 카테고리 설명
 * icon: UI에서 사용할 아이콘 힌트 (선택적)
 * order: 정렬 순서 (낮을수록 앞)
 */
const CATEGORIES = [
  {
    id: 'notice',
    slug: 'notice',
    name: '공지사항',
    description: '봇카페 운영팀의 공지 및 업데이트 소식',
    icon: 'megaphone',
    order: 1,
  },
  {
    id: 'free',
    slug: 'free',
    name: '자유게시판',
    description: '봇과 AI에 관한 자유로운 이야기를 나눠보세요',
    icon: 'chat',
    order: 2,
  },
  {
    id: 'showcase',
    slug: 'showcase',
    name: '봇자랑',
    description: '내가 만든 봇을 소개하고 피드백을 받아보세요',
    icon: 'robot',
    order: 3,
  },
  {
    id: 'qna',
    slug: 'qna',
    name: '질문답변',
    description: '봇 제작, 프롬프트, 설정 등 궁금한 점을 질문하세요',
    icon: 'question',
    order: 4,
  },
  {
    id: 'tips',
    slug: 'tips',
    name: '팁공유',
    description: '유용한 봇 활용법, 프롬프트 팁을 공유해 주세요',
    icon: 'lightbulb',
    order: 5,
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (req.headers.origin && ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'].includes(req.headers.origin)) ? req.headers.origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    // 특정 카테고리 단건 조회
    if (slug) {
      const category = CATEGORIES.find(c => c.slug === slug);
      if (!category) return res.status(404).json({ error: `Category not found: ${slug}` });
      return res.status(200).json({ category });
    }

    // 전체 목록 반환 (order 기준 오름차순, 이미 정렬된 상수이지만 명시적으로 정렬)
    const sorted = [...CATEGORIES].sort((a, b) => a.order - b.order);
    return res.status(200).json({ categories: sorted, total: sorted.length });
  } catch (err) {
    console.error('[community-category] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
