#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cpc_http_bridge.py — CPC HTTP Bridge (Tailscale Funnel용)

Tailscale Funnel로 노출되어, 챗봇이 Vercel+Supabase를 거치지 않고
이 PC에 직접 명령을 전달할 수 있게 해주는 HTTP 브릿지.

엔드포인트:
  POST /command  → 명령 수신, 큐에 저장
  GET  /command  → 현재 큐의 PENDING 명령 반환 (MCP 서버가 폴링)
  POST /result   → 명령 결과 저장
  GET  /result?cmd_id=xxx → 결과 조회 (챗봇이 폴링)
  GET  /health   → 서버 상태

사용:
  python3 cpc_http_bridge.py
  → http://localhost:8443 에서 서비스
  → tailscale funnel 8443 으로 공개
"""

import json
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# 인메모리 명령 큐
_commands = {}      # cmd_id → {id, text, status, result, created_at}
_cmd_lock = threading.Lock()
_cmd_event = threading.Event()  # 새 명령 도착 시 시그널

PORT = 8443


class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # 로그 억제

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json_response(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path == '/health':
            with _cmd_lock:
                pending = sum(1 for c in _commands.values() if c['status'] == 'PENDING')
            self._json_response(200, {
                'status': 'ok',
                'service': 'CPC HTTP Bridge (Tailscale)',
                'pending_commands': pending,
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            })

        elif path == '/command':
            # MCP 서버가 PENDING 명령을 가져감
            with _cmd_lock:
                pending = [c for c in _commands.values() if c['status'] == 'PENDING']
                # 가장 오래된 것 하나 반환 + ACKED 전환
                if pending:
                    cmd = sorted(pending, key=lambda x: x['created_at'])[0]
                    cmd['status'] = 'ACKED'
                    self._json_response(200, cmd)
                else:
                    self._json_response(200, None)

        elif path == '/result':
            cmd_id = qs.get('cmd_id', [''])[0]
            if not cmd_id:
                self._json_response(400, {'error': 'cmd_id required'})
                return
            with _cmd_lock:
                cmd = _commands.get(cmd_id)
            if cmd and cmd['status'] == 'DONE':
                self._json_response(200, cmd)
            else:
                self._json_response(200, None)

        else:
            self._json_response(404, {'error': 'Not found'})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/command':
            body = self._read_body()
            text = body.get('text', '')
            source = body.get('source', 'chatbot')
            if not text:
                self._json_response(400, {'error': 'text required'})
                return
            cmd_id = f'ts-{int(time.time()*1000)}-{id(text) % 100000:05d}'
            cmd = {
                'id': cmd_id,
                'text': text,
                'source': source,
                'status': 'PENDING',
                'result': None,
                'created_at': time.time()
            }
            with _cmd_lock:
                _commands[cmd_id] = cmd
            _cmd_event.set()  # 대기 중인 폴러 깨움
            self._json_response(201, cmd)

        elif path == '/result':
            body = self._read_body()
            cmd_id = body.get('cmd_id', '')
            result = body.get('result', '')
            if not cmd_id:
                self._json_response(400, {'error': 'cmd_id required'})
                return
            with _cmd_lock:
                cmd = _commands.get(cmd_id)
                if cmd:
                    cmd['status'] = 'DONE'
                    cmd['result'] = result
                    self._json_response(200, cmd)
                else:
                    self._json_response(404, {'error': 'command not found'})

        else:
            self._json_response(404, {'error': 'Not found'})


def wait_for_command(timeout=30):
    """MCP 서버용: PENDING 명령이 올 때까지 대기 (블로킹)"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        with _cmd_lock:
            pending = [c for c in _commands.values() if c['status'] == 'PENDING']
            if pending:
                cmd = sorted(pending, key=lambda x: x['created_at'])[0]
                cmd['status'] = 'ACKED'
                return cmd
        _cmd_event.clear()
        _cmd_event.wait(timeout=min(5, deadline - time.time()))
    return None


if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), BridgeHandler)
    print(f'CPC HTTP Bridge running on port {PORT}')
    print(f'Expose via: tailscale funnel {PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
        server.shutdown()
