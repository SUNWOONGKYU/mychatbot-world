/**
 * Health check API
 * GET /api/health
 */
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'My Chatbot World',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/chat', '/api/create-bot', '/api/tts', '/api/health']
  });
}
