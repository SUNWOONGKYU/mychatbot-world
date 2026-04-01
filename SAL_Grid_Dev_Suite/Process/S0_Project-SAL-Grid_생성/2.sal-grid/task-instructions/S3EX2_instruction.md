# Task Instruction - S3EX2

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## ⚠️ SAL Grid 데이터 작성 필수 규칙

### Stage 명칭
- **S3** = 개발 2차 (Additional Development)

### Area 명칭
- **EX** = External (외부 연동)

> **⚠️ 소급(Retroactive) Task 안내**
> 이 Task는 이미 완료된 작업을 SAL Grid에 등록하는 소급 Task입니다.

---

# Task Instruction - S3EX2

## Task ID
S3EX2

## Task Name
CPC 원격 실행 연동 (소급)

## Task Goal
이미 구현된 CPC(Claude Platoons Control) 원격 실행 연동 파일들을 SAL Grid에 소급 등록한다. 챗봇에서 CPC 명령을 전송하고 결과를 수신하는 기능을 검토하고 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인 (3개 영역)

**클라이언트 사이드:**
- `js/cpc-client.js` — 챗봇 프론트엔드에서 CPC 명령 전송

**서버 사이드 프록시:**
- `api/cpc-proxy.js` — CPC API 프록시 (CORS 우회 등)

**CPC 에이전트 서버:**
- `cpc-agent-server/` — CPC MCP 서버 관련 파일들 (기존 구현 확인)

### 2. 파일 상단 주석 추가 (소급)
```javascript
/**
 * @task S3EX2
 * @description CPC 원격 실행 연동 — 소급 등록
 */
```

### 3. 기능 검토
- `js/cpc-client.js`:
  - CPC 명령 전송 UI (명령 입력, 전송 버튼)
  - 명령 결과 수신/표시
- `api/cpc-proxy.js`:
  - CPC API 엔드포인트 프록시
  - 인증 헤더 처리
- `cpc-agent-server/`:
  - MCP 서버 구성 파일 확인

### 4. CPC 통신 구조 확인
- MCP 네이티브 방식 (v22.1) 확인
- `wait_cpc_command`, `report_cpc_result` 도구 활용 여부

## Expected Output Files
- `js/cpc-client.js` (기존 파일 확인 + 주석)
- `api/cpc-proxy.js` (기존 파일 확인 + 주석)
- `cpc-agent-server/` (기존 파일 확인)

## Completion Criteria
- [ ] `js/cpc-client.js` 파일 존재 확인
- [ ] `api/cpc-proxy.js` 파일 존재 확인
- [ ] `cpc-agent-server/` 디렉토리 존재 확인
- [ ] 각 파일 상단 `@task S3EX2` 주석 추가
- [ ] Grid JSON 파일 상태 업데이트 (Completed, Verified)

## Tech Stack
- JavaScript (클라이언트/서버)
- CPC MCP 서버 (Python)
- Supabase (CPC 상태 저장)

## Tools
- 없음 (소급 확인)

## Task Agent
`backend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
Hybrid (CPC 서버 실행 환경 PO 필요)

## Remarks
- CPC 시스템 전체 구조는 MEMORY.md 참조
- `cpc-agent-server/cpc_mcp_server.py`가 MCP 서버 핵심
- 소급 Task이므로 신규 개발보다 검증/문서화 집중

---

## ⚠️ 작업 결과물 저장 규칙

- 소급 Task이므로 이미 해당 위치에 저장되어 있음
- `js/cpc-client.js`, `api/cpc-proxy.js`, `cpc-agent-server/`

---

## 📝 파일 명명 규칙
- 기존 파일명 유지
- 파일 상단 `@task S3EX2` 주석 추가
