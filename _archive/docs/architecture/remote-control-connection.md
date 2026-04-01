# 소대장 직접 연결 — 리모트 컨트롤

## 개요

외출 중 모바일 브라우저에서 mychatbot.world → "리모트 연결"이라고 하면,
CPC를 통해 소대장에게 직접 전달 → 소대장이 `/remote-control` 실행 → URL 생성 → CPC 저장 → 채팅창에 클릭 가능 URL 표시.

v21.0부터 `bypassPermissions` 설정으로 원격 운용 중 터미널에서 y/n 프롬프트가 발생하지 않으며,
위험 명령은 PreToolUse Hook이 챗봇을 통해 사용자 승인을 받는다.

v22.2부터 연락병(AI 중개자) 개념이 제거되었습니다. 웹챗봇 UI에서 소대 선택 시 AI 호출 없이 CPC로 직접 명령이 전달됩니다.

## 핵심 원칙

- **리모트 컨트롤은 온디맨드** — `/cpc-engage` 시 사전 실행 아님
- 웹챗봇 UI에서 "리모트 연결" 요청 → CPC 명령 → 소대장이 MCP `wait_cpc_command`로 수신 → `/remote-control` 실행
- 웹챗봇 역할: **명령 전송만** (URL 전달 아님, URL은 CPC DONE으로 돌아옴)
- MCP 단독 처리: Agent Server 없음. 소대장이 Claude Code 네이티브로 직접 처리.

## 아키텍처 (v22.2 — 소대장 직접 연결)

```
=== 온디맨드 리모트 컨트롤 ===

[모바일 브라우저 — mychatbot.world]
    │ "리모트 연결해줘" 또는 "1소대장 리모트"
    ▼
[웹챗봇 UI — 소대 선택 후 직접 명령 전송]
    │ AI 중개 없이 CPC 명령 직접 생성
    │   └─ POST /api/platoons/mychatbot-1/commands
    │      body: { text: "리모트 연결", source: "chatbot" }
    ▼
[CPC (Supabase)]
    │ cpc_commands INSERT → PENDING 상태
    ▼
[Claude Code 소대장 — MCP wait_cpc_command 폴링]
    │ PENDING 명령 수신 (MCP 네이티브)
    │   └─ ACKED 전송 (PENDING → ACKED)
    │   └─ "리모트" 키워드 → /remote-control 실행
    │   └─ URL 캡처: https://claude.ai/code/session_xxx
    │   └─ CPC에 session_url 저장: PATCH /api/platoons/{id}/status
    │   └─ report_cpc_result → DONE (result: "리모트 접속 URL: ...")
    ▼
[CPC DONE → 웹챗봇 표시 (3초 폴링)]
    │ cpcSafeHtml: claude.ai/code URL → 클릭 가능 <a> 태그
    ▼
[사용자 클릭 → claude.ai/code 접속]
    └─ 모바일에서 소대장 세션 직접 제어
```

> **주의**: v20.0에서 Agent Server (server.py, inject_watcher.py, cc_inject.py, cpc_respond.py)는
> 완전 삭제되었습니다. 현재 명령 처리는 MCP 단독으로 이루어집니다.

## 구성 요소

### 1. Supabase — `cpc_platoons.session_url`

- 소대장 세션의 리모트 URL 저장
- `GET /api/platoons`에서 `select('*')`로 자동 반영

### 2. CPC API — `status.js`

- `PATCH /api/platoons/{id}/status`
- `session_url` 필드 수용 (status와 독립적으로 저장 가능)

### 3. Claude Code 소대장 — MCP 네이티브

- `wait_cpc_command(platoon_id, timeout=120)` 폴링으로 PENDING 명령 감지
- "리모트" 키워드 인식 → `/remote-control` 명령 실행
- URL 캡처 → `PATCH /api/platoons/{id}/status` 에 session_url 저장
- `report_cpc_result(cmd_id, result)` → DONE 반환

### 4. 웹챗봇 UI (소대장 직접 연결)

- **소대 선택 드롭다운**: AI 호출 없이 CPC 명령 직접 생성
- **cpcSafeHtml**: `claude.ai/code` URL만 클릭 가능 링크로 변환

### 5. bypassPermissions (v21.0)

- `settings.local.json`의 `defaultMode: bypassPermissions`
- 원격 운용 시 Claude Code가 모든 도구를 y/n 없이 자동 실행
- 위험 명령은 PreToolUse Hook (`dangerous-cmd-approval.py`)이 가로채어 챗봇 승인 요청

## 검증 방법

1. 모바일 → 웹챗봇 UI → "리모트 연결" → CPC에 PENDING 명령 생성 확인
2. 소대장 MCP 폴링이 PENDING 감지 → ACK → `/remote-control` 실행 확인
3. URL 캡처 → CPC DONE → 채팅창에 클릭 가능 URL 표시 확인
4. URL 클릭 → claude.ai/code에서 세션 접속 확인

## 보안 고려사항

- `cpcSafeHtml`: `escapeHtml` 후 `claude.ai/code` 패턴만 링크 변환 (XSS 방지)
- session_url은 공개 API 노출 → URL 보안은 claude.ai 측에 위임
- `bypassPermissions` 운용 중 위험 명령은 Hook이 자동 차단 → 챗봇 승인 필수
- 120초 내 응답 없으면 자동 거부 (fail-secure)

---

## v22.0 NEW — Tailscale 메시 네트워크

### 개요

Tailscale을 통해 Home PC와 Trading PC 사이에 WireGuard 기반 P2P 메시 네트워크가 구성되었습니다.
현재 기본 명령 흐름(Vercel+Supabase+MCP)은 그대로 유지되며, Tailscale은 직접 PC간 통신 경로를 추가합니다.

### 네트워크 구성

| 장치 | Tailscale IP | 호스트명 |
|------|-------------|---------|
| Home PC (소대장) | 100.117.252.93 | desktop-v1sft2a |
| Trading PC (트레이더) | 100.109.54.128 | desktop-6a3bqnv |

- 메시 레이턴시: **8ms 직접 P2P** (NAT 통과, Vercel 경유 없음)
- 암호화: WireGuard E2E (Tailscale이 트래픽을 볼 수 없음)

### HTTP Bridge (cpc_http_bridge.py)

- 위치: `cpc-agent-server/cpc_http_bridge.py`
- 포트: **8443**
- 역할: Tailscale 메시 위에서 Home PC 내 Claude Code 세션에 HTTP로 명령 전달
- Trading PC → `http://100.117.252.93:8443/command` → Home PC 직접 도달

### 아키텍처 (v22.0 — 이중 경로)

```
=== 명령 경로 A (현재 기본): Vercel + Supabase + MCP ===

[모바일/웹챗봇] → [Vercel API] → [Supabase cpc_commands]
    → MCP wait_cpc_command 폴링 → [Home PC Claude Code]

=== 명령 경로 B (v22.0 신규): Tailscale Direct ===

[Trading PC / 외부 스크립트]
    → Tailscale Mesh (8ms, WireGuard E2E)
    → http://100.117.252.93:8443
    → cpc_http_bridge.py
    → [Home PC Claude Code]

=== Tailscale Funnel (활성화 완료) ===

공개 URL: https://desktop-v1sft2a.tail47a0c9.ts.net
Funnel → Home PC 직접 도달 (/remote-control URL 대체 가능)
```

### Tailscale Funnel (활성화 완료)

- 현재 상태: **활성화 완료**
- 공개 URL: `https://desktop-v1sft2a.tail47a0c9.ts.net`
- Home PC에 공개 HTTPS URL 부여됨 → 모바일에서 Funnel을 통해 직접 접근 가능
- Vercel relay 없이 Tailscale Funnel이 공개 접점 역할 수행
- `/remote-control` URL 흐름 대체 가능 (Funnel URL 고정, 세션 URL 불필요)

---

**업데이트**: 2026-03-25
**버전**: v22.2 (연락병 제거 — 소대장 직접 연결, Claude Code / Trader 페르소나)
