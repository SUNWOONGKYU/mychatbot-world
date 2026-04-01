# Verification Instruction - S4FE3

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
S4FE3

## Task Name
Marketplace 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Frontend/app/marketplace/page.tsx` 존재
- [ ] `Process/S4_개발_마무리/Frontend/app/marketplace/[id]/page.tsx` 존재
- [ ] `Process/S4_개발_마무리/Frontend/app/marketplace/upload/page.tsx` 존재
- [ ] 각 파일 상단에 `@task S4FE3` 주석 존재

### 2. 데이터 소스 검증 (최우선)
- [ ] 모든 데이터가 API `fetch`로 로드됨 (하드코딩 배열 없음)
- [ ] `GET /api/marketplace` 호출 확인 (목록)
- [ ] `GET /api/marketplace/:id` 호출 확인 (상세)
- [ ] `POST /api/marketplace` 호출 확인 (업로드)

### 3. 기능 검증 — 목록 페이지
- [ ] 카드 그리드 레이아웃 구현 (반응형 3열 → 1열)
- [ ] 카테고리 필터 탭 동작
- [ ] 검색 입력창 동작
- [ ] 정렬 드롭다운 동작
- [ ] 무한 스크롤 또는 페이지네이션 구현

### 4. 기능 검증 — 상세 페이지
- [ ] 아바타, 이름, 크리에이터, 카테고리 표시
- [ ] 구독 플랜 카드 표시 (가격 포함)
- [ ] 구독하기 버튼 표시

### 5. 기능 검증 — 업로드 페이지
- [ ] 페르소나 선택 드롭다운
- [ ] 카테고리, 소개, 설명 입력 폼
- [ ] 미리보기 패널 실시간 반영
- [ ] 게시하기/저장하기 버튼

### 6. 반응형 검증
- [ ] 모바일 뷰(375px)에서 카드가 1열로 표시됨

### 7. 통합 검증
- [ ] S4BA4 의존성: Marketplace API 엔드포인트와 일치

### 8. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Frontend/` 에 저장되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Frontend/app/marketplace/"

# 하드코딩 데이터 없음 확인
grep -n "const.*persona.*=.*\[" \
  "Process/S4_개발_마무리/Frontend/app/marketplace/page.tsx"

# API fetch 확인
grep -n "fetch\|marketplace" \
  "Process/S4_개발_마무리/Frontend/app/marketplace/page.tsx"

# 미리보기 반응형 확인
grep -n "preview\|Preview" \
  "Process/S4_개발_마무리/Frontend/app/marketplace/upload/page.tsx"

# TypeScript 타입 검사
npx tsc --noEmit
```

## Expected Results
- 3개 파일이 모두 존재한다
- 목록 페이지가 API에서 데이터를 로드한다
- 카테고리 필터와 검색이 구현된다
- 업로드 페이지에 미리보기가 존재한다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 하드코딩 데이터 없음
- [ ] 미리보기 패널 구현 확인
- [ ] TypeScript 타입 오류 없음
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Frontend/`에 저장되었는가?
- [ ] git commit 시 `pages/`로 자동 복사될 구조인가?
