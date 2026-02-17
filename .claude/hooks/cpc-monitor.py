#!/usr/bin/env python3
"""CPC Real-time Monitor — 15초 간격으로 새 명령 감지"""
import json, os, sys, time, urllib.request

CPC_API = "https://claude-platoons-control.vercel.app"
PLATOONS = ["mychatbot-1", "mychatbot-2", "mychatbot-3"]
SEEN_FILE = os.path.join(os.path.dirname(__file__), "cpc_seen_ids.txt")
POLL_INTERVAL = 15

def load_seen():
    if not os.path.exists(SEEN_FILE):
        return set()
    with open(SEEN_FILE, "r", encoding="utf-8") as f:
        return set(line.strip() for line in f if line.strip())

def save_seen(seen):
    with open(SEEN_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(seen)) + "\n")

def fetch_commands(platoon_id):
    url = f"{CPC_API}/api/platoons/{platoon_id}/commands"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data if isinstance(data, list) else []
    except Exception:
        return []

def main():
    # 첫 실행: 기존 명령 모두 seen 처리 (초기화)
    seen = load_seen()
    if not seen:
        print("[CPC Monitor] Initializing — recording existing commands...")
        for pid in PLATOONS:
            cmds = fetch_commands(pid)
            for c in cmds:
                seen.add(c["id"])
        save_seen(seen)
        print(f"[CPC Monitor] {len(seen)} existing commands recorded.")

    print(f"[CPC Monitor] Watching {', '.join(PLATOONS)} every {POLL_INTERVAL}s")
    print("---")
    sys.stdout.flush()

    while True:
        for pid in PLATOONS:
            cmds = fetch_commands(pid)
            new_cmds = [c for c in cmds if c["id"] not in seen]
            if new_cmds:
                print(f"\n[CPC ALERT] {pid}: {len(new_cmds)} NEW command(s)!")
                for c in new_cmds:
                    status = c.get("status", "?")
                    text = (c.get("text") or "")[:150]
                    source = c.get("source", "?")
                    result = (c.get("result") or "")[:100]
                    print(f"  [{status}] \"{text}\" (from: {source})")
                    if result:
                        print(f"    -> Result: {result}")
                    seen.add(c["id"])
                save_seen(seen)
                sys.stdout.flush()
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
