# Task Instruction - S4DC1

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
- **DC** = Documentation (문서화)

---

# Task Instruction - S4DC1

## Task ID
S4DC1

## Task Name
사용자 가이드 작성

## Task Goal
일반 사용자가 서비스를 처음 접했을 때부터 핵심 기능을 사용하기까지 필요한 가이드 문서를 작성한다. 시작 가이드, 봇 생성 방법, 대화 사용법, FAQ, 트러블슈팅을 마크다운 형식으로 작성한다.

## Prerequisites (Dependencies)
- S4FE1 — Business 페이지
- S4FE2 — MyPage 페이지
- S4FE3 — Marketplace 페이지

## Specific Instructions

### 1. 시작 가이드 (`docs/user-guide/getting-started.md`)
- 서비스 소개 (한 문단, 핵심 가치 전달)
- 회원가입 절차 (단계별 스크린샷 설명)
- 로그인 방법 (이메일/소셜 로그인)
- 처음 시작 후 해야 할 일 체크리스트
- 기본 용어 설명 (페르소나, 크리에이터, 피상속 등)

### 2. 봇(페르소나) 생성 가이드 (`docs/user-guide/create-bot.md`)
- 페르소나 생성 흐름 (단계별)
  1. 기본 정보 입력 (이름, 소개, 카테고리)
  2. 성격 설정 (감성 슬라이더 사용법)
  3. 마켓플레이스 공개 설정
  4. 저장 및 테스트
- 페르소나 편집 방법
- 마켓플레이스에 등록하는 방법
- 유의사항 (저작권, 콘텐츠 정책)

### 3. 대화 사용 가이드 (`docs/user-guide/chat.md`)
- 대화 시작 방법
- 감성 슬라이더/비용 슬라이더 사용법
- 대화 이력 관리 (저장, 삭제)
- 페르소나 구독 및 사용 방법
- 대화 품질 팁

### 4. FAQ 섹션 (각 가이드 파일 하단 또는 별도 파일)
- 자주 묻는 질문 10개 이상
  - 계정 관련 (비밀번호 재설정, 회원 탈퇴 등)
  - 결제/크레딧 관련
  - 페르소나 관련
  - 피상속 기능 관련

### 5. 트러블슈팅 섹션
- 로그인이 안 될 때
- AI 응답이 느릴 때
- 크레딧이 차감되지 않을 때
- 페르소나가 마켓플레이스에 표시되지 않을 때

## Expected Output Files
- `Process/S4_개발_마무리/Documentation/docs/user-guide/getting-started.md`
- `Process/S4_개발_마무리/Documentation/docs/user-guide/create-bot.md`
- `Process/S4_개발_마무리/Documentation/docs/user-guide/chat.md`

## Completion Criteria
- [ ] 시작 가이드가 단계별로 명확히 작성되어 있다
- [ ] 봇 생성 가이드가 스크린샷 설명을 포함하여 작성되어 있다
- [ ] 대화 사용 가이드가 슬라이더 사용법을 설명한다
- [ ] FAQ가 10개 이상 포함되어 있다
- [ ] 트러블슈팅이 4개 이상 포함되어 있다
- [ ] 모든 문서가 마크다운 형식으로 작성되어 있다

## Tech Stack
- Markdown

## Tools
- 없음 (순수 문서 작성)

## Execution Type
AI-Only

## Remarks
- 문서 대상 독자: 기술 지식 없는 일반 사용자
- 전문 용어 사용 시 반드시 괄호 안에 설명 추가
- 스크린샷은 `[스크린샷: 설명]` 형식의 플레이스홀더로 표시
- Documentation Area는 Production 자동 복사 대상 아님

---

## ⚠️ 작업 결과물 저장 규칙

### Stage + Area 폴더에 저장
- S4DC1 → `Process/S4_개발_마무리/Documentation/`
- Documentation Area는 Production 자동 복사 대상 아님

---

## 📝 파일 명명 규칙
- kebab-case: `getting-started.md`, `create-bot.md`, `chat.md`
