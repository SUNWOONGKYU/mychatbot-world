/**
 * STT API - Vercel Serverless Function
 * POST /api/stt
 * OpenAI Whisper로 음성→텍스트 변환
 * Body: { audio: "base64 encoded audio", language: "ko" }
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return res.status(200).json({ text: '', error: 'OPENAI_API_KEY not configured' });
    }

    const { audio, language = 'ko' } = req.body || {};

    if (!audio) {
      return res.status(400).json({ error: 'audio (base64) is required' });
    }

    const audioBuffer = Buffer.from(audio, 'base64');

    if (audioBuffer.length < 100) {
      return res.status(200).json({ text: '' });
    }

    // Node.js 18+ native FormData + Blob
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      console.error('[STT] Whisper error:', whisperRes.status, errText);
      return res.status(200).json({ text: '', error: 'Whisper API error: ' + whisperRes.status });
    }

    const result = await whisperRes.json();
    res.status(200).json({ text: result.text || '', model: 'whisper-1' });
  } catch (error) {
    console.error('[STT] error:', error);
    res.status(500).json({ error: 'STT failed: ' + error.message });
  }
}
