# Verification Instruction - S4M1

---

## Task ID
S4M1

## Task Name
관리자 가이드

## Verification Agent
code-reviewer

## Verification Criteria

### 1. 문서 존재 확인
- [ ] ADMIN_DASHBOARD_GUIDE.md 존재
- [ ] 목차 및 구조 완성

### 2. 대시보드 접근 방법 섹션
- [ ] 로그인 URL
- [ ] 관리자 계정 정보 (또는 생성 방법)
- [ ] 권한 요구사항

### 3. 기능별 사용법 섹션
- [ ] 사용자 관리 가이드
- [ ] 구독 관리 가이드
- [ ] 결제 확인/승인 가이드
- [ ] 통계 대시보드 가이드
- [ ] 콘텐츠 관리 가이드

### 4. 사용자 관리 가이드 검증
- [ ] 사용자 목록 조회 방법
- [ ] 사용자 상세 정보 확인 방법
- [ ] 사용자 역할 변경 방법
- [ ] 사용자 비활성화 방법

### 5. 구독/결제 관리 가이드 검증
- [ ] 구독 상태 확인 방법
- [ ] 수동 구독 활성화 방법
- [ ] 설치비 입금 확인 방법
- [ ] 환불 처리 방법

### 6. 트러블슈팅 섹션
- [ ] 자주 발생하는 문제 및 해결법
- [ ] 에러 로그 확인 방법
- [ ] 지원 연락처

## Test Commands
```bash
# 문서 존재 확인
ls -la S4_개발-3차/Documentation/ADMIN_DASHBOARD_GUIDE.md

# 목차 확인
grep -E "^#" S4_개발-3차/Documentation/ADMIN_DASHBOARD_GUIDE.md
```

## Build Verification
- [ ] 마크다운 문법 오류 없음
- [ ] 링크 유효성 확인
- [ ] 이미지/스크린샷 경로 유효

## Integration Verification
- [ ] S4F1 관리자 대시보드 UI와 일치
- [ ] 실제 기능과 가이드 내용 일치

## Expected Files
- S4_개발-3차/Documentation/ADMIN_DASHBOARD_GUIDE.md

## Pass Criteria
- 모든 관리자 기능 문서화
- 스크린샷/예시 포함
- 신규 관리자가 이해할 수 있는 수준

---

## 저장 위치 검증 항목
- [ ] S4_개발-3차/Documentation/ 폴더에 저장되었는가?
