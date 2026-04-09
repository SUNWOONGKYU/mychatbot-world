/**
 * @task S2BA3
 * TTS API - Vercel Serverless Function
 * POST /api/tts
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        message: 'TTS API key not configured. Use browser Web Speech API instead.',
        useBrowserTTS: true
      });
    }

    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.substring(0, 4096),
        voice: voice,
        speed: speed,
        response_format: 'mp3'
      })
    });

    if (!resp.ok) throw new Error(`OpenAI TTS error: ${resp.status}`);

    const buffer = await resp.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS generation failed', useBrowserTTS: true });
  }
}
