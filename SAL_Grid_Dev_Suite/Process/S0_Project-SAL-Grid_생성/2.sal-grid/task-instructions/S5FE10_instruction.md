# S5FE10: 빌드 + 배포 + 크로스브라우저 QA

## Task 정보
- **Task ID**: S5FE10
- **Task Name**: 빌드 + 배포 + 크로스브라우저 QA
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5FE3, S5FE4, S5FE6, S5FE7, S5FE8, S5FE9

## Task 목표

S5FE3~S5FE9 전체 리디자인 Task 완료 후 Next.js 빌드 성공 확인, Vercel 프로덕션 배포, 크로스브라우저(Chrome/Safari/Firefox/Edge) 및 3가지 뷰포트(모바일/태블릿/데스크탑) QA를 수행한다.

## 구현 항목

1. **빌드 검증**:
   - `next build` 성공 (에러/경고 0)
   - TypeScript 타입 체크 통과
   - ESLint 통과

2. **Vercel 배포**:
   - 스테이징 배포 → 프로덕션 배포
   - 환경변수 확인 (NEXT_PUBLIC_SUPABASE_URL 등)
   - 빌드 로그 확인

3. **크로스브라우저 QA**:
   - Chrome / Safari / Firefox / Edge 각각 주요 페이지 확인
   - 네비게이션 (사이드바, 하단 탭바, 상단 GNB) 동작
   - 다크/라이트 모드 전환
   - 4대 메뉴 페이지 정상 접근 확인

4. **반응형 QA (3 뷰포트)**:
   - 375px (모바일): 하단 탭바, 상단 헤더 확인
   - 768px (태블릿): 아이콘 사이드바 확인
   - 1280px (데스크탑): 전체 사이드바 확인
   - 주요 페이지 (랜딩, 마이페이지, 관리자, 4대 메뉴) 각 뷰포트 확인

5. **성능 확인**:
   - Lighthouse 점수 (Performance 80+, Accessibility 90+)
   - Core Web Vitals (LCP, FID, CLS)

6. **마이페이지 8탭 QA**:
   - 탭1~4 (S5FE6) 정상 작동 확인
   - 탭5~8 (S5FE5 — 별도 작업 예정) 플레이스홀더 확인

7. **관리자 대시보드 8섹션 QA**:
   - 섹션1~4 (S5FE7), 섹션5~8 (S5FE8) 정상 작동 확인

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `docs/qa/s5-design-qa-report.md` | 크로스브라우저 + 반응형 QA 리포트 |
| `docs/qa/s5-performance-report.md` | 빌드/성능 측정 결과 |
