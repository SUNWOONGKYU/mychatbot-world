#!/usr/bin/env python3
"""
CPC Real-time Monitor v4
Supabase Realtime (async) -> 즉시 감지 + Windows 팝업
폴백: 3초 간격 REST 폴링
시작 이후 새 명령만 알림 (기존 명령 무시)
"""
import asyncio, json, os, sys, time, subprocess, threading, urllib.request, datetime

CPC_SUPABASE_URL = "https://hlpovizxnrnspobddxmq.supabase.co"
CPC_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscG92aXp4bnJuc3BvYmRkeG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzQ2MTQsImV4cCI6MjA4Njc1MDYxNH0.rOYmy0OlD5tI-Jlt_sD0PpSdjvkjfAQScvVELAKPiMI"
CPC_API = "https://claude-platoons-control.vercel.app"
PLATOONS = ["mychatbot-1", "mychatbot-2", "mychatbot-3"]
POLL_INTERVAL = 3


def windows_popup(title, msg):
    """Windows 팝업 알림 (mshta WScript.Shell.Popup)"""
    try:
        safe_msg = msg[:150].replace('"', "'").replace("'", "`").replace('\n', ' ')
        safe_title = title.replace('"', "'").replace("'", "`")
        cmd = (
            f'mshta "javascript:var sh=new ActiveXObject(\'WScript.Shell\');'
            f'sh.Popup(\'{safe_msg}\',8,\'{safe_title}\',48);close()"'
        )
        subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        pass


def alert(platoon_id, cmd):
    text = (cmd.get("text") or "")[:100]
    status = cmd.get("status", "?")
    source = cmd.get("source", "?")
    print(f"\n{'='*52}")
    print(f"  CPC 새 명령 수신! [{platoon_id}]")
    print(f"  상태: {status} | 출처: {source}")
    print(f"  내용: {text}")
    print(f"{'='*52}")
    sys.stdout.flush()
    windows_popup(f"CPC [{platoon_id}]", text)


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
    """폴백: 3초 간격 REST 폴링"""
    seen = seen_ref
    print(f"[CPC Monitor] 폴링 백업 시작 ({POLL_INTERVAL}초)")
    sys.stdout.flush()
    while True:
        for pid in PLATOONS:
            cmds = fetch_commands(pid)
            for c in cmds:
                if c["id"] not in seen:
                    seen.add(c["id"])
                    alert(pid, c)
        time.sleep(POLL_INTERVAL)


async def realtime_main():
    """Supabase Realtime async 구독"""
    from supabase import acreate_client

    seen = set()

    # 시작 시 기존 명령 ID 모두 seen 등록 (알림 없이 무시)
    print("[CPC Monitor] 초기화 중...")
    for pid in PLATOONS:
        for c in fetch_commands(pid):
            seen.add(c["id"])
    print(f"[CPC Monitor] 기존 {len(seen)}개 무시 -- 이후 신규 명령만 알림")
    sys.stdout.flush()

    client = await acreate_client(CPC_SUPABASE_URL, CPC_SUPABASE_KEY)

    def on_insert(payload):
        record = payload.get("data", {}).get("record", {}) if isinstance(payload, dict) else {}
        if not record:
            record = payload.get("new", payload.get("record", {})) if isinstance(payload, dict) else {}
        cmd_id = record.get("id")
        platoon_id = record.get("platoon_id", "?")
        if cmd_id and cmd_id not in seen:
            seen.add(cmd_id)
            alert(platoon_id, record)

    channel = client.channel("cpc-realtime-monitor")
    channel.on_postgres_changes(
        event="INSERT",
        schema="public",
        table="cpc_commands",
        callback=on_insert
    )
    await channel.subscribe()

    print("[CPC Monitor] Supabase Realtime 연결 성공 -- 즉시 감지 활성!")
    sys.stdout.flush()

    poll_t = threading.Thread(target=polling_thread_fn, args=(seen,), daemon=True)
    poll_t.start()

    while True:
        await asyncio.sleep(30)


def main():
    print("[CPC Monitor v4] 시작")
    print(f"  감시 소대: {', '.join(PLATOONS)}")
    print("  Supabase Realtime 연결 시도...")
    sys.stdout.flush()

    try:
        asyncio.run(realtime_main())
    except Exception as e:
        print(f"[CPC Monitor] Realtime 실패: {e} -> 폴링 전용 모드")
        sys.stdout.flush()
        seen = set()
        for pid in PLATOONS:
            for c in fetch_commands(pid):
                seen.add(c["id"])
        print(f"[CPC Monitor] 폴링 모드 ({POLL_INTERVAL}초 간격)")
        sys.stdout.flush()
        polling_thread_fn(seen)


if __name__ == "__main__":
    main()
