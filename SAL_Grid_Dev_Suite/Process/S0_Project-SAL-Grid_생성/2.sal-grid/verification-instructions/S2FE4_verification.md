# Verification Instruction - S2FE4

---

## 📌 필수 참조 규칙 파일

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S2FE4

## Task Name
Landing 페이지 React 전환

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `Process/S2_개발-1차/Frontend/app/page.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/landing/hero.tsx` 존재
- [ ] `Process/S2_개발-1차/Frontend/components/landing/pricing.tsx` 존재
- [ ] 각 파일 `@task S2FE4` 주석 존재

### 2. 기능 검증
- [ ] 루트 경로(`/`)에 랜딩 페이지 렌더링 확인
- [ ] 히어로 섹션: 메인 카피와 CTA 버튼 존재
- [ ] 로그인 상태에 따른 CTA 버튼 분기 로직 확인
- [ ] 가격표: 3개 플랜이 렌더링됨
- [ ] `metadata` export로 SEO title/description 정의
- [ ] 반응형 breakpoint 적용 (Tailwind responsive classes)

### 3. 통합 검증
- [ ] S1FE1(Next.js 설정)과 App Router 구조 호환
- [ ] `/create`, `/home` 내부 링크 정상 동작
- [ ] TypeScript 타입 오류 없음

### 4. 저장 위치 검증
- [ ] `Process/S2_개발-1차/Frontend/` 에 원본 저장되었는가?
- [ ] git commit 후 루트 폴더로 자동 복사되었는가?

## Test Commands
```bash
# 파일 존재 확인
ls -la Process/S2_개발-1차/Frontend/app/page.tsx
ls -la Process/S2_개발-1차/Frontend/components/landing/

# 타입 검사
npx tsc --noEmit

# 빌드 확인
npm run build
```

## Expected Results
- 빌드 성공, TypeScript 오류 0개
- 랜딩 페이지 루트 경로에서 정상 렌더링
- metadata export 존재

## Verification Agent
code-reviewer-core

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 빌드 에러 없음
- [ ] 통합 테스트 통과
- [ ] Blocker 없음
