# 보안 정책 (Security Policy)

**버전**: v22.3
**작성일**: 2026-03-31
**대상**: CPC 시스템 운영자 및 처음 구현하는 개발자

---

## 개요

이 문서는 CPC 원격 제어 시스템에서 적용되는 보안 체계를 설명합니다.
소대장(Claude Code)이 원격으로 명령을 자동 실행할 때, 위험한 명령에 대한 사람의 최종 승인을 요구하는 구조입니다.

---

## 보안 레이어 1: bypassPermissions + PreToolUse Hook

### bypassPermissions
소대장이 원격으로 도구를 실행할 때 터미널에서 y/n 입력 없이 자동 허용하는 모드입니다.
이 설정이 없으면 원격 운용 중 명령 하나마다 멈춥니다.

설정 위치: 프로젝트 루트 `.claude/settings.local.json`

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

### PreToolUse Hook (dangerous-cmd-approval.py)
`bypassPermissions`가 모든 명령을 통과시키는 것을 보완하는 안전장치입니다.
Bash 도구 실행 직전에 시스템 레벨에서 강제 개입합니다. bypassPermissions 설정과 무관하게 동작합니다.

**Hook 위치**: `.claude/hooks/dangerous-cmd-approval.py`

---

## 위험 명령 감지 패턴

아래 패턴이 명령에 포함되면 Hook이 자동으로 가로채어 챗봇에 승인을 요청합니다.

| 카테고리 | 감지 패턴 |
|----------|----------|
| 파일 삭제 | `rm`, `del`, `rmdir`, `Remove-Item`, `unlink`, `shred` |
| 프로세스 종료 | `taskkill`, `shutdown` |
| Git 위험 작업 | `git push`, `git reset --hard`, `--force`, `git branch -D` |
| 배포 | `vercel --prod` |
| DB 파괴적 쿼리 | `DROP TABLE`, `DELETE FROM`, `TRUNCATE` |
| 패키지 삭제 | `npm uninstall` |

---

## 승인 흐름 (두 가지 경로)

### A. Hook 자동 승인 (시스템 강제)

소대장이 Bash 도구로 위험 패턴 명령을 실행하려 할 때 자동 발동합니다.

```
소대장 → Bash 도구 실행 시도
    |
    Hook 개입 (dangerous-cmd-approval.py)
    |
    위험 패턴 검사
    |
    [미감지] → 그대로 실행 허용
    |
    [감지] → CPC API에 approval_request POST
              챗봇 화면에 승인/거부 버튼 표시
              |
              [승인 클릭] → 명령 실행
              [거부 클릭] → 명령 차단
              [120초 무응답] → 자동 거부 (Fail Secure)
```

### B. 소대장 자체 판단 승인

소대장이 작업 중 사람의 확인이 필요하다고 판단할 때 직접 요청합니다.

```
소대장 → request_cpc_approval(platoon_id, 설명 텍스트) MCP 호출
    |
    CPC에 approval_request INSERT
    챗봇 화면에 승인/거부 버튼 표시
    |
    소대장 → wait_cpc_approval(platoon_id, approval_id) 대기
    |
    [승인] → 작업 계속
    [거부] → 작업 중단
    [120초 타임아웃] → 자동 거부 (Fail Secure)
```

---

## Fail Secure 원칙

120초 내에 승인 응답이 없으면 자동으로 거부 처리됩니다.
사용자가 자리를 비운 상태에서 위험 명령이 무단 실행되는 것을 방지하기 위한 원칙입니다.

---

## 보안 레이어 2: Tailscale WireGuard E2E 암호화

소대장과 웹챗봇 간 직접 통신(Tailscale 경로)은 WireGuard 프로토콜로 E2E 암호화됩니다.
- Tailscale 서버도 트래픽 내용을 열람할 수 없습니다.
- ACL(접근 제어 목록)로 허가된 장치만 메시 네트워크에 참여할 수 있습니다.
- Funnel을 통한 외부 접근은 HTTPS(TLS)로 보호됩니다.

---

## 보안 레이어 3: CPC API 접근 제어

- Supabase RLS(Row Level Security): anon 전체 허용 (현재 설정)
- Vercel API 라우트: Supabase 경유, 직접 DB 접근 없음
- 소대 ID를 알아야 명령 전송 가능 (URL 기반 격리)

---

## 영구 제거: __SILENT__ 로직 (v22.3)

과거 `cpc_daemon.py`(연락병 프로세스)에는 특정 명령에 `__SILENT__` 마킹을 붙여 소대장에게 숨기는 로직이 있었습니다. 이 로직은 다음 문제를 유발했습니다.

- 소대장이 모르는 상태에서 명령이 처리되어 감사(audit) 추적 불가
- 연락병 프로세스와 소대장 사이의 명령 경합으로 응답 누락 발생
- 보안 관점에서 AI가 명령을 자의적으로 필터링하는 것은 허용 불가

v22.3부터 `cpc_daemon.py` 자체가 삭제되었으므로 이 로직도 완전히 제거되었습니다.
모든 명령은 소대장이 직접 수신하여 처리하며, 숨겨지는 명령은 없습니다.

---

## 요약

| 보안 항목 | 구현 방법 |
|----------|----------|
| 자동 실행 허용 | bypassPermissions (원격 운용 필수) |
| 위험 명령 차단 | PreToolUse Hook (dangerous-cmd-approval.py) |
| 사람 승인 요청 | CPC approval_request + 챗봇 UI 버튼 |
| 타임아웃 거부 | 120초 Fail Secure |
| 통신 암호화 | Tailscale WireGuard E2E |
| 명령 투명성 | 소대장 직접 처리 (중간 AI 필터링 없음) |
