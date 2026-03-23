#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cpc_mcp_server.py — CPC MCP Server (stdio JSON-RPC 2.0)

Claude Code가 CPC 명령을 직접 수신·처리·보고할 수 있게 하는 MCP 도구 서버.
keyboard injection 없이 네이티브로 명령 처리 가능.

도구:
  - wait_cpc_command(platoon_id, timeout=60)
      CPC에서 PENDING 명령 대기 후 ACK → 반환.
      timeout 내 명령 없으면 null 반환.
  - report_cpc_result(cmd_id, result)
      CPC에 DONE 보고 (연락병 웹챗봇에 표시됨).
  - send_cpc_message(platoon_id, text)
      CC에서 챗봇으로 메시지 전송.
  - request_cpc_approval(platoon_id, description)
      챗봇에 승인/거부 버튼 표시. approval_id 반환.
  - wait_cpc_approval(platoon_id, approval_id, timeout)
      사용자의 승인/거부 응답 대기.

사용 흐름 (cpc-engage 이후):
  loop:
    cmd = cpc.wait_cpc_command(platoon_id, timeout=60)
    if cmd:
      [Claude가 cmd.text를 직접 처리]
      cpc.report_cpc_result(cmd.cmd_id, result)
    # timeout이면 다시 wait_cpc_command 호출
"""
import json
import sys
import time
import urllib.request
import urllib.error
from urllib.parse import quote as _url_quote

# stdout/stdin UTF-8 강제
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stdin, 'reconfigure'):
    try:
        sys.stdin.reconfigure(encoding='utf-8')
    except Exception:
        pass

# CPC 프록시 (Vercel 403 우회)
_CPC_PROXY = 'https://mychatbot.world/api/cpc-proxy'


def _cpc_url(api_path: str) -> str:
    return f'{_CPC_PROXY}?path={_url_quote(api_path, safe="")}'


def _http_get(api_path: str, timeout: int = 10) -> dict:
    url = _cpc_url(api_path)
    req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def _http_patch(api_path: str, body: dict, timeout: int = 10) -> dict:
    url = _cpc_url(api_path)
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        url, data=data, method='PATCH',
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


# ─── 도구 구현 ────────────────────────────────────────────────────────────────

def _tool_wait_cpc_command(platoon_id: str, timeout: int = 120) -> dict | None:
    """CPC에서 PENDING 명령 폴링 (최대 timeout초). 명령 있으면 ACK 후 반환."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            data = _http_get(f'/api/platoons/{platoon_id}/commands?status=PENDING')
            cmds = data if isinstance(data, list) else data.get('data', [])
            # CC 자신이 보낸 메시지(source=platoon_leader)는 제외
            cmds = [c for c in cmds if c.get('source') != 'platoon_leader']
            if cmds:
                cmd = cmds[0]
                cmd_id = cmd.get('id') or cmd.get('command_id', '')
                cmd_text = cmd.get('command') or cmd.get('text', '')
                # ACK
                try:
                    _http_patch(f'/api/commands/{cmd_id}/ack', {})
                except Exception:
                    pass
                return {
                    'cmd_id': cmd_id,
                    'text': cmd_text,
                    'platoon_id': platoon_id,
                }
        except Exception:
            pass
        time.sleep(2)
    return None


def _tool_report_cpc_result(cmd_id: str, result: str) -> dict:
    """CPC에 명령 처리 결과를 DONE으로 보고."""
    try:
        resp = _http_patch(f'/api/commands/{cmd_id}/done', {'result': result})
        return {'ok': True, 'response': resp}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


def _http_post(api_path: str, body: dict, timeout: int = 10) -> dict:
    url = _cpc_url(api_path)
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(
        url, data=data, method='POST',
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def _tool_send_cpc_message(platoon_id: str, text: str) -> dict:
    """CC에서 챗봇으로 메시지를 보낸다 (승인 요청, 알림 등)."""
    try:
        resp = _http_post(
            f'/api/platoons/{platoon_id}/commands',
            {'text': text, 'source': 'platoon_leader'},
        )
        return {'ok': True, 'response': resp}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


def _tool_request_cpc_approval(platoon_id: str, description: str) -> dict:
    """소대장이 챗봇에 승인 요청을 보낸다. 반환된 approval_id로 wait_cpc_approval 호출."""
    try:
        resp = _http_post(
            f'/api/platoons/{platoon_id}/commands',
            {'text': description, 'source': 'approval_request'},
        )
        approval_id = resp.get('id', '')
        return {'ok': True, 'approval_id': approval_id, 'response': resp}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


def _tool_wait_cpc_approval(platoon_id: str, approval_id: str, timeout: int = 120) -> dict:
    """챗봇 사용자의 승인/거부 응답을 대기한다. APPROVED 또는 DENIED 반환."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            data = _http_get(f'/api/platoons/{platoon_id}/commands')
            cmds = data if isinstance(data, list) else data.get('data', [])
            # approval_response 중 이 approval_id를 참조하는 응답 찾기
            for c in cmds:
                if (c.get('source') == 'approval_response'
                        and c.get('text', '').startswith(approval_id)):
                    # text 형식: "{approval_id}:APPROVED" 또는 "{approval_id}:DENIED:사유"
                    parts = c.get('text', '').split(':', 2)
                    decision = parts[1] if len(parts) > 1 else 'UNKNOWN'
                    reason = parts[2] if len(parts) > 2 else ''
                    # ACK 처리
                    try:
                        cmd_id = c.get('id', '')
                        _http_patch(f'/api/commands/{cmd_id}/ack', {})
                    except Exception:
                        pass
                    return {
                        'approved': decision == 'APPROVED',
                        'decision': decision,
                        'reason': reason,
                        'approval_id': approval_id,
                    }
        except Exception:
            pass
        time.sleep(2)
    return {'approved': False, 'decision': 'TIMEOUT', 'reason': '승인 대기 시간 초과', 'approval_id': approval_id}


# ─── MCP 프로토콜 ─────────────────────────────────────────────────────────────

TOOLS = [
    {
        'name': 'wait_cpc_command',
        'description': (
            'CPC(Claude Platoons Control)에서 PENDING 명령을 대기한다. '
            '명령이 오면 자동으로 ACK하고 반환. '
            'timeout(초) 내에 명령이 없으면 null 반환. '
            '반환값: {cmd_id, text, platoon_id} 또는 null. '
            '사용 패턴: 반환된 text를 처리한 후 report_cpc_result로 결과를 보고.'
        ),
        'inputSchema': {
            'type': 'object',
            'properties': {
                'platoon_id': {
                    'type': 'string',
                    'description': '소대 ID (예: mychatbot-1, mychatbot-2, ssalworks-1)',
                },
                'timeout': {
                    'type': 'integer',
                    'description': '대기 시간 (초). 기본값 60.',
                    'default': 120,
                },
            },
            'required': ['platoon_id'],
        },
    },
    {
        'name': 'send_cpc_message',
        'description': (
            'CC(소대장)에서 웹챗봇으로 메시지를 보낸다. '
            '승인 요청, 진행 상황 알림, 질문 등을 챗봇 화면에 표시. '
            '챗봇에서 응답하면 wait_cpc_command로 수신 가능.'
        ),
        'inputSchema': {
            'type': 'object',
            'properties': {
                'platoon_id': {
                    'type': 'string',
                    'description': '소대 ID (예: mychatbot-1)',
                },
                'text': {
                    'type': 'string',
                    'description': '챗봇에 표시할 메시지 (승인 요청, 알림 등)',
                },
            },
            'required': ['platoon_id', 'text'],
        },
    },
    {
        'name': 'request_cpc_approval',
        'description': (
            '소대장이 웹챗봇 사용자에게 승인을 요청한다. '
            '챗봇 화면에 description과 승인/거부 버튼이 표시된다. '
            '반환된 approval_id를 wait_cpc_approval에 전달하여 응답을 대기.'
        ),
        'inputSchema': {
            'type': 'object',
            'properties': {
                'platoon_id': {
                    'type': 'string',
                    'description': '소대 ID (예: mychatbot-1)',
                },
                'description': {
                    'type': 'string',
                    'description': '승인 요청 설명 (챗봇에 표시됨). 예: "pages/bot/chat.js 파일을 수정해도 될까요?"',
                },
            },
            'required': ['platoon_id', 'description'],
        },
    },
    {
        'name': 'wait_cpc_approval',
        'description': (
            'request_cpc_approval로 보낸 승인 요청의 응답을 대기한다. '
            '사용자가 승인/거부 버튼을 클릭하면 결과 반환. '
            '반환값: {approved: bool, decision: "APPROVED"|"DENIED"|"TIMEOUT", reason: str}'
        ),
        'inputSchema': {
            'type': 'object',
            'properties': {
                'platoon_id': {
                    'type': 'string',
                    'description': '소대 ID',
                },
                'approval_id': {
                    'type': 'string',
                    'description': 'request_cpc_approval에서 반환된 approval_id',
                },
                'timeout': {
                    'type': 'integer',
                    'description': '대기 시간 (초). 기본값 120.',
                    'default': 120,
                },
            },
            'required': ['platoon_id', 'approval_id'],
        },
    },
    {
        'name': 'report_cpc_result',
        'description': (
            'CPC에 명령 처리 결과를 DONE으로 보고한다. '
            '연락병 웹챗봇에 result 텍스트가 표시된다. '
            'wait_cpc_command로 받은 cmd_id와 처리 결과를 전달.'
        ),
        'inputSchema': {
            'type': 'object',
            'properties': {
                'cmd_id': {
                    'type': 'string',
                    'description': '명령 ID (wait_cpc_command에서 반환된 cmd_id)',
                },
                'result': {
                    'type': 'string',
                    'description': '처리 결과 텍스트 (연락병 웹챗봇에 표시됨)',
                },
            },
            'required': ['cmd_id', 'result'],
        },
    },
]


def _send(obj: dict):
    line = json.dumps(obj, ensure_ascii=False)
    sys.stdout.write(line + '\n')
    sys.stdout.flush()


def _handle(req: dict):
    method = req.get('method', '')
    req_id = req.get('id')
    params = req.get('params') or {}

    # Notification (id 없음) → 응답 불필요
    if req_id is None and method.startswith('notifications/'):
        return

    if method == 'initialize':
        _send({
            'jsonrpc': '2.0', 'id': req_id,
            'result': {
                'protocolVersion': '2024-11-05',
                'capabilities': {'tools': {}},
                'serverInfo': {'name': 'cpc-mcp', 'version': '1.0.0'},
            },
        })

    elif method == 'tools/list':
        _send({'jsonrpc': '2.0', 'id': req_id, 'result': {'tools': TOOLS}})

    elif method == 'tools/call':
        name = params.get('name', '')
        args = params.get('arguments') or {}
        try:
            if name == 'wait_cpc_command':
                result = _tool_wait_cpc_command(
                    platoon_id=args['platoon_id'],
                    timeout=int(args.get('timeout', 60)),
                )
                text = json.dumps(result, ensure_ascii=False)
                _send({
                    'jsonrpc': '2.0', 'id': req_id,
                    'result': {
                        'content': [{'type': 'text', 'text': text}],
                        'isError': False,
                    },
                })

            elif name == 'send_cpc_message':
                result = _tool_send_cpc_message(
                    platoon_id=args['platoon_id'],
                    text=args['text'],
                )
                text = json.dumps(result, ensure_ascii=False)
                _send({
                    'jsonrpc': '2.0', 'id': req_id,
                    'result': {
                        'content': [{'type': 'text', 'text': text}],
                        'isError': False,
                    },
                })

            elif name == 'request_cpc_approval':
                result = _tool_request_cpc_approval(
                    platoon_id=args['platoon_id'],
                    description=args['description'],
                )
                text = json.dumps(result, ensure_ascii=False)
                _send({
                    'jsonrpc': '2.0', 'id': req_id,
                    'result': {
                        'content': [{'type': 'text', 'text': text}],
                        'isError': False,
                    },
                })

            elif name == 'wait_cpc_approval':
                result = _tool_wait_cpc_approval(
                    platoon_id=args['platoon_id'],
                    approval_id=args['approval_id'],
                    timeout=int(args.get('timeout', 120)),
                )
                text = json.dumps(result, ensure_ascii=False)
                _send({
                    'jsonrpc': '2.0', 'id': req_id,
                    'result': {
                        'content': [{'type': 'text', 'text': text}],
                        'isError': False,
                    },
                })

            elif name == 'report_cpc_result':
                result = _tool_report_cpc_result(
                    cmd_id=args['cmd_id'],
                    result=args['result'],
                )
                text = json.dumps(result, ensure_ascii=False)
                _send({
                    'jsonrpc': '2.0', 'id': req_id,
                    'result': {
                        'content': [{'type': 'text', 'text': text}],
                        'isError': False,
                    },
                })

            else:
                _send({
                    'jsonrpc': '2.0', 'id': req_id,
                    'error': {'code': -32601, 'message': f'Unknown tool: {name}'},
                })

        except Exception as e:
            _send({
                'jsonrpc': '2.0', 'id': req_id,
                'result': {
                    'content': [{'type': 'text', 'text': f'오류: {e}'}],
                    'isError': True,
                },
            })

    elif req_id is not None:
        _send({
            'jsonrpc': '2.0', 'id': req_id,
            'error': {'code': -32601, 'message': f'Unknown method: {method}'},
        })


def main():
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
        _handle(req)


if __name__ == '__main__':
    main()
