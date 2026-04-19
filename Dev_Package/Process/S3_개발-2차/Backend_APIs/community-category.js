// @task S3BA7
/**
 * Community Category API - Vercel Serverless Function (하위호환 래퍼)
 * GET /api/Backend_APIs/community-category — 카테고리 목록 조회
 *
 * community-madang.js로 포워딩. 기존 호출 깨지지 않게 유지.
 * 새 코드는 community-madang.js 사용 권장.
 */

const ALLOWED_ORIGINS = ['https://mychatbot.world', 'http://localhost:3000', 'http://localhost:5173'];

// 하위호환용 정적 카테고리 목록 (마당 ID와 동일하게 맞춤)
const CATEGORIES = [
  { id: 'free',     slug: 'free',     name: '자유마당',  description: '봇과 AI에 관한 자유로운 이야기',       icon: 'chat',      color: '#6C5CE7', order: 1 },
  { id: 'tech',     slug: 'tech',     name: '기술마당',  description: '코코봇 개발 기술, 프롬프트 엔지니어링',   icon: 'code',      color: '#00CEC9', order: 2 },
  { id: 'daily',    slug: 'daily',    name: '일상마당',  description: '코코봇과의 일상, 재미있는 대화 공유',     icon: 'sun',       color: '#fdcb6e', order: 3 },
  { id: 'showcase', slug: 'showcase', name: '자랑마당',  description: '내가 만든 코코봇을 소개하고 피드백 받기', icon: 'star',      color: '#fd79a8', order: 4 },
  { id: 'qna',      slug: 'qna',      name: '질문마당',  description: '코코봇 제작, 설정 등 궁금한 점 질문',    icon: 'question',  color: '#e17055', order: 5 },
  { id: 'tips',     slug: 'tips',     name: '팁마당',    description: '유용한 봇 활용법, 프롬프트 팁 공유',   icon: 'lightbulb', color: '#00b894', order: 6 },
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : 'https://mychatbot.world');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { slug, id } = req.query;
    const key = slug || id;

    if (key) {
      const category = CATEGORIES.find(c => c.slug === key || c.id === key);
      if (!category) return res.status(404).json({ error: `Category not found: ${key}` });
      return res.status(200).json({ category });
    }

    const sorted = [...CATEGORIES].sort((a, b) => a.order - b.order);
    return res.status(200).json({ categories: sorted, madangs: sorted, total: sorted.length });
  } catch (err) {
    console.error('[community-category] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
