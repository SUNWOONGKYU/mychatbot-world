# AI 원격 실행 도우미 (CPC)

핸드폰에서 챗봇으로 PC의 Claude Code를 원격 지휘통제하는 패키지 스킬.

---

## 한 줄 소개

밖에서 핸드폰 챗봇에 말하면, 집/사무실 PC의 Claude Code가 자동으로 작업을 수행하고 결과를 돌려보냅니다.

---

## 주요 기능

- 웹챗봇(연락병)에서 명령 전송 -> PC의 Claude Code가 자동 처리
- Tailscale 직접 경로: 실시간 명령 전달 (폴링 없음)
- CPC 경로: PC 꺼져있어도 명령 버퍼링 -> 켜지면 자동 처리
- 위험 명령 자동 감지 -> 챗봇 승인 요청 (rm, git push, 배포 등)
- 16개 소대까지 등록, 드롭다운 하나로 전환
- bypassPermissions: y/n 프롬프트 없이 자동 실행

---

## 구성 요소

| 구성요소 | 역할 |
|---------|------|
| CPC (Supabase + Vercel) | 중앙 명령 센터 (저장/라우팅/버퍼링) |
| MCP 서버 (Channel 내장) | Claude Code <-> CPC 연결 브릿지 |
| Tailscale 메시 | PC간 직접 고속 통신 (선택) |

---

## 패키지 구성

```
cpc-ai-remote/
  README.md              이 파일
  package.json           메타데이터
  install.sh             자동 설치 스크립트
  server/
    cpc_mcp_server.py    MCP 서버 (5개 도구)
    cpc_http_bridge.py   Tailscale HTTP Bridge
  skills/
    cpc-engage/SKILL.md  세션 시작 스킬 (/cpc-engage)
    cpc-setup/SKILL.md   초기 설치 스킬 (/cpc-setup)
  hooks/
    dangerous-cmd-approval.py  위험 명령 승인 Hook
  config/
    settings.local.json.template  bypassPermissions 설정
    settings.json.template        MCP 서버 등록
  sql/
    create_tables.sql    Supabase 테이블 생성
```

---

## 설치 요구사항

- Claude Code (claude-code CLI)
- Supabase 계정 (무료 가능)
- Vercel 계정 (무료 가능)
- Python 3.8+
- Node.js 18+
- Tailscale (선택, 실시간 통신용)

---

## 설치 방법

```bash
# 1. 패키지 압축 해제
unzip cpc-ai-remote.zip
cd cpc-ai-remote

# 2. 자동 설치
bash install.sh

# 3. Claude Code 재시작
# 4. /cpc-setup (최초 1회 — Supabase + Vercel 구축)
# 5. /cpc-engage (매 세션 — 소대장 가동)
```

---

## 사용 흐름

```
설치 후 매일 하는 것:
  1. Claude Code 실행
  2. /cpc-engage 입력
  3. 끝 — 핸드폰 챗봇에서 명령 가능

핸드폰에서:
  1. mychatbot.world 접속
  2. 연락병 페르소나 선택
  3. 소대 선택 (드롭다운)
  4. 명령 입력 (음성/텍스트)
  5. 결과 수신
```

---

## 가격

상담 (패키지 스킬 50만~500만원 대)

---

## 제작자

Sunny (SUNWOONGKYU) / My Chatbot World
