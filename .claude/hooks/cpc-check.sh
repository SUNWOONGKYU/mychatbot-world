#!/bin/bash
# CPC 자동 체크 훅 — UserPromptSubmit 트리거
export PYTHONIOENCODING=utf-8
export LANG=C.UTF-8
export LC_ALL=C.UTF-8
# 1) 최근 DONE 명령 결과 표시 (새 것만)
# 2) PENDING 명령 알림

CPC_API="https://claude-platoons-control.vercel.app"
LAST_SEEN_FILE="/c/Users/home/cpc_last_seen.txt"

# 이 프로젝트의 소대 ID (디렉토리 기반)
CWD=$(echo "$INPUT" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('cwd',''))" 2>/dev/null || echo "")

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

# 마지막으로 본 시각 불러오기 (없으면 1분 전)
if [ -f "$LAST_SEEN_FILE" ]; then
  LAST_SEEN=$(cat "$LAST_SEEN_FILE")
else
  LAST_SEEN=$(python3 -c "from datetime import datetime, timedelta; print((datetime.utcnow()-timedelta(minutes=1)).strftime('%Y-%m-%dT%H:%M:%S'))")
fi

# 3개 소대 DONE/PENDING 확인
DONE_OUTPUT=""
PENDING_OUTPUT=""
NEW_LAST_SEEN="$LAST_SEEN"

for N in 1 2 3; do
  PID="${PLATOON_ID}-${N}"
  RESULT=$(curl -s --max-time 4 "${CPC_API}/api/platoons/${PID}/commands" 2>/dev/null)

  # DONE — LAST_SEEN 이후 새 결과
  DONE_ITEMS=$(echo "$RESULT" | python3 -c "
import sys, json
from datetime import datetime
data = json.load(sys.stdin)
last = '$LAST_SEEN'
items = []
latest = last
for c in data:
    if c.get('status') != 'DONE' or not c.get('result'):
        continue
    updated = c.get('updated_at','')[:19]
    if updated > last:
        txt = (c.get('text') or '')[:40]
        res = (c.get('result') or '').replace('**','').replace('\n',' ')[:100]
        items.append(f'  [{c[\"platoon_id\"]}] {txt} → {res}')
        if updated > latest:
            latest = updated
print('LATEST:' + latest)
for i in items:
    print(i)
" 2>/dev/null)

  # LATEST 타임스탬프 추출
  NEW_TS=$(echo "$DONE_ITEMS" | grep "^LATEST:" | sed 's/LATEST://')
  if [ -n "$NEW_TS" ] && [ "$NEW_TS" > "$NEW_LAST_SEEN" ]; then
    NEW_LAST_SEEN="$NEW_TS"
  fi
  DONE_LINES=$(echo "$DONE_ITEMS" | grep -v "^LATEST:" | LC_ALL=C.UTF-8 grep -a ".")
  if [ -n "$DONE_LINES" ]; then
    DONE_OUTPUT="${DONE_OUTPUT}${DONE_LINES}\n"
  fi

  # PENDING
  COUNT=$(echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
p = [c for c in data if c.get('status')=='PENDING']
print(len(p))
" 2>/dev/null || echo "0")
  if [ "$COUNT" -gt 0 ]; then
    PENDING_OUTPUT="${PENDING_OUTPUT}[CPC] ${PID}: ${COUNT}건 미처리\n"
  fi
done

# 새 DONE 결과 출력
if [ -n "$DONE_OUTPUT" ]; then
  echo ""
  echo "══════════════════════════════════════════"
  echo "  [CPC 처리 결과 — 소대 보고]"
  echo -e "$DONE_OUTPUT"
  echo "══════════════════════════════════════════"
  # last_seen 갱신
  echo "$NEW_LAST_SEEN" > "$LAST_SEEN_FILE"
fi

# PENDING 알림
if [ -n "$PENDING_OUTPUT" ]; then
  echo -e "[CPC] 미처리 명령:\n${PENDING_OUTPUT}수동 처리가 필요하면 /cpc-engage-1 실행"
fi

exit 0
