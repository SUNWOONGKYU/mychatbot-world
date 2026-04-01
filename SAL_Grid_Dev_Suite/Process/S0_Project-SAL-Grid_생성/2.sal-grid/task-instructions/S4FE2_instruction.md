# Task Instruction - S4FE2

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
- **FE** = Frontend (프론트엔드)

---

# Task Instruction - S4FE2

## Task ID
S4FE2

## Task Name
MyPage 페이지 React 전환

## Task Goal
기존 MyPage를 Next.js App Router 기반 React 컴포넌트로 전환한다. 프로필 관리, 피상속 설정, 피상속인 지정/동의, 피상속 수락 페이지를 구현하며 S4BA3 API와 연동한다.

## Prerequisites (Dependencies)
- S1FE1 — Next.js App Router 기반 레이아웃/공통 컴포넌트
- S4BA3 — 피상속 API (피상속인 지정, 동의, 전환)

## Specific Instructions

### 1. MyPage 메인 페이지 (`app/mypage/page.tsx`)
- 프로필 정보 (아바타, 이름, 이메일, 가입일)
- 프로필 편집 폼 (이름, 소개, 프로필 이미지 업로드)
- 계정 설정 섹션 (알림 설정, 언어 설정)
- 피상속 설정 섹션 링크 카드
- 구독 관리 링크 카드

### 2. 피상속 설정 페이지 (`app/mypage/inheritance/page.tsx`)
- 피상속인 현황 카드 (지정된 피상속인 이름, 상태 뱃지)
  - 상태: `미지정`(회색) / `초대 중`(파랑) / `동의 완료`(초록) / `거부됨`(빨강)
- 피상속인 지정 폼 (이메일 입력, 개인 메시지)
- 피상속인 지정 해제 버튼 (확인 모달 포함)
- 페르소나별 피상속 허용 토글 목록
  - 각 페르소나 카드에 `허용/불허` 토글
- `GET/POST/DELETE /api/inheritance` + `PATCH /api/inheritance` 연동

### 3. 피상속 수락 페이지 (`app/mypage/inheritance-accept/page.tsx`)
- 나에게 온 피상속 동의 요청 목록
  - 요청자 이름, 페르소나 수, 요청일
- 수락/거부 버튼 (확인 모달 포함)
- 수락 시 안내 메시지 (권한 범위 설명)
- `GET /api/inheritance/consent` + `POST /api/inheritance/consent` 연동

### 4. 파일 상단 Task ID 주석 필수
```typescript
/**
 * @task S4FE2
 * @description MyPage — 프로필 관리, 피상속 설정, 피상속 수락
 */
```

## Expected Output Files
- `Process/S4_개발_마무리/Frontend/app/mypage/page.tsx`
- `Process/S4_개발_마무리/Frontend/app/mypage/inheritance/page.tsx`
- `Process/S4_개발_마무리/Frontend/app/mypage/inheritance-accept/page.tsx`

## Completion Criteria
- [ ] 프로필 편집 폼이 저장/취소 기능과 함께 동작한다
- [ ] 피상속인 지정 폼이 이메일 유효성 검사를 수행한다
- [ ] 피상속인 상태 뱃지가 올바른 색상으로 표시된다
- [ ] 페르소나별 피상속 허용 토글이 API를 호출하여 저장된다
- [ ] 피상속 수락/거부가 확인 모달 후 처리된다
- [ ] TypeScript 타입 오류 없음
- [ ] 모바일 반응형 레이아웃 적용

## Tech Stack
- TypeScript, Next.js App Router, React
- Tailwind CSS
- shadcn/ui 또는 동등한 UI 라이브러리

## Tools
- npm (빌드/타입 검사)

## Execution Type
AI-Only

## Remarks
- 피상속 기능은 민감한 기능이므로 삭제/수락 전 확인 모달 필수
- 이메일 입력 시 실시간 유효성 검사 적용
- 저장 후 git commit 시 Pre-commit Hook이 루트 폴더로 자동 복사

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S4FE2 → `Process/S4_개발_마무리/Frontend/`

### 제2 규칙: Production 코드 이중 저장
- Stage 폴더 저장 후 git commit → Pre-commit Hook 자동 복사 → `pages/`

---

## 📝 파일 명명 규칙
- Next.js App Router 규칙 준수: `page.tsx`
- 파일 상단 `@task S4FE2` 주석 필수
