# Task Instruction - S3E1

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
S3E1

## Task Name
AI API 키 설정

## Task Goal
Gemini, ChatGPT, Perplexity API 키 등록 및 Vercel 환경 변수 설정

## Prerequisites (Dependencies)
- S1BI1 (환경변수 설정) 완료

## Specific Instructions

### 1. API 키 발급

#### 1-1. Google Gemini API 키
- Google AI Studio: https://aistudio.google.com/
- API Keys 메뉴에서 새 키 생성

#### 1-2. OpenAI ChatGPT API 키
- OpenAI Platform: https://platform.openai.com/
- API Keys에서 새 키 생성

#### 1-3. Perplexity API 키
- Perplexity API: https://www.perplexity.ai/settings/api
- API Keys에서 새 키 생성

### 2. Vercel 환경 변수 설정
- Vercel 대시보드 > Settings > Environment Variables
- GEMINI_API_KEY, OPENAI_API_KEY, PERPLEXITY_API_KEY 등록

### 3. 환경 변수 목록
- GEMINI_API_KEY=AIzaSy...
- OPENAI_API_KEY=sk-proj-...
- PERPLEXITY_API_KEY=pplx-...

## Expected Output Files
- .env.local (로컬 개발용)
- scripts/verify-ai-keys.js
- Vercel 환경 변수 설정 완료

## Completion Criteria
- [ ] Gemini API 키 발급 및 등록
- [ ] ChatGPT (OpenAI) API 키 발급 및 등록
- [ ] Perplexity API 키 발급 및 등록
- [ ] Vercel 환경 변수 등록 (3개)
- [ ] API 키 검증 스크립트 실행 성공

## Tech Stack
- Google Gemini API
- OpenAI ChatGPT API
- Perplexity API
- Vercel
- Node.js

## Task Agent
`external-integration-specialist`

## Verification Agent
`code-reviewer`

## Execution Type
Human-Assisted

## Remarks
- API 키는 절대 코드에 직접 입력하지 않음
- 각 서비스 콘솔에서 사용량 모니터링
