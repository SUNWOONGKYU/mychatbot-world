/**
 * Embedding API — Generates text embeddings via OpenRouter
 * POST /api/embed
 *
 * Converts text to a 384-dimensional vector for semantic search.
 * Uses a lightweight embedding model for cost efficiency.
 */
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
