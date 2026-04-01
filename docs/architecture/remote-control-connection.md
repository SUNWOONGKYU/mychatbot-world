# 원격 제어 연결 구조 (Remote Control Connection)

**버전**: v22.3
**작성일**: 2026-03-31
**대상**: 이 시스템을 처음 접하는 사람도 전체 구조를 이해하고 구현할 수 있도록 작성됨

---

## 개요

이 문서는 사용자(지휘관)가 모바일 또는 PC에서 웹챗봇 UI를 통해 Claude Code 소대장에게 명령을 내리고 결과를 받는 전체 연결 구조를 설명합니다.

**핵심 원칙**: 사용자 → 챗봇 UI → CPC → 소대장(Claude Code) 직접 연결. 중간에 AI 에이전트(연락병)가 개입하지 않습니다.

---

## 전체 구성요소 3개

### 1. CPC (Claude Platoons Control)
- **위치**: Vercel + Supabase 클라우드
- **URL**: `https://claude-platoons-control.vercel.app`
- **Supabase 프로젝트**: `Claude_Platoons_Control` (ref: `hlpovizxnrnspobddxmq`, 서울 리전)
- **역할**:
  - 웹챗봇 UI 제공 (사용자 인터페이스)
  - 명령을 `cpc_commands` 테이블에 PENDING 상태로 저장
  - 소대 상태를 `cpc_platoons` 테이블에서 관리
  - 소대장이 결과를 보고하면 화면에 표시

### 2. MCP 서버 (cpc_mcp_server.py)
- **위치**: 각 PC의 `cpc-agent-server/cpc_mcp_server.py`
- **등록**: `~/.claude/settings.json`의 `mcpServers.cpc` 항목
- **역할**: Claude Code(소대장)와 CPC 사이의 브릿지
- **Channel 기능 내장**: Channel은 별도 프로세스가 아니라 이 MCP 서버 안에 내장된 기능
- **5개 MCP 도구**:

| 도구 | 설명 |
|------|------|
| `wait_cpc_command(platoon_id, timeout=120)` | PENDING 명령 대기 + 자동 ACK 처리 |
| `report_cpc_result(cmd_id, result)` | 결과 보고 + DONE 전환 |
| `request_cpc_approval(platoon_id, desc)` | 챗봇에 승인 요청 표시 |
| `wait_cpc_approval(platoon_id, approval_id)` | 승인/거부 응답 대기 |
| `send_cpc_message(platoon_id, text)` | 소대장 → 챗봇 직접 메시지 전송 |

### 3. Tailscale 메시 네트워크
- **역할**: PC간 직접 고속 통신 + 공개 HTTPS 접근점(Funnel)
- **WireGuard E2E 암호화**: Tailscale 서버도 트래픽 내용을 열람할 수 없음
- **메시 레이턴시**: 8ms 직접 P2P

---

## PC 구성

| 항목 | 홈 PC | 트레이딩 PC |
|------|-------|-----------|
| Tailscale IP | 100.117.252.93 | 100.109.54.128 |
| 호스트명 | desktop-v1sft2a | desktop-6a3bqnv |
| Funnel URL | `https://desktop-v1sft2a.tail47a0c9.ts.net` | `https://desktop-6a3bqnv.tail47a0c9.ts.net` |
| HTTP Bridge | port 8443 (Tailscale 내부 전용) | port 8443 (Tailscale 내부 전용) |
| 담당 소대 | mychatbot-1/2/3 | trader-bot |
| SSH | home / Abc12345 | viw life / Abc12345 |

---

## 명령 흐름 (단계별 상세)

### 경로 B: CPC Relay (기본 경로, 오프라인 버퍼링 포함)

```
[1] 사용자 (모바일/PC 브라우저)
     URL: https://claude-platoons-control.vercel.app
     - 소대 선택 드롭다운에서 원하는 소대 선택
     - 채팅창에 명령 입력 후 전송
         ↓
[2] 웹챗봇 UI (Vercel Next.js)
     - POST /api/platoons/{platoon_id}/commands
     - cpc_commands 테이블에 { text, status: "PENDING" } INSERT
         ↓
[3] CPC (Supabase DB)
     - 명령이 PENDING 상태로 대기
     - PC가 꺼져 있어도 명령 보관 (오프라인 버퍼링)
         ↓
[4] 소대장 (Claude Code, 각 PC에서 실행 중)
     - MCP wait_cpc_command(platoon_id, timeout=120) 폴링 루프
     - PENDING 명령 감지 시 즉시 반환 + 자동 ACKED 전환
     - 명령 텍스트를 Claude 소대장이 직접 읽고 판단하여 실행
         ↓
[5] 소대장 → 결과 보고
     - MCP report_cpc_result(cmd_id, result) 호출
     - cpc_commands 상태 DONE으로 전환
         ↓
[6] 웹챗봇 UI (3초 폴링)
     - DONE 상태의 result 필드를 감지
     - 채팅창에 결과 표시
```

### 경로 A: Tailscale Direct (실시간, Vercel 미통과)

```
[1] 웹챗봇이 먼저 Tailscale Funnel URL로 직접 HTTP 요청 시도 (5초 타임아웃)
     mychatbot → https://desktop-v1sft2a.tail47a0c9.ts.net
     trader-bot → https://desktop-6a3bqnv.tail47a0c9.ts.net
         ↓
[2a] 성공 (PC 켜짐 + Tailscale 활성) → 실시간 처리
     Funnel → HTTP Bridge (port 8443) → MCP → 소대장
         ↓
[2b] 실패 (PC 꺼짐/네트워크 문제) → 경로 B(CPC Relay)로 자동 폴백
     명령을 Supabase에 저장, PC 켜지면 자동 처리
```

---

## 소대 상태 관리

```
IDLE → RUNNING → PAUSED → DONE
```

- **IDLE**: 소대장 미실행 상태
- **RUNNING**: `/cpc-engage` 실행 후 MCP 폴링 루프 진행 중
- **PAUSED**: 일시 중단
- **DONE**: 소대 임무 완료

명령은 RUNNING 상태인 소대만 처리합니다. 소대장이 `/cpc-engage`를 실행하면 자동으로 IDLE → RUNNING 전환됩니다.

---

## 소대 편성 (16개)

| 프로젝트 | 소대 키 | 담당 PC |
|---------|---------|--------|
| My Chatbot World | mychatbot-1/2/3 | 홈 PC |
| SSALWorks | ssalworks-1/2/3 | (배정 시) |
| AI Study Circle | studycircle-1/2/3 | (배정 시) |
| Politician Finder | politician-1/2/3 | (배정 시) |
| ValueLink | valuelink-1/2/3 | (배정 시) |
| Trader Bot | trader-bot | 트레이딩 PC |

---

## 소대장 세션 시작 절차 (처음 구현하는 경우)

### Step 1: MCP 서버 등록 확인

`~/.claude/settings.json`에 아래 항목이 있어야 합니다.

```json
{
  "mcpServers": {
    "cpc": {
      "command": "python",
      "args": ["/절대경로/cpc-agent-server/cpc_mcp_server.py"],
      "type": "stdio"
    }
  }
}
```

주의: `mcp.servers: []` 빈 배열이 존재하면 mcpServers 설정이 무시됩니다. 반드시 삭제하세요.

### Step 2: bypassPermissions 설정

프로젝트 루트의 `.claude/settings.local.json`:

```json
{
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      "Bash(*)", "Edit(*)", "Write(*)", "Read(*)",
      "Glob(*)", "Grep(*)", "Agent(*)",
      "WebFetch(*)", "WebSearch(*)", "mcp__cpc__*"
    ]
  }
}
```

이 설정이 없으면 원격 운용 중 Claude Code가 매 도구 실행마다 y/n 입력을 대기하며 멈춥니다.

### Step 3: /cpc-engage 실행

Claude Code 세션 시작 후:

```
/cpc-engage
```

이 스킬이 실행되면:
1. 현재 디렉토리를 감지하여 소대 키 결정 (mychatbot-N, trader-bot 등)
2. CPC에서 IDLE 상태의 가장 낮은 번호 소대를 찾아 RUNNING으로 전환
3. `wait_cpc_command` MCP 폴링 루프 진입

이후 웹챗봇에서 명령을 전송하면 소대장이 자동으로 수신하여 처리합니다.

---

## 영구 제거된 구성요소

### cpc_daemon.py (v22.3 삭제)

`cpc_daemon.py`는 과거에 "연락병" 역할을 수행하던 별도 백그라운드 프로세스입니다.

**삭제 이유:**
- 소대장보다 먼저 명령을 가로채어 자체 판단으로 처리하는 로직이 있었음
- `__SILENT__` 마킹을 통해 소대장에게 특정 명령을 숨기는 기능이 있었음
- 이로 인해 명령 경합(두 프로세스가 동시에 같은 명령을 처리하려는 상황) 및 응답 누락 버그가 반복 발생
- 소대장(Claude Code)이 MCP를 통해 명령을 직접 수신·처리하는 구조로 완전 대체되어 불필요해짐

**현재 구조**: 소대장이 `wait_cpc_command`로 명령을 직접 읽고, 직접 판단하고, 직접 실행합니다. 중간에 개입하는 AI 프로세스는 없습니다.

---

## CPC API 엔드포인트 (직접 구현 시 참고)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/platoons` | 소대 목록 전체 조회 |
| POST | `/api/platoons` | 소대 등록/갱신 (upsert) |
| PATCH | `/api/platoons/{id}/status` | 소대 상태 변경 |
| GET | `/api/platoons/{id}/commands?status=PENDING` | 미처리 명령 조회 |
| POST | `/api/platoons/{id}/commands` | 명령 추가 |
| PATCH | `/api/commands/{id}/ack` | 명령 수신 확인 (PENDING → ACKED) |
| PATCH | `/api/commands/{id}/done` | 명령 완료 (ACKED → DONE) |
| POST | `/api/commands/broadcast` | 전체 소대 브로드캐스트 |
