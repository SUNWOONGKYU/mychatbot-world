# S5FE10: 빌드 + 배포 + 크로스브라우저 QA — 검증 지침

## 검증 정보
- **Task ID**: S5FE10
- **Verification Agent**: code-reviewer-core
- **검증 유형**: 빌드/배포/QA 종합 검증

## 검증 항목

### 1. 빌드 검증
- [ ] `next build` 성공 (에러 0)
- [ ] TypeScript 타입 체크 통과
- [ ] ESLint 통과 (중요 오류 없음)

### 2. Vercel 배포
- [ ] Vercel 스테이징 배포 성공
- [ ] Vercel 프로덕션 배포 성공
- [ ] 환경변수 설정 확인 (NEXT_PUBLIC_SUPABASE_URL 등)

### 3. 크로스브라우저 QA (4개 브라우저)
- [ ] Chrome: 네비게이션/다크모드/카드 정상
- [ ] Safari: 네비게이션/다크모드/카드 정상
- [ ] Firefox: 네비게이션/다크모드/카드 정상
- [ ] Edge: 네비게이션/다크모드/카드 정상

### 4. 4대 메뉴 QA
- [ ] Birth/Skills/Jobs/Community 4개 메뉴 정상 접근
- [ ] Learning 메뉴 링크가 제거되었는가?
- [ ] 마이페이지 챗봇학습 탭으로 정상 연결

### 5. 마이페이지 8탭 QA
- [ ] 탭1~4 (S5FE6) 모두 정상 작동
- [ ] 탭 간 전환이 매끄럽게 동작하는가?

### 6. 관리자 대시보드 8섹션 QA
- [ ] 섹션1~4 (S5FE7) 모두 정상 작동
- [ ] 섹션5~8 (S5FE8) 모두 정상 작동
- [ ] 미처리 건수 배지가 정상 표시되는가?

### 7. 반응형 QA (3 뷰포트)
- [ ] 375px(모바일): 하단 4탭바 표시, 사이드바 숨김
- [ ] 768px(태블릿): 아이콘 사이드바 표시
- [ ] 1280px(데스크탑): 전체 사이드바 표시

### 8. 성능
- [ ] Lighthouse Performance 80+
- [ ] Lighthouse Accessibility 90+

## 완료 기준

빌드 성공 + Vercel 배포 성공 + 4개 브라우저 × 3 뷰포트 QA 통과 + Lighthouse 기준 충족 시 Verified.
