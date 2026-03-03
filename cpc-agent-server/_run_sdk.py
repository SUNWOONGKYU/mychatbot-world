#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Agent SDK 실행기 — 독립 프로세스에서 실행
server.py가 subprocess로 호출한다.

사용법: python _run_sdk.py <platoon_id> <prompt>
결과: stdout에 JSON {"result": "...", "cost": 0.0, "turns": 0, "duration_ms": 0}
"""
import asyncio
import json
import os
import sys


# 환경변수 정리 (중첩 세션 차단 해제)
for k in list(os.environ):
    if k.startswith('CLAUDE_CODE') or k == 'CLAUDECODE':
        del os.environ[k]
os.environ.pop('NODE_OPTIONS', None)


def _clean_env() -> dict[str, str]:
    return {
        k: v for k, v in os.environ.items()
        if not k.startswith('CLAUDE_CODE') and k != 'CLAUDECODE'
        and k != 'NODE_OPTIONS'
    }


DEV_PROMPT_TEMPLATE = """\
너는 My Chatbot World 프로젝트의 {platoon_id} 소대장이다.
소대 키: {platoon_id}
역할: {squad_num}소대장 (Agent SDK)
대표님의 개발 명령을 실행한다: 코드 읽기, 수정, 검색, 분석, 배포.
결과는 마크다운 없이 순수 텍스트로 보고한다.
"""


async def run(platoon_id: str, prompt: str):
    from claude_agent_sdk import (
        query, ClaudeAgentOptions,
        AssistantMessage, ResultMessage, TextBlock,
    )

    squad_num = platoon_id.split('-')[-1] if '-' in platoon_id else '1'
    system_prompt = DEV_PROMPT_TEMPLATE.format(
        platoon_id=platoon_id, squad_num=squad_num,
    )

    cli_path = os.path.join(
        os.environ.get('APPDATA', ''), 'npm', 'claude.cmd',
    )
    cwd = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    options = ClaudeAgentOptions(
        cli_path=cli_path,
        cwd=cwd,
        system_prompt=system_prompt,
        setting_sources=['project'],
        allowed_tools=['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        permission_mode='bypassPermissions',
        max_budget_usd=1.0,
        env=_clean_env(),
    )

    result_text = ''
    cost = 0.0
    turns = 0
    duration_ms = 0

    try:
        async for message in query(prompt=prompt, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        result_text = block.text
            elif isinstance(message, ResultMessage):
                cost = message.total_cost_usd
                turns = message.num_turns
                duration_ms = message.duration_ms
    except Exception as e:
        result_text = f'Agent SDK 오류: {e}'

    return {
        'result': result_text or '처리 완료 (결과 없음)',
        'cost': cost,
        'turns': turns,
        'duration_ms': duration_ms,
    }


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({'result': '사용법: python _run_sdk.py <platoon_id> <prompt>'}))
        sys.exit(1)

    platoon_id = sys.argv[1]
    prompt = sys.argv[2]

    output = asyncio.run(run(platoon_id, prompt))
    print(json.dumps(output, ensure_ascii=False))
