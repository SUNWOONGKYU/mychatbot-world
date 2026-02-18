#!/bin/bash
# CPC 자동 체크 훅 — UserPromptSubmit 트리거
# 지휘관이 메시지를 보낼 때마다 PENDING 명령 확인
# 밀린 명령이 있으면 소대장 컨텍스트에 자동 주입

CPC_API="https://claude-platoons-control.vercel.app"

# CPC 처리 결과 큐 읽기 (cpc-monitor.py가 기록한 결과)
QUEUE_FILE="/c/Users/home/cpc_results_queue.txt"
if [ -f "$QUEUE_FILE" ] && [ -s "$QUEUE_FILE" ]; then
  echo ""
  echo "══════════════════════════════════════════"
  echo "  [CPC 자동처리 결과]"
  cat "$QUEUE_FILE"
  echo "══════════════════════════════════════════"
  > "$QUEUE_FILE"
fi

# 이 프로젝트의 소대 ID (디렉토리 기반)
CWD=$(echo "$INPUT" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('cwd',''))" 2>/dev/null || echo "")

# 소대 ID 매핑
PLATOON_ID=""
case "$CWD" in
  *mychatbot-world*) PLATOON_ID="mychatbot" ;;
  *SSAL_Works*) PLATOON_ID="ssalworks" ;;
  *AI_Study_Circle*) PLATOON_ID="studycircle" ;;
  *PoliticianFinder*) PLATOON_ID="politician" ;;
  *ValueLink*) PLATOON_ID="valuelink" ;;
esac

if [ -z "$PLATOON_ID" ]; then
  exit 0
fi

# 3개 소대 (1,2,3) PENDING 명령 확인
PENDING=""
for N in 1 2 3; do
  PID="${PLATOON_ID}-${N}"
  RESULT=$(curl -s --max-time 3 "${CPC_API}/api/platoons/${PID}/commands?status=PENDING" 2>/dev/null)

  # JSON 배열이고 비어있지 않은지 확인
  COUNT=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else 0)" 2>/dev/null || echo "0")

  if [ "$COUNT" -gt 0 ]; then
    CMDS=$(echo "$RESULT" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for c in data:
    print(f'  - [{c[\"id\"]}] {c[\"text\"][:80]}')
" 2>/dev/null)
    PENDING="${PENDING}[CPC] ${PID}: ${COUNT}건 PENDING\n${CMDS}\n"
  fi
done

if [ -n "$PENDING" ]; then
  echo -e "[CPC 지시상 수신] 밀린 명령이 있습니다:\n${PENDING}소대장은 이 명령들을 확인하고 필요한 작업을 실행하세요."
fi

exit 0
