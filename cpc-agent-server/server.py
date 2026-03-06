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
import subprocess as _subprocess
import sys
import tempfile
import time
import traceback

import httpx

from config import CPC_API_BASE, PROJECT_CWD

# 로깅 (콘솔 + 파일 — pythonw.exe 실행 시 콘솔 없으므로 파일 필수)
_LOG_FILE = os.path.join(tempfile.gettempdir(), 'cpc-agent-server.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s - %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(_LOG_FILE, encoding='utf-8'),
    ],
)
log = logging.getLogger('cpc-agent')

# 서버 시작 시 Claude Code 세션 환경변수 일괄 제거 (Agent SDK 중첩 세션 차단 해제)
for _k in [k for k in os.environ if k.startswith('CLAUDE_CODE') or k == 'CLAUDECODE']:
    os.environ.pop(_k, None)

# 처리 대상 소대 ID (mychatbot-1/2/3, mychatbot-trader 제외)
TARGET_PREFIXES = ('mychatbot-1', 'mychatbot-2', 'mychatbot-3')

# 처리 완료/진행 중인 명령 추적 (중복 처리 방지)
# DONE 이후에도 유지하여 다음 폴링에서 재처리 방지. 1시간 후 자동 정리.
_processing: dict[str, float] = {}  # cmd_id → timestamp
_processing_lock = asyncio.Lock()
_PROCESSING_TTL_SEC = 3600  # 1시간

# 리모트 컨트롤 프로세스 추적 (소대별 PID 관리 — zombie 방지)
_rc_procs: dict[str, _subprocess.Popen] = {}

# 공유 HTTP 클라이언트 (모듈 레벨 — start_polling 외부의 API 호출에서도 재사용)
_http: httpx.AsyncClient | None = None

# create_task() 참조 보관 (GC 방지 + 예외 로깅)
_background_tasks: set[asyncio.Task] = set()


async def get_http() -> httpx.AsyncClient:
    """공유 httpx.AsyncClient 반환 (lazy init)"""
    global _http
    if _http is None or _http.is_closed:
        _http = httpx.AsyncClient(timeout=10)
    return _http


async def _reset_http():
    """공유 HTTP 클라이언트를 닫고 재생성 대기 (다음 get_http()에서 lazy init)"""
    global _http
    if _http and not _http.is_closed:
        try:
            await _http.aclose()
        except Exception:
            pass
    _http = None


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

_APPDATA = os.environ.get('APPDATA') or os.path.join(os.path.expanduser('~'), 'AppData', 'Roaming')
_CLAUDE_CMD = os.path.join(_APPDATA, 'npm', 'claude.cmd')
_HEADLESS_TIMEOUT_SEC = 300  # 5분


def _clean_env() -> dict[str, str]:
    """Claude Code 세션 변수 + NODE_OPTIONS를 제거한 환경변수 딕셔너리 반환"""
    return {
        k: v for k, v in os.environ.items()
        if not k.startswith('CLAUDE_CODE') and k != 'CLAUDECODE'
        and k != 'NODE_OPTIONS'
    }


async def run_agent(prompt: str, platoon_id: str = 'mychatbot-1') -> str:
    """Claude Code headless 모드로 실행, 결과 텍스트 반환

    subprocess.Popen 사용 (SelectorEventLoop은 asyncio subprocess 미지원)
    """
    log.info(f'[CLI] headless 실행: {platoon_id}')
    system_prompt = build_dev_prompt(platoon_id)

    cmd = [
        _CLAUDE_CMD, '-p', prompt,
        '--output-format', 'text',
        '--dangerously-skip-permissions',
        '--max-budget-usd', '1.0',
        '--system-prompt', system_prompt,
        '--allowedTools', 'Read,Write,Edit,Bash,Glob,Grep',
    ]

    env = _clean_env()

    # stdout/stderr를 파일로 리다이렉트 (PIPE 버퍼 블로킹 방지)
    out_path = os.path.join(tempfile.gettempdir(), f'cpc-headless-{platoon_id}.txt')
    err_path = os.path.join(tempfile.gettempdir(), f'cpc-headless-{platoon_id}-err.txt')
    proc = None
    try:
        out_fd = os.open(out_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC)
        err_fd = os.open(err_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC)
        try:
            proc = _subprocess.Popen(
                cmd, stdout=out_fd, stderr=err_fd, env=env, cwd=PROJECT_CWD,
            )
        finally:
            os.close(out_fd)
            os.close(err_fd)

        # 비동기 대기: sleep 루프로 타임아웃 + 이벤트 루프 양보
        elapsed = 0
        while elapsed < _HEADLESS_TIMEOUT_SEC:
            if proc.poll() is not None:
                break
            await asyncio.sleep(1)
            elapsed += 1

        if proc.poll() is None:
            proc.kill()
            try:
                with open(out_path, 'r', encoding='utf-8', errors='replace') as f:
                    partial = f.read().strip()
                log.error(f'[CLI] 타임아웃 ({_HEADLESS_TIMEOUT_SEC}초), 부분 출력: {partial[:300]}')
            except Exception:
                log.error(f'[CLI] 타임아웃 ({_HEADLESS_TIMEOUT_SEC}초)')
            return f'실행 타임아웃 ({_HEADLESS_TIMEOUT_SEC}초 초과)'

        with open(out_path, 'r', encoding='utf-8', errors='replace') as f:
            result = f.read().strip()
        with open(err_path, 'r', encoding='utf-8', errors='replace') as f:
            stderr_text = f.read().strip()

        if stderr_text:
            log.debug(f'[CLI] stderr: {stderr_text[:300]}')

        if proc.returncode != 0:
            log.error(f'[CLI] exit code {proc.returncode}: {stderr_text[:200]}')
            return f'실행 오류 (exit {proc.returncode}): {result or stderr_text[:200]}'

        log.info(f'[CLI] 완료 — {len(result)}자')
        return result or '처리 완료 (결과 없음)'

    except Exception as e:
        log.error(f'[CLI] 에러: {e}')
        if proc and proc.poll() is None:
            proc.kill()
        return f'실행 오류: {e}'


# === 리모트 컨트롤 ===

REMOTE_KEYWORDS = re.compile(
    r'리모트|remote|원격|\brc\b|리모컨|remote.?control',
    re.IGNORECASE,
)

RC_URL_PATTERN = re.compile(r'https://claude\.ai/code[?/][A-Za-z0-9_?=&./-]+')
RC_URL_TIMEOUT_SEC = 30  # TUI 렌더링 지연 고려 → 30초
RC_OUT_DIR = tempfile.gettempdir()

# Windows: 부모 프로세스 종료 시에도 자식 생존
_CREATE_FLAGS = 0
if sys.platform == 'win32' or 'MSYS' in os.environ.get('MSYSTEM', ''):
    _CREATE_FLAGS = _subprocess.CREATE_NEW_PROCESS_GROUP


def _kill_rc_proc(platoon_id: str):
    """기존 리모트 컨트롤 프로세스를 정리 (zombie 방지)"""
    old = _rc_procs.pop(platoon_id, None)
    if old and old.poll() is None:
        try:
            old.kill()
            log.info(f'[RC] 기존 프로세스 종료 (PID: {old.pid})')
        except (ProcessLookupError, OSError):
            pass


async def start_remote_control(platoon_id: str) -> str:
    """claude remote-control 실행 → URL 캡처 → CPC 저장 → URL 반환

    핵심:
    - subprocess.Popen 사용 (SelectorEventLoop은 asyncio subprocess 미지원)
    - stdout을 파일로 리다이렉트 → 버퍼 막힘 방지 + URL 캡처
    - CREATE_NEW_PROCESS_GROUP → 부모 죽어도 remote-control 생존
    - 프로세스 죽으면 URL 무효화됨 → 프로세스 유지 필수
    """
    log.info(f'[RC] {platoon_id} 리모트 컨트롤 시작...')

    # 기존 프로세스 정리 (중복 호출 시 zombie 방지)
    _kill_rc_proc(platoon_id)

    cli_js = os.path.join(
        _APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js',
    )
    fix_js = os.path.join(os.path.expanduser('~'), 'fix-sdk-url.js')

    # 환경변수: 세션 변수 제거 + NODE_OPTIONS로 spawn 패치
    env = _clean_env()
    if os.path.exists(fix_js):
        env['NODE_OPTIONS'] = f'--require={fix_js}'

    # stdout을 파일로 리다이렉트 (PIPE 버퍼 막힘 방지)
    out_path = os.path.join(RC_OUT_DIR, f'rc-out-{platoon_id}.txt')

    try:
        out_fd = os.open(out_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC)
        try:
            proc = _subprocess.Popen(
                ['node', cli_js, 'remote-control'],
                stdout=out_fd,
                stderr=out_fd,
                env=env,
                creationflags=_CREATE_FLAGS,
            )
        finally:
            os.close(out_fd)  # 부모는 닫아도 자식은 fd 유지
        _rc_procs[platoon_id] = proc
        log.info(f'[RC] 프로세스 시작됨 (PID: {proc.pid})')

        # 파일 모니터링으로 URL 캡처 (최대 RC_URL_TIMEOUT_SEC초)
        for _ in range(RC_URL_TIMEOUT_SEC):
            await asyncio.sleep(1)
            try:
                with open(out_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                m = RC_URL_PATTERN.search(content)
                if m:
                    url = m.group(0)
                    log.info(f'[RC] URL 캡처: {url}')
                    await cpc_update_status(platoon_id, session_url=url)
                    log.info(f'[RC] CPC 저장 완료 — 프로세스 유지 (PID: {proc.pid})')
                    return f'리모트 컨트롤 URL: {url}'
            except Exception as e:
                log.debug(f'[RC] 출력 파일 읽기 실패 (재시도): {e}')

            # 프로세스가 죽었으면 출력 파일 내용 로그 후 중단
            if proc.poll() is not None:
                try:
                    with open(out_path, 'r', encoding='utf-8', errors='replace') as f:
                        output = f.read().strip()
                    log.error(f'[RC] 프로세스 종료 (code={proc.returncode}), 출력: {output[:500]}')
                except Exception:
                    log.error(f'[RC] 프로세스 종료 (code={proc.returncode}), 출력 읽기 실패')
                _rc_procs.pop(platoon_id, None)
                return f'리모트 컨트롤 실패 — 프로세스 종료 (code={proc.returncode})'

        log.error(f'[RC] URL 캡처 실패 ({RC_URL_TIMEOUT_SEC}초 타임아웃)')
        _kill_rc_proc(platoon_id)
        return f'리모트 컨트롤 URL 캡처 실패 — {RC_URL_TIMEOUT_SEC}초 타임아웃'

    except Exception as e:
        log.error(f'[RC] 에러: {e}\n{traceback.format_exc()}')
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

    # 중복 처리 방지 — Lock으로 원자적 체크+추가
    async with _processing_lock:
        now = time.monotonic()
        # 오래된 항목 정리 (1시간 이상)
        expired = [k for k, t in _processing.items() if now - t > _PROCESSING_TTL_SEC]
        for k in expired:
            del _processing[k]
        if cmd_id in _processing:
            return
        _processing[cmd_id] = now

    if not cmd_text:
        await cpc_done(cmd_id, '빈 명령입니다')
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
        try:
            await cpc_done(cmd_id, f'명령 처리 오류: {e}')
        except Exception:
            log.error(f'[CMD] DONE 보고도 실패: {cmd_id}')
        log.info(f'[DONE] {cmd_id}: 오류로 완료')


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
            log.warning(f'[Polling] {platoon_id}/{status} 비정상 응답: {type(commands).__name__}')
        elif r.status_code >= 400:
            log.warning(f'[Polling] {platoon_id}/{status} HTTP {r.status_code}')
    except Exception as e:
        log.warning(f'[Polling] {platoon_id}/{status} 에러: {e}')
    return []


async def start_polling():
    """HTTP 폴링 메인 루프 (1초 간격) — PENDING + ACKED 병렬 조회, 자동 복구"""
    log.info('[Polling] HTTP 폴링 시작 (1초 간격, PENDING+ACKED 병렬)')
    consecutive_errors = 0
    while True:
        try:
            client = await get_http()
            # 3소대 × 2상태 = 6개 요청을 병렬 실행
            fetch_coros = [
                _fetch_commands(client, pid, st)
                for pid in TARGET_PREFIXES
                for st in ('PENDING', 'ACKED')
            ]
            results = await asyncio.gather(*fetch_coros, return_exceptions=True)

            # 단일 폴링 사이클 내 중복 제거 (같은 명령이 PENDING+ACKED에 동시 존재할 수 있음)
            # cross-cycle 중복 방지는 handle_command 내 _processing이 담당
            seen_ids: set[str] = set()
            for result in results:
                if isinstance(result, list):
                    for cmd in result:
                        cid = cmd.get('id')
                        if cid and cid not in seen_ids:
                            seen_ids.add(cid)
                            task = asyncio.create_task(handle_command(cmd))
                            _background_tasks.add(task)
                            task.add_done_callback(_background_tasks.discard)

            consecutive_errors = 0
        except Exception as e:
            consecutive_errors += 1
            log.error(f'[Polling] 에러 (연속 {consecutive_errors}회): {e}')
            await _reset_http()
            # 연속 에러 시 대기 시간 증가 (최대 30초)
            await asyncio.sleep(min(consecutive_errors * 2, 30))
            continue

        await asyncio.sleep(1)


# === 메인 ===

async def main():
    log.info('=== CPC Agent Server 시작 (개발 PC) ===')
    log.info(f'대상 소대: {", ".join(TARGET_PREFIXES)}')
    log.info(f'프로젝트: {PROJECT_CWD}')

    # 소대 상태는 /cpc-engage 스킬이 관리한다.
    # server.py는 명령 수신/처리만 담당하고, 소대 상태를 일괄 변경하지 않는다.

    # HTTP 1초 폴링을 메인 루프로 사용 (Supabase Realtime은 race condition으로 비활성화)
    # 폴링 루프가 죽으면 자동 재시작
    while True:
        try:
            await start_polling()
        except Exception as e:
            log.error(f'[Main] 폴링 루프 크래시 — 3초 후 재시작: {e}')
            await asyncio.sleep(3)


if __name__ == '__main__':
    def shutdown(sig, frame):
        log.info('Agent Server 종료 중...')
        # RC 프로세스: CREATE_NEW_PROCESS_GROUP으로 독립 실행 중 → kill 안 함 (URL 유효 유지)
        # HTTP 클라이언트: signal handler에서 async 정리 불가 → OS가 프로세스 종료 시 소켓 정리
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    try:
        signal.signal(signal.SIGTERM, shutdown)
    except (OSError, ValueError):
        pass  # Windows/MSYS2에서 SIGTERM 지원 안 될 수 있음

    # Windows 이벤트 루프 정책 설정 (ProactorEventLoop 대신 SelectorEventLoop)
    if sys.platform == 'win32' or 'MSYS' in os.environ.get('MSYSTEM', ''):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    asyncio.run(main())
