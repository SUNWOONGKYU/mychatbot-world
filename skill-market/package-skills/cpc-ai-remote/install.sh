#!/bin/bash
# CPC AI 원격 실행 도우미 — 자동 설치 스크립트
# 사용법: bash install.sh

set -e

echo "=== CPC AI 원격 실행 도우미 설치 ==="
echo ""

# 1. 필수 도구 확인
echo "[1/7] 필수 도구 확인..."
for cmd in python3 node git curl; do
  if ! command -v $cmd &>/dev/null; then
    echo "오류: $cmd 가 설치되어 있지 않습니다."
    exit 1
  fi
done
echo "  필수 도구 확인 완료"

# 2. 설치 경로 설정
INSTALL_DIR="$HOME/.cpc"
mkdir -p "$INSTALL_DIR/server"
echo "[2/7] 설치 경로: $INSTALL_DIR"

# 3. 서버 파일 복사
echo "[3/7] 서버 파일 설치..."
cp server/cpc_mcp_server.py "$INSTALL_DIR/server/"
cp server/cpc_http_bridge.py "$INSTALL_DIR/server/"
echo "  MCP 서버 + HTTP Bridge 설치 완료"

# 4. 스킬 파일 설치
echo "[4/7] 스킬 파일 설치..."
SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR/cpc-engage" "$SKILLS_DIR/cpc-setup"
cp skills/cpc-engage/SKILL.md "$SKILLS_DIR/cpc-engage/"
cp skills/cpc-setup/SKILL.md "$SKILLS_DIR/cpc-setup/"
echo "  /cpc-engage, /cpc-setup 스킬 설치 완료"

# 5. Hook 설치
echo "[5/7] 위험 명령 Hook 설치..."
HOOKS_DIR=".claude/hooks"
mkdir -p "$HOOKS_DIR"
cp hooks/dangerous-cmd-approval.py "$HOOKS_DIR/"
echo "  dangerous-cmd-approval.py 설치 완료"

# 6. MCP 서버 등록 안내
echo "[6/7] MCP 서버 등록..."
echo ""
echo "  ~/.claude/settings.json 에 아래 내용을 추가하세요:"
echo ""
echo '  "mcpServers": {'
echo '    "cpc": {'
echo '      "command": "python3",'
echo "      \"args\": [\"$INSTALL_DIR/server/cpc_mcp_server.py\"],"
echo '      "env": {'
echo '        "CPC_BASE_URL": "https://claude-platoons-control.vercel.app"'
echo '      }'
echo '    }'
echo '  }'
echo ""

# 7. 설정 파일 안내
echo "[7/7] 설정 파일..."
echo ""
echo "  프로젝트 .claude/settings.local.json 에 아래 파일 내용을 복사하세요:"
echo "  config/settings.local.json.template"
echo ""

echo "=== 설치 완료 ==="
echo ""
echo "다음 단계:"
echo "  1. Claude Code 재시작"
echo "  2. /cpc-setup 실행 (Supabase + Vercel 초기 구축, 최초 1회)"
echo "  3. /cpc-engage 실행 (소대장 가동, 매 세션)"
echo ""
echo "Tailscale 설정 (선택):"
echo "  1. tailscale 설치 (https://tailscale.com/download)"
echo "  2. tailscale up (로그인)"
echo "  3. python3 $INSTALL_DIR/server/cpc_http_bridge.py (Bridge 실행)"
echo "  4. tailscale funnel --bg 8443 (Funnel 활성화)"
