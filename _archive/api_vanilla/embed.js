/**
 * Embedding API — Generates text embeddings via OpenRouter
 * POST /api/embed
 *
 * Converts text to a 1536-dimensional vector for semantic search.
 * Includes per-IP rate limiting to prevent abuse.
 */

// Simple in-memory rate limiter (per Vercel instance)
const RATE_LIMIT = {};
const RATE_WINDOW_MS = 60000; // 1 minute
const RATE_MAX = 30;          // max 30 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  if (!RATE_LIMIT[ip] || now - RATE_LIMIT[ip].start > RATE_WINDOW_MS) {
    RATE_LIMIT[ip] = { start: now, count: 1 };
    return true;
  }
  RATE_LIMIT[ip].count++;
  return RATE_LIMIT[ip].count <= RATE_MAX;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit check (x-vercel-forwarded-for is trusted on Vercel)
  const clientIp = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  const apiKey = (process.env.OPENROUTER_API_KEY || '').split(',')[0]?.trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Use OpenAI's embedding model via OpenRouter
    const resp = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text.slice(0, 8000) // Truncate to avoid token limits
      })
    });

    if (!resp.ok) {
      console.error('[Embed API] OpenRouter error:', resp.status);
      return res.status(502).json({ error: 'Embedding service error' });
    }

    const data = await resp.json();
    const vector = data.data?.[0]?.embedding;

    if (!vector) {
      return res.status(500).json({ error: 'No embedding returned' });
    }

    return res.status(200).json({ vector, dimensions: vector.length });
  } catch (e) {
    console.error('[Embed API] error:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
