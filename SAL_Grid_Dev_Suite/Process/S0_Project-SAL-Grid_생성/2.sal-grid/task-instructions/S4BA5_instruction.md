# Task Instruction - S4BA5

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
- **S4** = 개발 3차 (Advanced Development)

### Area 명칭
- **BA** = Backend APIs (백엔드 API)

---

# Task Instruction - S4BA5

## Task ID
S4BA5

## Task Name
피상속 API 기본 (소급)

## Task Goal
이미 구현 완료된 피상속 API 기본 버전을 SAL Grid에 소급 등록하고 검증한다. S4BA3(고도화)과의 중복을 확인하고 기본 구현의 품질을 점검한다.

## Prerequisites (Dependencies)
- 없음 (소급 등록 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 구현 파일 확인
- 위치: `Process/S4_개발_마무리/Backend_APIs/inheritance.js`
- 파일 내용 전체 리뷰

### 2. 점검 항목
- 피상속인 지정 기본 API (`POST /api/inheritance`) 구현 여부
- 피상속인 조회 API (`GET /api/inheritance`) 구현 여부
- 동의 처리 API 기본 구현 여부
- 인증 미들웨어 적용 여부
- S4BA3과의 기능 중복 범위 확인 및 문서화

### 3. S4BA3와의 관계 정리
- 이 파일(S4BA5)은 기본 구현, S4BA3는 고도화 버전
- 기본 파일에서 고도화 버전으로 마이그레이션 경로 주석으로 명시
- 중복 엔드포인트가 있으면 S4BA3 경로로 통합 권고 주석 추가

### 4. 파일 상단 Task ID 주석 확인/추가
```javascript
/**
 * @task S4BA5
 * @description 피상속 API 기본 — 소급 등록 (고도화: S4BA3 참조)
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Backend_APIs/inheritance.js` (기존 파일 보완)

## Completion Criteria
- [ ] 피상속인 지정 및 조회 기본 API가 구현되어 있다
- [ ] 인증이 필요한 엔드포인트에 미들웨어가 적용되어 있다
- [ ] S4BA3와의 관계가 주석으로 명시되어 있다
- [ ] `@task S4BA5` 주석이 파일 상단에 있다
- [ ] 에러 처리가 구현되어 있다

## Tech Stack
- JavaScript (Node.js) 또는 TypeScript
- Supabase (PostgreSQL)

## Tools
- npm (의존성 확인)
- supabase (MCP 서버, DB 조회)

## Execution Type
AI-Only

## Remarks
- 소급 등록 Task: 기존 구현을 SAL Grid 기준으로 검증 및 보완
- S4BA3(고도화)와의 역할 분리를 명확히 문서화할 것
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4BA5 → `Process/S4_개발_마무리/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- 기존 파일명 `inheritance.js` 유지
- 파일 상단 `@task S4BA5` 주석 필수
