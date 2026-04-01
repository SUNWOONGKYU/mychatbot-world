# Task Instruction - S4BA4

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

# Task Instruction - S4BA4

## Task ID
S4BA4

## Task Name
Marketplace API (소급)

## Task Goal
이미 구현 완료된 Marketplace API를 SAL Grid에 소급 등록하고 검증한다. 기존 구현 파일의 품질을 점검하고 누락된 엔드포인트나 오류를 보완한다.

## Prerequisites (Dependencies)
- 없음 (소급 등록 Task — 이미 구현 완료)

## Specific Instructions

### 1. 기존 구현 파일 확인
- 위치: `Process/S4_개발_마무리/Backend_APIs/marketplace.js`
- 파일 내용 전체 리뷰 후 아래 항목 점검

### 2. 점검 항목
- 마켓플레이스 목록 조회 API (`GET /api/marketplace`)
  - 페이지네이션, 카테고리 필터, 검색 기능 포함 여부
- 마켓플레이스 상세 조회 API (`GET /api/marketplace/:id`)
  - 페르소나 상세 정보, 구독 가격, 리뷰 수 포함 여부
- 마켓플레이스 업로드 API (`POST /api/marketplace`)
  - 인증 미들웨어 적용, 입력값 검증 여부
- 구매/구독 API 연동 여부
- 에러 처리 및 HTTP 상태 코드 일관성

### 3. 보완 작업
- 누락 엔드포인트가 있으면 추가 구현
- 입력값 검증(Zod 또는 직접 검증) 미적용 시 추가
- `@task S4BA4` 주석이 없으면 파일 상단에 추가

### 4. 파일 상단 Task ID 주석 확인/추가
```javascript
/**
 * @task S4BA4
 * @description Marketplace API — 목록/상세/업로드/구매
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Backend_APIs/marketplace.js` (기존 파일 보완)

## Completion Criteria
- [ ] 마켓플레이스 목록/상세/업로드 API가 모두 구현되어 있다
- [ ] 인증이 필요한 엔드포인트에 미들웨어가 적용되어 있다
- [ ] 입력값 검증이 구현되어 있다
- [ ] 에러 응답이 일관된 형식을 가진다
- [ ] `@task S4BA4` 주석이 파일 상단에 있다

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
- 대규모 리팩토링은 이 Task 범위 외
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4BA4 → `Process/S4_개발_마무리/Backend_APIs/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `api/Backend_APIs/`

---

## 📝 파일 명명 규칙
- 기존 파일명 `marketplace.js` 유지
- 파일 상단 `@task S4BA4` 주석 필수
