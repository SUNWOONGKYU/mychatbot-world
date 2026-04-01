# Verification Instruction - S4DC1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S4DC1

## Task Name
사용자 가이드 작성

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Documentation/docs/user-guide/getting-started.md` 존재
- [ ] `Process/S4_개발_마무리/Documentation/docs/user-guide/create-bot.md` 존재
- [ ] `Process/S4_개발_마무리/Documentation/docs/user-guide/chat.md` 존재

### 2. 시작 가이드 내용 검증 (`getting-started.md`)
- [ ] 서비스 소개 섹션 존재
- [ ] 회원가입 절차 단계별 설명 존재
- [ ] 로그인 방법 설명 존재
- [ ] 처음 시작 체크리스트 존재
- [ ] 기본 용어 설명 존재 (페르소나, 크리에이터 등)

### 3. 봇 생성 가이드 내용 검증 (`create-bot.md`)
- [ ] 페르소나 생성 단계별 절차 존재 (최소 4단계)
- [ ] 감성 슬라이더 사용법 설명 존재
- [ ] 마켓플레이스 등록 방법 존재
- [ ] 콘텐츠 정책/유의사항 섹션 존재

### 4. 대화 가이드 내용 검증 (`chat.md`)
- [ ] 대화 시작 방법 존재
- [ ] 슬라이더 사용법 (감성/비용) 설명 존재
- [ ] 대화 이력 관리 방법 존재

### 5. FAQ 검증
- [ ] FAQ 섹션이 최소 1개 파일 이상에 포함됨
- [ ] FAQ 항목 10개 이상 포함
- [ ] 계정/결제/페르소나/피상속 분류 포함

### 6. 트러블슈팅 검증
- [ ] 트러블슈팅 섹션이 포함됨
- [ ] 4개 이상의 문제 해결 방법 포함

### 7. 문서 품질 검증
- [ ] 마크다운 형식 문법 오류 없음
- [ ] 기술 용어에 괄호 설명 포함
- [ ] 스크린샷 플레이스홀더 형식 사용 (`[스크린샷: ...]`)

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Documentation/docs/user-guide/"

# FAQ 항목 수 확인
grep -c "^###\|^##\|^Q\." \
  "Process/S4_개발_마무리/Documentation/docs/user-guide/getting-started.md"

# 마크다운 헤딩 구조 확인
grep -n "^#" "Process/S4_개발_마무리/Documentation/docs/user-guide/chat.md"
```

## Expected Results
- 3개 파일이 모두 존재한다
- FAQ가 10개 이상 포함된다
- 트러블슈팅이 4개 이상 포함된다
- 마크다운 문법이 올바르다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] FAQ 10개 이상 확인
- [ ] 트러블슈팅 4개 이상 확인
- [ ] 마크다운 문법 오류 없음
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 문서가 `S4_개발_마무리/Documentation/`에 저장되었는가?
- [ ] Documentation Area는 Production 자동 복사 대상이 아님을 확인
