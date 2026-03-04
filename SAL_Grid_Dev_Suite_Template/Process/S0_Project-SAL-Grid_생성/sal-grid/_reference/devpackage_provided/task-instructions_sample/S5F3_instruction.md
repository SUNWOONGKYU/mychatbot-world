# S5F3: 단일 파일 비대화 해결 (코드 분할)

## Task 정보
- **Task ID**: S5F3
- **Task Name**: 단일 파일 비대화 해결 (코드 분할)
- **Stage**: S5 (개발 마무리)
- **Area**: F (Frontend)
- **Dependencies**: S5F1 (버그 수정 완료 후 리팩토링)

## Task 목표

index.html (732KB), admin-dashboard.html (315KB) 등 비대화된 단일 파일을 분할하여:
1. 초기 로딩 성능 개선
2. 코드 유지보수성 향상
3. 캐싱 효율성 증대

## 작업 방식 (핵심)

> **⚠️ 단계별 작업 + 단계별 테스트 방식으로 진행**
>
> 각 Phase 완료 후 반드시 테스트하여 성공 확인 후 다음 Phase로 진행

---

## Phase 1: 분석

### 작업 내용
- [ ] index.html 구조 분석 (JS/CSS 블록 식별)
- [ ] admin-dashboard.html 구조 분석
- [ ] 분리 가능한 모듈 식별 (공통 로직, 인증, UI 컴포넌트)
- [ ] 의존성 순서 파악

### 테스트
- [ ] 분석 결과 문서 생성 확인

### 산출물
- 분석 결과 문서 (코드 블록별 크기, 의존성 맵)

---

## Phase 2: 공통 CSS 분리

### 작업 내용
- [ ] `<style>` 태그 내용을 `assets/css/main.css`로 추출
- [ ] index.html에서 `<link rel="stylesheet" href="assets/css/main.css">` 참조로 변경
- [ ] 페이지별 고유 CSS는 인라인 유지 또는 별도 파일로 분리

### 테스트
- [ ] 페이지 스타일 정상 적용 확인
- [ ] 모든 컴포넌트 레이아웃 정상 확인
- [ ] 반응형 동작 확인

### 산출물
- `assets/css/main.css`

---

## Phase 3: 공통 JS 분리 (Supabase, 인증)

### 작업 내용
- [ ] Supabase 클라이언트 초기화 → `assets/js/supabase-init.js`
- [ ] 인증 관련 함수 → `assets/js/auth.js`
- [ ] 공통 유틸리티 함수 → `assets/js/common.js`
- [ ] 스크립트 로딩 순서 설정 (의존성 고려)

### 테스트
- [ ] Supabase 연결 정상 확인
- [ ] 로그인/로그아웃 정상 동작 확인
- [ ] 사용자 세션 유지 확인
- [ ] 콘솔 에러 없음 확인

### 산출물
- `assets/js/supabase-init.js`
- `assets/js/auth.js`
- `assets/js/common.js`

---

## Phase 4: UI 컴포넌트 JS 분리

### 작업 내용
- [ ] 사이드바 관련 → `assets/js/sidebar.js`
- [ ] 모달 관련 → `assets/js/modal.js`
- [ ] 토스트/알림 → `assets/js/toast.js`
- [ ] 네비게이션 → `assets/js/navigation.js`

### 테스트
- [ ] 사이드바 열기/닫기 정상 동작
- [ ] 모달 열기/닫기 정상 동작
- [ ] 토스트 알림 표시 정상
- [ ] 페이지 네비게이션 정상

### 산출물
- `assets/js/sidebar.js`
- `assets/js/modal.js`
- `assets/js/toast.js`
- `assets/js/navigation.js`

---

## Phase 5: index.html 최소화

### 작업 내용
- [ ] 페이지 구조 (HTML)만 남기고 외부 스크립트 참조
- [ ] 페이지 고유 로직만 인라인 또는 `assets/js/index-page.js`로 분리
- [ ] 스크립트 로딩 순서 최적화 (defer/async 적용)

### 테스트
- [ ] 전체 기능 정상 동작 확인 (체크리스트)
  - [ ] 메인 페이지 로딩
  - [ ] 로그인/로그아웃
  - [ ] 사이드바 기능
  - [ ] 프로젝트 목록
  - [ ] 모달 기능
  - [ ] AI Q&A 접근
- [ ] 콘솔 에러 없음 확인
- [ ] 네트워크 탭에서 파일 로딩 확인

### 산출물
- 최적화된 `index.html`
- `assets/js/index-page.js` (필요시)

---

## Phase 6: admin-dashboard.html 동일 적용

### 작업 내용
- [ ] 공통 JS/CSS 재사용 (Phase 2-4 산출물)
- [ ] 관리자 전용 로직 → `assets/js/admin.js`
- [ ] 관리자 전용 스타일 → `assets/css/admin.css` (필요시)

### 테스트
- [ ] 관리자 대시보드 로딩 확인
- [ ] 통계 표시 정상
- [ ] 사용자 관리 기능 정상
- [ ] 구독 승인 기능 정상
- [ ] 입금 확인 기능 정상

### 산출물
- 최적화된 `admin-dashboard.html`
- `assets/js/admin.js`

---

## Phase 7: 최종 검증 및 완료

### 작업 내용
- [ ] 파일 크기 비교 (Before/After)
- [ ] 로딩 속도 측정 (Chrome DevTools)
- [ ] 모든 페이지 기능 최종 점검
- [ ] Task 상태 업데이트 (Completed)
- [ ] 작업 로그 최종 기록

### 테스트
- [ ] 파일 크기 감소 확인 (목표: index.html 732KB → ~100KB)
- [ ] 초기 로딩 속도 개선 확인
- [ ] 캐싱 동작 확인 (반복 방문 시)

### 산출물
- 최종 검증 리포트
- 파일 크기 비교표

---

## 생성/수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | 코드 분할, 외부 스크립트 참조 |
| `admin-dashboard.html` | 코드 분할, 외부 스크립트 참조 |
| `assets/css/main.css` | 공통 CSS (신규) |
| `assets/js/supabase-init.js` | Supabase 초기화 (신규) |
| `assets/js/auth.js` | 인증 로직 (신규) |
| `assets/js/common.js` | 공통 유틸리티 (신규) |
| `assets/js/sidebar.js` | 사이드바 (신규) |
| `assets/js/modal.js` | 모달 (신규) |
| `assets/js/toast.js` | 토스트 알림 (신규) |
| `assets/js/navigation.js` | 네비게이션 (신규) |
| `assets/js/admin.js` | 관리자 전용 (신규) |

---

## 롤백 계획

각 Phase에서 테스트 실패 시:
1. 해당 Phase 변경사항 되돌리기 (`git checkout -- 파일명`)
2. 문제 원인 분석
3. 수정 후 재시도

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일명 규칙 | 새 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
| `.claude/rules/06_verification.md` | 검증 기준 | 각 Phase 테스트 시 |

---

## 예상 소요 시간

| Phase | 예상 시간 |
|-------|----------|
| Phase 1 (분석) | 30분 |
| Phase 2 (CSS 분리) | 1시간 |
| Phase 3 (공통 JS) | 1시간 |
| Phase 4 (UI JS) | 1시간 |
| Phase 5 (index.html) | 1시간 |
| Phase 6 (admin) | 30분 |
| Phase 7 (검증) | 30분 |
| **총계** | **5-6시간** |

---

**문서 끝**
