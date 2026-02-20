# Task Instruction - S5T1

---

## 📌 필수 참조 규칙 파일 (2025-12-22)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S5T1

## Task Name
프로덕션 완성도 점검

## Task Goal
프로덕션 환경에서 모든 기능이 정상 작동하는지 종합적으로 점검 (Edge Case, 상태 관리, UX 디테일 포함)

## Prerequisites (Dependencies)
- S5O1 (배포상황 최종 검증) 완료

## Specific Instructions

### 1. 페이지 접근성 점검
- [ ] 모든 페이지 200 응답 확인
- [ ] 404 페이지 없음
- [ ] 리다이렉트 정상 작동
- [ ] 인증 필요 페이지 보호됨

### 2. 링크 및 리소스 점검
- [ ] 내부 링크 모두 작동
- [ ] 외부 링크 모두 작동
- [ ] 이미지 링크 깨짐 없음
- [ ] CSS/JS 리소스 로드 정상

### 3. 폼 동작 점검
- [ ] 회원가입 폼 정상 작동
- [ ] 로그인 폼 정상 작동
- [ ] 비밀번호 재설정 폼 정상 작동
- [ ] 프로필 수정 폼 정상 작동
- [ ] 유효성 검사 메시지 표시

### 4. 에러 처리 점검
- [ ] 네트워크 에러 시 사용자 피드백
- [ ] 인증 실패 시 메시지
- [ ] 폼 에러 시 안내
- [ ] API 에러 시 처리

### 5. 콘솔 에러 점검
- [ ] JavaScript 에러 없음
- [ ] 네트워크 에러 없음
- [ ] CORS 에러 없음
- [ ] 리소스 로드 에러 없음

### 6. 성능 점검
- [ ] 페이지 로딩 시간 (3초 이내)
- [ ] First Contentful Paint
- [ ] Largest Contentful Paint
- [ ] Lighthouse 성능 점수 (70점 이상)
- [ ] 이미지 최적화 상태
- [ ] 번들 사이즈 확인

### 7. ⭐ Edge Case 점검 (유호현 체크리스트)

#### 7.1 네트워크 예외 상황
- [ ] 네트워크 느릴 때 (3G 시뮬레이션) 동작 확인
- [ ] 서버 무응답 시 타임아웃 처리
- [ ] 요청 중 네트워크 끊김 처리

#### 7.2 사용자 행동 예외 상황
- [ ] **다중 클릭 방지**: 버튼 클릭 후 즉시 disabled 처리
- [ ] **동시 수정**: 같은 데이터 동시 수정 시 충돌 처리
- [ ] 뒤로가기 후 재시도 시 정상 동작

### 8. ⭐ 상태 관리 점검 (유호현 체크리스트)

#### 8.1 로딩 상태
- [ ] API 호출 시 로딩 인디케이터 표시
- [ ] 로딩 200ms 이하면 스피너 숨김 (깜빡임 방지)
- [ ] 로딩 중 추가 요청 방지

#### 8.2 에러 상태
- [ ] 에러 발생 시 사용자 친화적 메시지 표시
- [ ] 에러 메시지에 "다시 시도" 옵션 제공
- [ ] 에러 로그 콘솔에 기록

#### 8.3 Empty 상태
- [ ] 데이터 없을 때 "데이터가 없습니다" 메시지
- [ ] Empty 상태에서 CTA 버튼 제공 (예: "첫 번째 항목 추가하기")

### 9. ⭐ UX 디테일 점검 (유호현 체크리스트)

#### 9.1 버튼 상태
- [ ] 폼 제출 중 버튼 disabled + 로딩 표시
- [ ] 필수 입력 미완료 시 제출 버튼 disabled
- [ ] 성공 시 버튼 상태 복원

#### 9.2 피드백 메시지
- [ ] 성공 시 "저장되었습니다" 토스트 메시지
- [ ] 실패 시 구체적 에러 메시지
- [ ] 토스트 메시지 자동 사라짐 (3초)

#### 9.3 입력 필드
- [ ] 입력 중 실시간 유효성 검사
- [ ] 에러 필드 하이라이트 (빨간 테두리)
- [ ] 에러 메시지 필드 하단에 표시

## 점검 대상 URL
- https://www.ssalworks.ai.kr/
- https://www.ssalworks.ai.kr/pages/auth/login.html
- https://www.ssalworks.ai.kr/pages/auth/signup.html
- https://www.ssalworks.ai.kr/pages/auth/reset-password.html
- https://www.ssalworks.ai.kr/pages/mypage/profile.html
- https://www.ssalworks.ai.kr/viewer.html

## Expected Output Files
- `S5_개발_마무리/Testing/S5T1_production_check_report.md`

## Completion Criteria
- [ ] 모든 페이지 접근 가능
- [ ] 콘솔 에러 0개
- [ ] 깨진 링크 0개
- [ ] 폼 정상 작동
- [ ] Edge Case 점검 완료
- [ ] 상태 관리 점검 완료
- [ ] UX 디테일 점검 완료
- [ ] 리포트 작성 완료

## Tech Stack
- Chrome DevTools
- Lighthouse
- Network Throttling (3G 시뮬레이션)

## Task Agent
`test-engineer`

## Verification Agent
`qa-specialist`

## Tools
- browser-mcp
- playwright-mcp
- /test
- Chrome DevTools

## Execution Type
AI-Only

## Remarks
- Edge Case 점검은 실제 프로덕션 품질에 가장 큰 영향
- 유호현 체크리스트 기반으로 점검 항목 확장
- 발견된 이슈는 S5F1, S5BA1에서 수정

---

## ⚠️ 작업 결과물 저장 규칙

- S5T1 → `S5_개발_마무리/Testing/`
