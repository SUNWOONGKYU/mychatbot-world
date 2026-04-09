/**
 * CPC Proxy — Vercel Security Checkpoint 우회
 * 브라우저 직접 호출 대신 서버사이드에서 CPC API 호출
 *
 * GET  /api/cpc-proxy?path=/api/platoons
 * POST /api/cpc-proxy?path=/api/platoons/mychatbot-1/commands
 */

const CPC_BASE = 'https://claude-platoons-control.vercel.app';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const path = req.query.path;
    if (!path || !path.startsWith('/api/')) {
        return res.status(400).json({ error: 'path required (must start with /api/)' });
    }

    // 추가 쿼리 파라미터를 path에 병합 (cmd_id, status 등)
    const extra = Object.entries(req.query)
        .filter(([k]) => k !== 'path')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    const sep = path.includes('?') ? '&' : '?';
    const url = extra ? `${CPC_BASE}${path}${sep}${extra}` : `${CPC_BASE}${path}`;

    const options = {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (req.method !== 'GET' && req.body) {
        options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    try {
        const upstream = await fetch(url, options);
        const data = await upstream.json();
        return res.status(upstream.status).json(data);
    } catch (e) {
        return res.status(502).json({ error: 'CPC upstream error', detail: e.message });
    }
}
