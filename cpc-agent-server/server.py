#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CPC Agent Server — 개발 PC용 (mychatbot-world)
CPC 명령 수신 → Agent SDK(Claude Code) 자동 실행 → CPC DONE 반환

mychatbot-1, mychatbot-2, mychatbot-3 소대 명령을 처리한다.
(mychatbot-trader는 trader-bot/agent_server.py가 처리)

실행: python server.py
"""
import asyncio
import logging
import os
import re
import signal
import sys

import httpx

from config import CPC_API_BASE, SUPABASE_URL, SUPABASE_KEY, PROJECT_CWD

# 로깅
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger('cpc-agent')

# 처리 대상 소대 ID (mychatbot-1/2/3, mychatbot-trader 제외)
TARGET_PREFIXES = ('mychatbot-1', 'mychatbot-2', 'mychatbot-3')

DEV_PROMPT_TEMPLATE = """\
너는 My Chatbot World 프로젝트의 {platoon_id} 소대장이다.
소대 키: {platoon_id}
역할: {squad_num}소대장 (Agent SDK)
대표님의 개발 명령을 실행한다: 코드 읽기, 수정, 검색, 분석, 배포.
결과는 마크다운 없이 순수 텍스트로 보고한다.
"""


def build_dev_prompt(platoon_id: str) -> str:
    """소대 ID에 맞는 시스템 프롬프트 생성"""
    squad_num = platoon_id.split('-')[-1] if '-' in platoon_id else '1'
    return DEV_PROMPT_TEMPLATE.format(platoon_id=platoon_id, squad_num=squad_num)


# === CPC API (async) ===

async def cpc_ack(cmd_id: str):
    """명령 수신 확인 (PENDING → ACKED)"""
    async with httpx.AsyncClient() as client:
        try:
            r = await client.patch(
                f'{CPC_API_BASE}/api/commands/{cmd_id}/ack',
                timeout=10,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.warning(f'[CPC] ACK 실패: {e}')
            return None


async def cpc_done(cmd_id: str, result_text: str):
    """명령 완료 (ACKED → DONE)"""
    async with httpx.AsyncClient() as client:
        try:
            r = await client.patch(
                f'{CPC_API_BASE}/api/commands/{cmd_id}/done',
                json={'result': result_text},
                timeout=10,
            )
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.warning(f'[CPC] DONE 실패: {e}')
            return None


async def cpc_update_status(platoon_id: str, status: str, purpose: str = None):
    """소대 상태 업데이트"""
    body = {'status': status}
    if purpose:
        body['purpose'] = purpose
    async with httpx.AsyncClient() as client:
        try:
            r = await client.patch(
                f'{CPC_API_BASE}/api/platoons/{platoon_id}/status',
                json=body,
                timeout=10,
            )
            r.raise_for_status()
        except Exception as e:
            log.warning(f'[CPC] 상태 업데이트 실패: {e}')


# === Agent SDK 실행 ===

async def run_agent(prompt: str, platoon_id: str = 'mychatbot-1') -> str:
    """Agent SDK로 Claude Code 실행, 최종 텍스트 결과 반환"""
    from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage, TextBlock

    options = ClaudeAgentOptions(
        cwd=PROJECT_CWD,
        system_prompt=build_dev_prompt(platoon_id),
        setting_sources=['project'],  # CLAUDE.md 로드
        allowed_tools=['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        permission_mode='bypassPermissions',
        max_budget_usd=1.0,
    )

    result_text = ''
    try:
        async for message in query(prompt=prompt, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        result_text = block.text
            elif isinstance(message, ResultMessage):
                log.info(
                    f'[SDK] 완료 — ${message.total_cost_usd:.4f}, '
                    f'{message.num_turns}턴, {message.duration_ms}ms'
                )
    except Exception as e:
        log.error(f'[SDK] 에러: {e}')
        result_text = f'Agent SDK 오류: {e}'

    return result_text or '처리 완료 (결과 없음)'


# === 리모트 컨트롤 ===

REMOTE_KEYWORDS = re.compile(
    r'리모트|remote|원격|rc\b|리모컨|remote.?control',
    re.IGNORECASE,
)


async def start_remote_control(platoon_id: str) -> str:
    """cmd.exe로 독립 프로세스 실행 → URL 캡처 → CPC 저장 → URL 반환

    bash에서 실행하면 --sdk-url 버그로 죽지만,
    cmd.exe /c로 독립 프로세스로 띄우면 살아남는다.
    URL 캡처를 위해 stdout을 임시 파일로 리다이렉트한다.
    """
    import tempfile

    log.info(f'[RC] {platoon_id} 리모트 컨트롤 시작 (cmd.exe 독립 프로세스)...')

    # 임시 파일로 stdout 캡처
    tmp = os.path.join(tempfile.gettempdir(), f'rc-{platoon_id}.log')

    try:
        # cmd.exe로 독립 프로세스 실행 (stdout → 임시 파일)
        proc = await asyncio.create_subprocess_exec(
            'cmd.exe', '/c',
            f'C:\\Users\\home\\AppData\\Roaming\\npm\\claude.cmd remote-control > {tmp} 2>&1',
            creationflags=0x00000008,  # DETACHED_PROCESS
        )
        log.info(f'[RC] 프로세스 시작됨 (PID: {proc.pid})')

        # 임시 파일에서 URL 캡처 (최대 15초)
        url_pattern = re.compile(r'https://claude\.ai/code/[A-Za-z0-9_?=&-]+')
        for _ in range(15):
            await asyncio.sleep(1)
            try:
                with open(tmp, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                m = url_pattern.search(content)
                if m:
                    url = m.group(0)
                    log.info(f'[RC] URL 캡처: {url}')
                    # CPC에 저장
                    async with httpx.AsyncClient() as client:
                        await client.patch(
                            f'{CPC_API_BASE}/api/platoons/{platoon_id}/status',
                            json={'session_url': url},
                            timeout=10,
                        )
                    log.info(f'[RC] CPC 저장 완료')
                    return f'리모트 접속 URL: {url}'
            except FileNotFoundError:
                continue

        log.error(f'[RC] URL 캡처 실패 (15초 타임아웃)')
        return '리모트 컨트롤 URL 캡처 실패 — 15초 타임아웃'

    except Exception as e:
        log.error(f'[RC] 에러: {e}')
        return f'리모트 컨트롤 실패: {e}'


# === 명령 처리 ===

async def handle_command(cmd: dict):
    """CPC 명령 수신 → ACK → Agent SDK 실행 → DONE"""
    cmd_id = cmd.get('id')
    cmd_text = cmd.get('text', '').strip()
    platoon_id = cmd.get('platoon_name', '') or cmd.get('platoon_id', '')

    # mychatbot-1/2/3만 처리 (mychatbot-trader 제외)
    if not any(platoon_id == t for t in TARGET_PREFIXES):
        return
    if cmd.get('status') != 'PENDING':
        return
    if not cmd_text:
        await cpc_done(cmd_id, '빈 명령입니다')
        return

    log.info(f'[CMD] [{platoon_id}] {cmd_id}: {cmd_text[:60]}')

    # ACK
    await cpc_ack(cmd_id)
    log.info(f'[ACK] {cmd_id}')

    # 리모트 컨트롤 명령 감지 → cmd.exe로 독립 프로세스 실행
    if REMOTE_KEYWORDS.search(cmd_text):
        result = await start_remote_control(platoon_id)
    else:
        # 일반 명령 → Agent SDK 실행
        result = await run_agent(cmd_text, platoon_id)

    # DONE
    await cpc_done(cmd_id, result)
    log.info(f'[DONE] {cmd_id}: {result[:80]}')


# === Supabase Realtime 리스너 ===

async def start_realtime() -> bool:
    """Supabase Realtime으로 cpc_commands INSERT 감지"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.warning('[Realtime] SUPABASE_URL/KEY 미설정')
        return False

    try:
        from supabase import acreate_client

        supabase = await acreate_client(SUPABASE_URL, SUPABASE_KEY)

        def on_insert(payload):
            new = (
                payload.get('new')
                or payload.get('data', {}).get('record', {})
                or payload.get('record', {})
            )
            if new:
                platoon_id = new.get('platoon_name', '') or new.get('platoon_id', '')
                if any(platoon_id == t for t in TARGET_PREFIXES):
                    asyncio.create_task(handle_command(new))

        channel = supabase.realtime.channel('cpc-dev')
        channel.on_postgres_changes(
            event='INSERT',
            schema='public',
            table='cpc_commands',
            callback=on_insert,
        )
        await channel.subscribe()
        log.info('[Realtime] Supabase Realtime 연결 성공')
        return True

    except Exception as e:
        log.warning(f'[Realtime] 연결 실패: {e}')
        return False


async def start_polling():
    """Supabase Realtime 실패 시 HTTP 폴링 폴백 (1초 간격)"""
    log.info('[Polling] HTTP 폴링 시작 (1초 간격)')
    async with httpx.AsyncClient() as client:
        while True:
            for platoon_id in TARGET_PREFIXES:
                try:
                    r = await client.get(
                        f'{CPC_API_BASE}/api/platoons/{platoon_id}/commands?status=PENDING',
                        timeout=10,
                    )
                    if r.status_code == 200:
                        commands = r.json()
                        if isinstance(commands, list):
                            for cmd in commands:
                                await handle_command(cmd)
                except Exception as e:
                    log.warning(f'[Polling] {platoon_id} 에러: {e}')
            await asyncio.sleep(1)


# === 메인 ===

async def main():
    log.info('=== CPC Agent Server 시작 (개발 PC) ===')
    log.info(f'대상 소대: {", ".join(TARGET_PREFIXES)}')
    log.info(f'프로젝트: {PROJECT_CWD}')

    # 소대 상태는 /cpc-engage 스킬이 관리한다.
    # server.py는 명령 수신/처리만 담당하고, 소대 상태를 일괄 변경하지 않는다.

    # Supabase Realtime 시도 (비동기 — 성공해도 실패해도 무관)
    await start_realtime()

    # 항상 HTTP 폴링을 메인 루프로 사용 (Realtime은 보조)
    await start_polling()


if __name__ == '__main__':
    def shutdown(sig, frame):
        log.info('Agent Server 종료 중...')
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    asyncio.run(main())
