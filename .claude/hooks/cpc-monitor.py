#!/usr/bin/env python3
"""
CPC Real-time Monitor v6
새 명령 감지 → AI 자동처리 + Claude Code 소대장에게 직접 주입
"""
import asyncio, json, os, sys, time, subprocess, threading, urllib.request, datetime
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

CPC_SUPABASE_URL = "https://hlpovizxnrnspobddxmq.supabase.co"
CPC_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscG92aXp4bnJuc3BvYmRkeG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzQ2MTQsImV4cCI6MjA4Njc1MDYxNH0.rOYmy0OlD5tI-Jlt_sD0PpSdjvkjfAQScvVELAKPiMI"
CPC_API = "https://claude-platoons-control.vercel.app"
PLATOONS = ["mychatbot-1"]  # 이 세션(1소대장)은 mychatbot-1만 처리
POLL_INTERVAL = 3
PROJECT_DIR = r"G:\내 드라이브\mychatbot-world"

# Claude Code 창 주입 설정
INJECT_TO_CLAUDE = True   # False로 바꾸면 주입 비활성화
CLAUDE_WINDOW_KEYWORD = "Claude"


def windows_popup(title, msg):
    try:
        safe_msg = msg[:150].replace('"', "'").replace("'", "`").replace('\n', ' ')
        safe_title = title.replace('"', "'").replace("'", "`")
        cmd = (
            f'mshta "javascript:var sh=new ActiveXObject(\'WScript.Shell\');'
            f'sh.Popup(\'{safe_msg}\',8,\'{safe_title}\',48);close()"'
        )
        subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass


CLAUDE_CODE_PID_FILE = r"C:\Users\wksun\claude_code_pid.txt"
CPC_TARGET_FILE = r"C:\Users\wksun\cpc_target.json"


def load_target():
    """cpc_target.json에서 WT PID + 탭 인덱스 로드
    find_my_wt.ps1로 생성된 파일 (이 Claude Code 세션 내에서 실행)
    Returns: (wt_pid, tab_idx) — 실패 시 (None, None)
    """
    try:
        with open(CPC_TARGET_FILE, encoding='utf-8-sig') as f:
            data = json.load(f)
        wt_pid = data.get('wt_pid')
        tab_idx = data.get('tab_idx')
        if wt_pid:
            print(f"  [타겟] WT={wt_pid} TAB={tab_idx}")
            return wt_pid, tab_idx
    except Exception as e:
        print(f"  [타겟] cpc_target.json 읽기 실패: {e}")
    # 폴백: PID 파일
    try:
        with open(CLAUDE_CODE_PID_FILE) as f:
            pid = int(f.read().strip())
        if pid:
            return pid, None
    except Exception:
        pass
    return None, None


def inject_to_claude_code(cmd_id, platoon_id, text):
    """WT PID + 탭 전환으로 특정 Claude Code 세션에 직접 주입"""
    try:
        prompt = (
            f"[CPC 소대명령] 소대: {platoon_id} | 명령ID: {cmd_id}\n"
            f"지시사항: {text}\n\n"
            f"처리 후 결과 보고 (한글 OK):\n"
            f'powershell -File "C:\\Users\\wksun\\cpc-done.ps1" "{cmd_id}" "결과한줄요약"'
        )

        # cpc_target.json에서 wt_pid + oc_pid + wt_hwnd + tab_idx 로드
        wt_pid, tab_idx = load_target()
        oc_pid = None
        wt_hwnd = None
        try:
            with open(CPC_TARGET_FILE, encoding='utf-8-sig') as f:
                d = json.load(f)
            oc_pid = d.get('oc_pid')
            wt_pid = d.get('wt_pid') or wt_pid
            wt_hwnd = d.get('wt_hwnd')   # 정확한 WT 창 HWND (find_my_wt.ps1로 저장)
            tab_idx = d.get('tab_idx') or tab_idx  # UIA로 감지한 시각적 탭 인덱스
        except Exception:
            pass

        if not wt_pid or not oc_pid:
            print("  [주입] wt_pid/oc_pid 없음 — find_my_wt.ps1 재실행 필요")
            return

        if wt_hwnd:
            print(f"  [주입] 저장된 HWND 사용: {hex(wt_hwnd)} (정확한 WT 창)")
        if tab_idx:
            print(f"  [주입] 저장된 탭 인덱스 사용: {tab_idx} (UIA 시각적 순서)")

        # cpc_inject_wt.py: OC PID + 저장된 HWND/탭 인덱스로 정확한 탭에만 주입
        inject_script = r"G:\내 드라이브\mychatbot-world\.claude\hooks\cpc_inject_wt.py"
        pythonw = sys.executable.replace("python.exe", "pythonw.exe")
        if not os.path.exists(pythonw):
            pythonw = sys.executable  # fallback

        # 한글 인코딩 문제 방지: 프롬프트를 UTF-8 임시 파일로 저장 후 경로 전달
        import tempfile
        tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', encoding='utf-8', delete=False)
        tmp.write(prompt)
        tmp.close()

        args = [pythonw, inject_script, str(wt_pid), str(oc_pid), "@" + tmp.name]
        # 저장된 HWND가 있으면 전달 (여러 WT 창 환경에서 정확한 창 선택)
        args.append(hex(wt_hwnd) if wt_hwnd else "")
        # 저장된 탭 인덱스가 있으면 전달 (UIA 시각적 탭 순서 사용)
        args.append(str(tab_idx) if tab_idx else "")

        subprocess.Popen(
            args,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            creationflags=0x08000000  # CREATE_NO_WINDOW
        )
        print(f"  [주입] WT={wt_pid} OC={oc_pid} HWND={hex(wt_hwnd) if wt_hwnd else 'auto'} TAB={tab_idx or 'auto'} → 전달 완료")

        # 큐 파일 백업
        queue_path = r"C:\Users\wksun\cpc_inject_queue.txt"
        try:
            with open(queue_path, "a", encoding="utf-8") as f:
                f.write(prompt + "\n---CPC_END---\n")
        except Exception:
            pass
    except Exception as e:
        print(f"  [주입] 실패: {e}")


def cpc_patch(path, body=None):
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(
        f"{CPC_API}{path}", data=data,
        headers={"Content-Type": "application/json"}, method="PATCH"
    )
    urllib.request.urlopen(req, timeout=10)


def process_command(platoon_id, cmd):
    """새 명령: AI 빠른 응답 + Claude Code 소대장 주입"""
    cmd_id = cmd["id"]
    text = (cmd.get("text") or "").strip()

    print(f"\n{'='*52}")
    print(f"  [CPC] {platoon_id}: {text[:80]}")
    print(f"{'='*52}")
    sys.stdout.flush()

    windows_popup(f"CPC 명령 [{platoon_id}]", text[:80])

    # 1. ACK
    try:
        cpc_patch(f"/api/commands/{cmd_id}/ack")
    except Exception as e:
        print(f"  ACK 실패: {e}")

    # 2. Claude Code 소대장에게 직접 주입 (활성화 시 AI 자동처리 건너뜀)
    if INJECT_TO_CLAUDE:
        inject_to_claude_code(cmd_id, platoon_id, text)
        print(f"  [주입 모드] 소대장이 직접 처리 - AI 자동처리 생략")
        sys.stdout.flush()
        return  # 소대장이 직접 DONE 처리

    # 3. Vercel AI 자동처리 (INJECT_TO_CLAUDE=False일 때만)
    result = ""
    try:
        payload = json.dumps({
            "commandId": cmd_id,
            "platoonId": platoon_id,
            "text": text
        }).encode()
        req2 = urllib.request.Request(
            "https://mychatbot-world.vercel.app/api/cpc-process",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        resp = urllib.request.urlopen(req2, timeout=60)
        r_data = json.loads(resp.read().decode("utf-8"))
        result = r_data.get("result", "처리 완료")
        print(f"  AI 응답: {result[:100]}")
    except Exception as e:
        result = f"자동처리 실패: {e}"
        print(f"  오류: {e}")

    # 4. 결과 큐 파일 기록 (Claude Code 화면 표시용)
    QUEUE_FILE = r"C:\Users\home\cpc_results_queue.txt"
    try:
        now = datetime.datetime.now().strftime("%H:%M:%S")
        line = f"[{now}] [{platoon_id}] {text[:50]} → {result[:120]}\n"
        with open(QUEUE_FILE, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as e:
        print(f"  큐 파일 쓰기 실패: {e}")

    # 5. Windows 완료 팝업
    windows_popup(f"CPC 완료 [{platoon_id}]", result[:120])

    sys.stdout.flush()


def fetch_commands(platoon_id):
    url = f"{CPC_API}/api/platoons/{platoon_id}/commands"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data if isinstance(data, list) else []
    except Exception:
        return []


def polling_thread_fn(seen_ref):
    seen = seen_ref
    print(f"[CPC Monitor] 폴링 시작 ({POLL_INTERVAL}초)")
    sys.stdout.flush()
    while True:
        for pid in PLATOONS:
            cmds = fetch_commands(pid)
            for c in cmds:
                if c["id"] not in seen and c.get("status") == "PENDING":
                    seen.add(c["id"])
                    threading.Thread(target=process_command, args=(pid, c), daemon=True).start()
                elif c["id"] not in seen:
                    seen.add(c["id"])
        time.sleep(POLL_INTERVAL)


async def realtime_main():
    from supabase import acreate_client

    seen = set()
    print("[CPC Monitor] 초기화 중...")
    for pid in PLATOONS:
        for c in fetch_commands(pid):
            seen.add(c["id"])
    print(f"[CPC Monitor] 기존 {len(seen)}개 무시 — 이후 신규 명령 자동처리")
    sys.stdout.flush()

    client = await acreate_client(CPC_SUPABASE_URL, CPC_SUPABASE_KEY)

    def on_insert(payload):
        record = payload.get("data", {}).get("record", {}) if isinstance(payload, dict) else {}
        if not record:
            record = payload.get("new", payload.get("record", {})) if isinstance(payload, dict) else {}
        cmd_id = record.get("id")
        platoon_id = record.get("platoon_id", "?")
        if cmd_id and cmd_id not in seen and platoon_id in PLATOONS:
            seen.add(cmd_id)
            if record.get("status") == "PENDING":
                threading.Thread(target=process_command, args=(platoon_id, record), daemon=True).start()

    channel = client.channel("cpc-realtime-monitor")
    channel.on_postgres_changes(event="INSERT", schema="public", table="cpc_commands", callback=on_insert)
    await channel.subscribe()

    print("[CPC Monitor] Supabase Realtime 연결 성공 - 자동처리 + 소대장 주입 활성!")
    sys.stdout.flush()

    poll_t = threading.Thread(target=polling_thread_fn, args=(seen,), daemon=True)
    poll_t.start()

    while True:
        await asyncio.sleep(30)


def main():
    print("[CPC Monitor v6] 시작 - AI자동처리 + Claude Code 소대장 주입 모드")
    print(f"  감시 소대: {', '.join(PLATOONS)}")
    print(f"  소대장 주입: {'활성' if INJECT_TO_CLAUDE else '비활성'}")
    print(f"  프로젝트: {PROJECT_DIR}")
    sys.stdout.flush()

    try:
        asyncio.run(realtime_main())
    except Exception as e:
        print(f"[CPC Monitor] Realtime 실패: {e} → 폴링 모드")
        sys.stdout.flush()
        seen = set()
        for pid in PLATOONS:
            for c in fetch_commands(pid):
                seen.add(c["id"])
        polling_thread_fn(seen)


if __name__ == "__main__":
    main()
