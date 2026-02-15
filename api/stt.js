/**
 * STT API - Vercel Serverless Function
 * POST /api/stt
 * OpenAI Whisper로 음성→텍스트 변환 (원소스 멀티유즈)
 * 플랫폼/텔레그램 동일 서비스
 */
const FormData = require('form-data');

module.exports = async (req, res) => {
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
      return res.status(200).json({
        text: '',
        useBrowserSTT: true,
        message: 'STT API key not configured'
      });
    }

    const { audio, language = 'ko' } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'audio (base64) is required' });
    }

    const audioBuffer = Buffer.from(audio, 'base64');

    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!whisperRes.ok) {
      console.error('Whisper API error:', await whisperRes.text());
      return res.status(200).json({ text: '', useBrowserSTT: true });
    }

    const result = await whisperRes.json();
    res.status(200).json({ text: result.text || '', model: 'whisper-1' });
  } catch (error) {
    console.error('STT error:', error);
    res.status(500).json({ error: 'STT failed', useBrowserSTT: true });
  }
};
