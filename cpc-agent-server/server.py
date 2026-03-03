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

# 서버 시작 시 Claude Code 세션 환경변수 일괄 제거 (Agent SDK 중첩 세션 차단 해제)
for _k in [k for k in os.environ if k.startswith('CLAUDE_CODE') or k == 'CLAUDECODE']:
    os.environ.pop(_k, None)

# 처리 대상 소대 ID (mychatbot-1/2/3, mychatbot-trader 제외)
TARGET_PREFIXES = ('mychatbot-1', 'mychatbot-2', 'mychatbot-3')

# 처리 중인 명령 추적 (중복 처리 방지)
_processing: set[str] = set()

# 리모트 컨트롤 프로세스 추적 (소대별 PID 관리 — zombie 방지)
_rc_procs: dict[str, asyncio.subprocess.Process] = {}

# 공유 HTTP 클라이언트 (모듈 레벨 — start_polling 외부의 API 호출에서도 재사용)
_http: httpx.AsyncClient | None = None


async def get_http() -> httpx.AsyncClient:
    """공유 httpx.AsyncClient 반환 (lazy init)"""
    global _http
    if _http is None or _http.is_closed:
        _http = httpx.AsyncClient(timeout=10)
    return _http


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


# === CPC API (async, 공유 클라이언트) ===

async def cpc_ack(cmd_id: str):
    """명령 수신 확인 (PENDING → ACKED)"""
    client = await get_http()
    try:
        r = await client.patch(f'{CPC_API_BASE}/api/commands/{cmd_id}/ack')
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log.warning(f'[CPC] ACK 실패: {e}')
        return None


async def cpc_done(cmd_id: str, result_text: str):
    """명령 완료 (ACKED → DONE)"""
    client = await get_http()
    try:
        r = await client.patch(
            f'{CPC_API_BASE}/api/commands/{cmd_id}/done',
            json={'result': result_text},
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        log.warning(f'[CPC] DONE 실패: {e}')
        return None


async def cpc_update_status(platoon_id: str, **fields):
    """소대 상태/필드 업데이트 (status, purpose, session_url 등)"""
    client = await get_http()
    try:
        r = await client.patch(
            f'{CPC_API_BASE}/api/platoons/{platoon_id}/status',
            json=fields,
        )
        r.raise_for_status()
    except Exception as e:
        log.warning(f'[CPC] 상태 업데이트 실패: {e}')


# === Claude Code Headless 실행 ===
#
# Agent SDK는 Windows(MSYS2)에서 "Control request timeout: initialize" 발생.
# 해결: `claude -p` (headless/print 모드)로 직접 CLI 호출하여 SDK 우회.

_CLAUDE_CMD = os.path.join(
    os.environ.get('APPDATA', 'C:/Users/home/AppData/Roaming'),
    'npm', 'claude.cmd',
)
_HEADLESS_TIMEOUT_SEC = 300  # 5분


async def run_agent(prompt: str, platoon_id: str = 'mychatbot-1') -> str:
    """Claude Code headless 모드로 실행, 결과 텍스트 반환"""
    log.info(f'[CLI] headless 실행: {platoon_id}')

    squad_num = platoon_id.split('-')[-1] if '-' in platoon_id else '1'
    system_prompt = build_dev_prompt(platoon_id)

    cmd = [
        _CLAUDE_CMD, '-p', prompt,
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--max-budget-usd', '1.0',
        '--system-prompt', system_prompt,
        '--allowedTools', 'Read,Write,Edit,Bash,Glob,Grep',
    ]

    # 환경변수 정리 (중첩 세션 차단 해제)
    env = {
        k: v for k, v in os.environ.items()
        if not k.startswith('CLAUDE_CODE') and k != 'CLAUDECODE'
        and k != 'NODE_OPTIONS'
    }

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
            cwd=PROJECT_CWD,
        )

        stdout, stderr = await asyncio.wait_for(
            proc.communicate(), timeout=_HEADLESS_TIMEOUT_SEC,
        )

        result = stdout.decode('utf-8', errors='replace').strip()
        stderr_text = stderr.decode('utf-8', errors='replace').strip()

        if stderr_text:
            log.debug(f'[CLI] stderr: {stderr_text[:300]}')

        if proc.returncode != 0:
            log.error(f'[CLI] exit code {proc.returncode}: {stderr_text[:200]}')
            return f'실행 오류 (exit {proc.returncode}): {result or stderr_text[:200]}'

        log.info(f'[CLI] 완료 — {len(result)}자')
        return result or '처리 완료 (결과 없음)'

    except asyncio.TimeoutError:
        log.error(f'[CLI] 타임아웃 ({_HEADLESS_TIMEOUT_SEC}초)')
        if proc and proc.returncode is None:
            proc.kill()
        return f'실행 타임아웃 ({_HEADLESS_TIMEOUT_SEC}초 초과)'
    except Exception as e:
        log.error(f'[CLI] 에러: {e}')
        return f'실행 오류: {e}'


# === 리모트 컨트롤 ===

REMOTE_KEYWORDS = re.compile(
    r'리모트|remote|원격|rc\b|리모컨|remote.?control',
    re.IGNORECASE,
)

RC_URL_PATTERN = re.compile(r'https://claude\.ai/code[?/][A-Za-z0-9_?=&./-]+')
RC_URL_TIMEOUT_SEC = 20


def _kill_rc_proc(platoon_id: str):
    """기존 리모트 컨트롤 프로세스를 정리 (zombie 방지)"""
    old = _rc_procs.pop(platoon_id, None)
    if old and old.returncode is None:
        try:
            old.kill()
            log.info(f'[RC] 기존 프로세스 종료 (PID: {old.pid})')
        except ProcessLookupError:
            pass


async def start_remote_control(platoon_id: str) -> str:
    """claude remote-control 실행 → URL 캡처 → CPC 저장 → URL 반환

    NODE_OPTIONS=--require=fix-sdk-url.js 로 child_process.spawn 패치하여
    Windows에서 --sdk-url 버그(node.exe가 --print를 자체 플래그로 해석) 우회.
    CLAUDECODE 환경변수 제거하여 중첩 세션 차단 해제.
    """
    log.info(f'[RC] {platoon_id} 리모트 컨트롤 시작...')

    # 기존 프로세스 정리 (중복 호출 시 zombie 방지)
    _kill_rc_proc(platoon_id)

    cli_js = os.path.join(
        os.environ.get('APPDATA', ''),
        'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js',
    )
    fix_js = os.path.join(os.path.expanduser('~'), 'fix-sdk-url.js')

    # 환경변수: Claude Code 세션 변수 제거 + NODE_OPTIONS로 spawn 패치
    env = {
        k: v for k, v in os.environ.items()
        if not k.startswith('CLAUDE_CODE') and k != 'CLAUDECODE'
        and k != 'NODE_OPTIONS'
    }
    if os.path.exists(fix_js):
        env['NODE_OPTIONS'] = f'--require={fix_js}'

    try:
        proc = await asyncio.create_subprocess_exec(
            'node', cli_js, 'remote-control',
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
        _rc_procs[platoon_id] = proc
        log.info(f'[RC] 프로세스 시작됨 (PID: {proc.pid})')

        # stdout에서 URL 캡처 (최대 RC_URL_TIMEOUT_SEC초)
        collected = ''
        for _ in range(RC_URL_TIMEOUT_SEC):
            await asyncio.sleep(1)
            # stdout에서 읽기 (non-blocking)
            try:
                chunk = await asyncio.wait_for(
                    proc.stdout.read(4096), timeout=0.5,
                )
                if chunk:
                    collected += chunk.decode('utf-8', errors='replace')
            except asyncio.TimeoutError:
                pass

            m = RC_URL_PATTERN.search(collected)
            if m:
                url = m.group(0)
                log.info(f'[RC] URL 캡처: {url}')
                await cpc_update_status(platoon_id, session_url=url)
                log.info(f'[RC] CPC 저장 완료 — 프로세스 유지 (PID: {proc.pid})')
                # 프로세스를 백그라운드로 유지 (kill하지 않음)
                return f'리모트 접속 URL: {url}'

            # 프로세스가 죽었으면 중단
            if proc.returncode is not None:
                stderr = await proc.stderr.read()
                log.error(f'[RC] 프로세스 종료 (code={proc.returncode})')
                log.error(f'[RC] stderr: {stderr.decode("utf-8", errors="replace")[:500]}')
                _rc_procs.pop(platoon_id, None)
                return f'리모트 컨트롤 실패 — 프로세스 종료 (code={proc.returncode})'

        log.error(f'[RC] URL 캡처 실패 ({RC_URL_TIMEOUT_SEC}초 타임아웃)')
        _kill_rc_proc(platoon_id)
        return f'리모트 컨트롤 URL 캡처 실패 — {RC_URL_TIMEOUT_SEC}초 타임아웃'

    except Exception as e:
        log.error(f'[RC] 에러: {e}')
        _kill_rc_proc(platoon_id)
        return f'리모트 컨트롤 실패: {e}'


# === 명령 처리 ===

async def handle_command(cmd: dict):
    """CPC 명령 수신 → ACK → 처리 → DONE"""
    cmd_id = cmd.get('id')
    cmd_text = cmd.get('text', '').strip()
    platoon_id = cmd.get('platoon_name', '') or cmd.get('platoon_id', '')
    status = cmd.get('status', '')

    # mychatbot-1/2/3만 처리 (mychatbot-trader 제외)
    if platoon_id not in TARGET_PREFIXES:
        return
    # PENDING 또는 ACKED만 처리 (ACKED = 이전 서버가 ACK 후 크래시한 경우 복구)
    if status not in ('PENDING', 'ACKED'):
        return

    # 중복 처리 방지 (Realtime + 폴링 동시 잡기 방어)
    if cmd_id in _processing:
        return
    _processing.add(cmd_id)

    if not cmd_text:
        await cpc_done(cmd_id, '빈 명령입니다')
        _processing.discard(cmd_id)
        return

    log.info(f'[CMD] [{platoon_id}] {cmd_id} ({status}): {cmd_text[:60]}')

    try:
        # PENDING이면 ACK, ACKED면 이미 ACK된 상태이므로 건너뜀
        if status == 'PENDING':
            await cpc_ack(cmd_id)
            log.info(f'[ACK] {cmd_id}')
        else:
            log.info(f'[RECOVER] {cmd_id} — ACKED 상태 복구 처리')

        # 리모트 컨트롤 명령 감지
        is_remote = REMOTE_KEYWORDS.search(cmd_text)
        log.info(f'[CMD] 리모트 매칭: {bool(is_remote)} (text={cmd_text[:30]})')

        if is_remote:
            result = await start_remote_control(platoon_id)
        else:
            # 일반 명령 → Agent SDK 실행
            result = await run_agent(cmd_text, platoon_id)

        # DONE
        await cpc_done(cmd_id, result)
        log.info(f'[DONE] {cmd_id}: {result[:80]}')

    except Exception as e:
        log.error(f'[CMD] 처리 실패: {cmd_id}: {e}')
        await cpc_done(cmd_id, f'명령 처리 오류: {e}')
        log.info(f'[DONE] {cmd_id}: 오류로 완료')
    finally:
        _processing.discard(cmd_id)


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
                if platoon_id in TARGET_PREFIXES:
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


async def _fetch_commands(client: httpx.AsyncClient, platoon_id: str, status: str):
    """단일 소대/상태 명령 조회 (병렬 호출용)"""
    try:
        r = await client.get(
            f'{CPC_API_BASE}/api/platoons/{platoon_id}/commands?status={status}',
        )
        if r.status_code == 200:
            commands = r.json()
            if isinstance(commands, list):
                return commands
    except Exception as e:
        log.warning(f'[Polling] {platoon_id}/{status} 에러: {e}')
    return []


async def start_polling():
    """HTTP 폴링 메인 루프 (1초 간격) — PENDING + ACKED 병렬 조회"""
    log.info('[Polling] HTTP 폴링 시작 (1초 간격, PENDING+ACKED 병렬)')
    client = await get_http()
    while True:
        # 3소대 × 2상태 = 6개 요청을 병렬 실행
        tasks = [
            _fetch_commands(client, pid, st)
            for pid in TARGET_PREFIXES
            for st in ('PENDING', 'ACKED')
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                for cmd in result:
                    await handle_command(cmd)

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
        # 리모트 컨트롤 프로세스 정리
        for pid in list(_rc_procs):
            _kill_rc_proc(pid)
        # 공유 HTTP 클라이언트 정리
        if _http and not _http.is_closed:
            try:
                asyncio.get_event_loop().run_until_complete(_http.aclose())
            except Exception:
                pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    asyncio.run(main())
