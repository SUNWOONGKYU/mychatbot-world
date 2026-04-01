# Verification Instruction - S3EX2

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

> **⚠️ 소급(Retroactive) Task 검증 안내**

---

## Task ID
S3EX2

## Task Name
CPC 원격 실행 연동 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `js/cpc-client.js` 존재
- [ ] `api/cpc-proxy.js` 존재
- [ ] `cpc-agent-server/` 디렉토리 존재
- [ ] 각 파일 상단 `@task S3EX2` 주석 존재

### 2. CPC 클라이언트 검증
- [ ] CPC 명령 전송 로직 (`js/cpc-client.js`)
- [ ] 명령 결과 수신/표시 로직
- [ ] API 호출 (`/api/cpc-proxy` 또는 Supabase 직접)

### 3. 프록시 API 검증
- [ ] `api/cpc-proxy.js` — CPC 엔드포인트 프록시 동작
- [ ] 환경변수 기반 CPC URL 설정

### 4. CPC 에이전트 서버 검증
- [ ] `cpc-agent-server/` 내 MCP 서버 파일 존재
- [ ] `cpc_mcp_server.py` 또는 동등한 파일

## Test Commands
```bash
# 파일 존재 확인
ls -la js/cpc-client.js api/cpc-proxy.js
ls -la cpc-agent-server/

# 주석 확인
head -5 js/cpc-client.js api/cpc-proxy.js

# CPC 관련 코드 확인
grep -n "cpc\|CPC\|platoon" js/cpc-client.js
```

## Expected Results
- 3개 파일/디렉토리 존재
- CPC 명령 전송 로직 확인
- 환경변수 기반 설정

## Verification Agent
`code-reviewer-core`

## Pass Criteria
- [ ] 3개 파일/디렉토리 모두 존재 확인
- [ ] CPC 명령 전송 로직 확인
- [ ] Blocker 없음
