#!/usr/bin/env python3
"""
PreToolUse Hook: 위험한 Bash 명령 감지 → CPC 챗봇 승인 요청

동작 흐름:
1. stdin으로 tool_input JSON 수신
2. Bash 명령이 위험 패턴에 해당하는지 검사
3. 위험하면 → CPC API로 승인 요청 → 폴링 대기 → 승인/거부 반환
4. 안전하면 → 즉시 allow

설치: .claude/settings.local.json → hooks.PreToolUse
"""

import sys
import json
import time
import os
import urllib.request
import urllib.error

# ─── 설정 ───────────────────────────────────────────
CPC_URL = "https://claude-platoons-control.vercel.app"
APPROVAL_TIMEOUT = 120  # 초
POLL_INTERVAL = 3       # 초

# 위험 명령 패턴 (부분 일치)
DANGEROUS_PATTERNS = [
    # Git 위험 명령
    "git push",
    "git reset --hard",
    "git checkout -- .",
    "git clean -f",
    "git branch -D",
    "git rebase",
    "git force",
    "--force",
    # 파일/폴더 삭제 (모든 rm 명령)
    "rm ",
    "rm\t",
    "rmdir",
    "del ",
    "del\t",
    "rd ",
    "rd\t",
    "Remove-Item",
    "unlink ",
    "shred ",
    # 배포
    "npx vercel --prod",
    "npx vercel deploy",
    "vercel --prod",
    # DB 위험 명령
    "DROP TABLE",
    "DROP DATABASE",
    "DELETE FROM",
    "TRUNCATE",
    "ALTER TABLE",
    # 시스템 위험
    "taskkill",
    "shutdown",
    "format ",
    "mkfs",
    "dd if=",
    # npm 위험
    "npm uninstall",
    "npm remove",
]

# ─── 유틸 ───────────────────────────────────────────

def _allow():
    """즉시 허용"""
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow"
        }
    }))
    sys.exit(0)


def _deny(reason: str):
    """거부"""
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason
        }
    }))
    sys.exit(0)


def _http_post(path: str, body: dict) -> dict:
    url = f"{CPC_URL}{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def _http_get(path: str) -> list:
    url = f"{CPC_URL}{path}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def _get_platoon_id() -> str:
    """현재 프로젝트의 소대 ID를 결정"""
    # 1) 환경변수에서 (cpc-engage가 설정할 수 있음)
    pid = os.environ.get("CPC_PLATOON_ID", "")
    if pid:
        return pid

    # 2) 상태 파일에서
    state_file = os.path.join(".claude", ".cpc-platoon-id")
    if os.path.exists(state_file):
        with open(state_file) as f:
            pid = f.read().strip()
            if pid:
                return pid

    # 3) 디렉토리 이름으로 추정
    cwd = os.path.basename(os.getcwd())
    mapping = {
        "mychatbot-world": "mychatbot-1",
        "!SSAL_Works_Private": "ssalworks-1",
        "AI_Study_Circle": "studycircle-1",
        "Development_PoliticianFinder_com": "politician-1",
        "ValueLink": "valuelink-1",
        "trader-bot": "trader-bot",
    }
    for dirname, default_id in mapping.items():
        if dirname.lower() in cwd.lower():
            return default_id

    return "mychatbot-1"  # 폴백


def _is_dangerous(command: str) -> bool:
    """명령이 위험 패턴에 해당하는지 검사"""
    cmd_lower = command.lower()
    for pattern in DANGEROUS_PATTERNS:
        if pattern.lower() in cmd_lower:
            return True
    return False


# ─── 메인 ───────────────────────────────────────────

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        _allow()  # stdin 파싱 실패 → 허용 (안전 폴백)

    tool_name = input_data.get("tool_name", "")

    # Bash만 검사
    if tool_name != "Bash":
        _allow()

    command = input_data.get("tool_input", {}).get("command", "")

    if not _is_dangerous(command):
        _allow()

    # ─── 위험 명령 감지: CPC 승인 요청 ───
    platoon_id = _get_platoon_id()

    # 명령 요약 (최대 200자)
    cmd_summary = command[:200] + ("..." if len(command) > 200 else "")
    description = f"⚠️ 위험 명령 승인 요청\n\n```\n{cmd_summary}\n```\n\n이 명령을 실행할까요?"

    try:
        # 승인 요청 생성
        resp = _http_post(
            f"/api/platoons/{platoon_id}/commands",
            {"text": description, "source": "approval_request"}
        )
        approval_id = resp.get("id", "")
        if not approval_id:
            _allow()  # API 실패 → 허용 (오프라인 폴백)

        # 승인 대기 (폴링)
        deadline = time.time() + APPROVAL_TIMEOUT
        while time.time() < deadline:
            time.sleep(POLL_INTERVAL)
            try:
                commands = _http_get(f"/api/platoons/{platoon_id}/commands?status=DONE")
                for cmd in commands:
                    if cmd.get("id") == approval_id:
                        result_text = (cmd.get("result") or "").upper()
                        if "DENIED" in result_text or "거부" in result_text:
                            _deny(f"챗봇에서 거부됨: {cmd.get('result', '')}")
                        else:
                            _allow()  # APPROVED
            except Exception:
                pass  # 네트워크 오류 → 계속 폴링

        # 타임아웃 → 거부 (안전 우선)
        _deny(f"승인 대기 {APPROVAL_TIMEOUT}초 타임아웃 — 안전을 위해 차단됨")

    except Exception as e:
        # CPC API 자체 실패 → 허용 (오프라인 모드)
        _allow()


if __name__ == "__main__":
    main()
