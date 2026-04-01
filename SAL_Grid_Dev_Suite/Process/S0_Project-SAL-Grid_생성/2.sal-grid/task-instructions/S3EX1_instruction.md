# Task Instruction - S3EX1

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

# Task Instruction - S3EX1

## Task ID
S3EX1

## Task Name
Obsidian 연동 (소급)

## Task Goal
이미 구현된 Obsidian 연동 API (`api/obsidian.js`)를 SAL Grid에 소급 등록한다. Obsidian vault와 My Chatbot World 간의 데이터 연동 기능을 검토하고 문서화한다.

## Prerequisites (Dependencies)
- 없음 (소급 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 파일 확인
- `api/obsidian.js` 파일 존재 여부 확인
- 구현된 기능 목록 파악:
  - Obsidian vault 노트 읽기/쓰기
  - 태그 기반 노트 검색
  - 챗봇과 Obsidian 연동

### 2. 파일 상단 주석 추가 (소급)
```javascript
/**
 * @task S3EX1
 * @description Obsidian 연동 API — 소급 등록
 */
```

### 3. 기능 검토
- API 엔드포인트 목록 확인
- Obsidian Local REST API 플러그인 연동 방식 확인
- 인증/보안 처리 검토
- 에러 처리 로직 점검

### 4. 필요 시 보완
- 미흡한 에러 처리 보완
- 환경변수 참조 방식 개선 (`OBSIDIAN_API_URL` 등)

## Expected Output Files
- `api/obsidian.js` (기존 파일 확인 + 주석 추가)

## Completion Criteria
- [ ] `api/obsidian.js` 파일 존재 확인
- [ ] 파일 상단 `@task S3EX1` 주석 추가
- [ ] 주요 기능 (노트 읽기/쓰기) 동작 확인
- [ ] Grid JSON 파일 상태 업데이트 (Completed, Verified)

## Tech Stack
- JavaScript (Node.js/Vercel Serverless)
- Obsidian Local REST API

## Tools
- 없음 (외부 연동 확인만)

## Task Agent
`backend-developer-core`

## Verification Agent
`code-reviewer-core`

## Execution Type
Hybrid (Obsidian 설치 및 플러그인 설정은 PO 환경 필요)

## Remarks
- Obsidian Local REST API 플러그인이 PO 환경에 설치되어 있어야 동작
- 소급 Task이므로 신규 개발보다 검증과 문서화에 집중
- `api/obsidian.js`가 없는 경우 기본 구조 신규 생성

---

## ⚠️ 작업 결과물 저장 규칙

- 소급 Task이므로 이미 루트 폴더(`api/`)에 저장되어 있음
- `api/obsidian.js`가 배포본

---

## 📝 파일 명명 규칙
- 기존 파일명 유지: `obsidian.js`
- 파일 상단 `@task S3EX1` 주석 추가
