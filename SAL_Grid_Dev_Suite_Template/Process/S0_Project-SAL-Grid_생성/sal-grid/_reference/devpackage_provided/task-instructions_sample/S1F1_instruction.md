# Task Instruction - S1F1

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S1F1

## Task Name
Vercel 프로젝트 설정

## Task Goal
SSALWorks 프로덕션 배포를 위한 Vercel 프로젝트 생성 및 GitHub 저장소 연결

## Prerequisites (Dependencies)
- 없음 (독립 Task)
- GitHub 저장소 존재 확인 필요

## Specific Instructions

### 1. Vercel 프로젝트 생성
- Vercel Dashboard (https://vercel.com) 접속
- "New Project" 클릭
- GitHub 저장소 `SUNWOONGKYU/SSALWorks` 선택
- 프로젝트명: `ssalworks`

### 2. 프레임워크 설정
- Framework Preset: `Other` (순수 HTML/JS)
- Build Command: (비워두기 또는 `echo "No build needed"`)
- Output Directory: `P3_프로토타입_제작/Frontend/Prototype`
- Install Command: `npm install` (필요시)

### 3. Root Directory 설정
- Root Directory: `P3_프로토타입_제작/Frontend/Prototype`

### 4. Git 연결 확인
- Production Branch: `master`
- Auto-deploy on push: 활성화

### 5. 초기 배포 테스트
- 수동 배포 트리거
- 배포 URL 확인
- 기본 페이지 접속 테스트

## Expected Output Files
- Vercel 프로젝트 생성 완료 (Vercel Dashboard에서 확인)
- 배포 URL 기록 (예: `ssalworks.vercel.app`)

## Completion Criteria
- [ ] Vercel 프로젝트 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] 프레임워크 설정 완료
- [ ] 초기 배포 성공
- [ ] 배포 URL 접속 가능

## Tech Stack
- Vercel
- GitHub

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- WebFetch (Vercel Dashboard 확인)
- Bash (gh CLI 사용 가능시)

## Execution Type
Human-AI (Vercel Dashboard 접속 필요)

## Remarks
- Vercel 계정 로그인 필요 (Human 개입)
- 배포 URL은 S5O2에서 커스텀 도메인 연결 예정
- 환경변수는 S1BI1에서 설정

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content

