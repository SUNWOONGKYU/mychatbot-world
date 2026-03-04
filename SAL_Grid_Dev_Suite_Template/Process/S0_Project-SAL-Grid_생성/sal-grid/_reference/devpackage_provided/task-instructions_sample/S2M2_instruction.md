# Task Instruction - S2M2

---

## 필수 참조 규칙 파일

> **작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S2M2

## Task Name
프로젝트 등록 프로세스 문서화

## Task Goal
프로젝트 등록 프로세스를 Documentation Area에 문서화하고, 관련 안내문 및 서약서를 이중 저장

## Prerequisites (Dependencies)
- 없음 (독립 Task)

## Specific Instructions

### 1. 프로젝트 등록 프로세스 문서 작성

**저장 위치:** `S2_개발-1차/Documentation/Project_Registration_Process.md`

**문서 구조:**
```markdown
# 프로젝트 등록 프로세스

## 1. 개요
- 프로젝트 등록이란?
- 대상 사용자

## 2. 등록 전 조건
- 빌더 계정 개설 필요
- 진행 중인 프로젝트 없음

## 3. 등록 프로세스 흐름
### Step 1: 개발 패키지 다운로드
### Step 2: 개발 도구 설치
### Step 3: Claude Code로 개발 시작

## 4. 서약서 동의 절차
- 서약서 표시 시점
- 동의 후 처리 로직
- DB 저장 필드

## 5. 권한 부여 로직
- 서약 완료 시 접근 권한
- 예시 프로젝트 열람 권한

## 6. 관련 파일
- 안내문: Project_Registration.md
- 서약서: Pledge_Agreement.md
```

### 2. 안내문 이중 저장

**원본 위치:** `Briefings_OrderSheets/Briefings/Situational/Project_Registration.md`
**복사 위치:** `S2_개발-1차/Documentation/Guides/Project_Registration.md`

### 3. 서약서 이중 저장

**원본 위치:** `Briefings_OrderSheets/Briefings/Situational/Pledge_Agreement.md`
**복사 위치:** `S2_개발-1차/Documentation/Guides/Pledge_Agreement.md`

### 4. 문서 내용 요구사항

- 프로세스 각 단계별 상세 설명
- 사용자 관점의 흐름도
- 시스템 관점의 처리 로직
- 관련 DB 테이블/필드 설명
- 에러 처리 및 예외 상황

## Expected Output Files

| 파일 | 위치 | 설명 |
|------|------|------|
| `Project_Registration_Process.md` | `S2_개발-1차/Documentation/` | 프로세스 문서 |
| `Project_Registration.md` | `S2_개발-1차/Documentation/Guides/` | 안내문 복사본 |
| `Pledge_Agreement.md` | `S2_개발-1차/Documentation/Guides/` | 서약서 복사본 |

## Completion Criteria

- [ ] 프로젝트 등록 프로세스 문서 작성 완료
- [ ] 프로세스 각 단계 상세 설명 포함
- [ ] 서약서 동의 절차 문서화
- [ ] 권한 부여 로직 문서화
- [ ] 안내문 Documentation에 복사
- [ ] 서약서 Documentation에 복사
- [ ] Markdown 형식 검증

## Tech Stack
- Markdown

## Task Agent
`documentation-specialist`

## Verification Agent
`code-reviewer`

## Tools
- Read, Write
- Copy

## Execution Type
AI-Only

## Remarks
- 안내문/서약서는 Briefings 폴더가 원본, Documentation은 참조용 복사본
- 원본 수정 시 복사본도 함께 업데이트 필요

---

## 작업 결과물 저장 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- S2M2 → `S2_개발-1차/Documentation/`

### 제2 규칙: Documentation은 Stage 폴더에만 저장
- Documentation Area는 Production 폴더 복사 불필요
- Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation
