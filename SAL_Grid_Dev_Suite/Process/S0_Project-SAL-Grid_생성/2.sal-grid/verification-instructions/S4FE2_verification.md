# Verification Instruction - S4FE2

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
S4FE2

## Task Name
MyPage 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S4_개발_마무리/Frontend/app/mypage/page.tsx` 존재
- [ ] `Process/S4_개발_마무리/Frontend/app/mypage/inheritance/page.tsx` 존재
- [ ] `Process/S4_개발_마무리/Frontend/app/mypage/inheritance-accept/page.tsx` 존재
- [ ] 각 파일 상단에 `@task S4FE2` 주석 존재

### 2. 데이터 소스 검증 (최우선)
- [ ] 모든 데이터가 API `fetch`로 로드됨 (하드코딩 없음)
- [ ] API 연동: `GET /api/inheritance` 호출 확인
- [ ] API 연동: `GET /api/inheritance/consent` 호출 확인

### 3. 기능 검증 — MyPage 메인
- [ ] 프로필 정보 표시 (아바타, 이름, 이메일)
- [ ] 프로필 편집 폼 저장/취소 동작
- [ ] 피상속 설정 페이지 링크 존재

### 4. 기능 검증 — 피상속 설정 페이지
- [ ] 피상속인 현황 카드 + 상태 뱃지 4종 표시
  - `미지정`(회색), `초대 중`(파랑), `동의 완료`(초록), `거부됨`(빨강)
- [ ] 이메일 유효성 검사 동작
- [ ] 피상속인 지정 해제 버튼 + 확인 모달 존재
- [ ] 페르소나별 허용 토글 목록 표시 및 API 저장

### 5. 기능 검증 — 피상속 수락 페이지
- [ ] 요청 목록 표시
- [ ] 수락/거부 버튼 + 확인 모달 존재
- [ ] `POST /api/inheritance/consent` 호출 확인

### 6. 반응형 검증
- [ ] 모바일 뷰(375px)에서 레이아웃 깨짐 없음

### 7. 통합 검증
- [ ] S4BA3 의존성: 피상속 API 엔드포인트와 일치

### 8. 저장 위치 검증
- [ ] `Process/S4_개발_마무리/Frontend/` 에 저장되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la "Process/S4_개발_마무리/Frontend/app/mypage/"

# API fetch 확인
grep -n "fetch\|inheritance" \
  "Process/S4_개발_마무리/Frontend/app/mypage/inheritance/page.tsx"

# 확인 모달 존재 확인
grep -n "confirm\|modal\|Modal\|Dialog" \
  "Process/S4_개발_마무리/Frontend/app/mypage/inheritance/page.tsx"

# TypeScript 타입 검사
npx tsc --noEmit
```

## Expected Results
- 3개 파일이 모두 존재한다
- 상태 뱃지 4종(회색/파랑/초록/빨강)이 구현되어 있다
- 삭제/수락 전 확인 모달이 존재한다
- 이메일 유효성 검사가 동작한다

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 확인 모달 구현 확인 (민감 액션 보호)
- [ ] 하드코딩 데이터 없음
- [ ] TypeScript 타입 오류 없음
- [ ] Blocker 없음

---

## ⚠️ 저장 위치 검증 항목
- [ ] 코드가 `S4_개발_마무리/Frontend/`에 저장되었는가?
- [ ] git commit 시 `pages/`로 자동 복사될 구조인가?
