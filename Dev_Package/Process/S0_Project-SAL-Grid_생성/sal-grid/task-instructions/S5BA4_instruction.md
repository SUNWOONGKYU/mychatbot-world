# S5BA4: 회원 탈퇴 + 데이터 삭제 API

## Task 정보
- **Task ID**: S5BA4
- **Task Name**: 회원 탈퇴 + 데이터 삭제 API
- **Stage**: S5 (품질 개선)
- **Area**: BA (Backend APIs)
- **Dependencies**: S5S1, S5BA1

## Task 목표

GDPR Right to Erasure(삭제권) 및 개인정보보호법 준수를 위해 회원 탈퇴 및 관련 데이터 삭제 API를 구현한다. 사용자가 요청 시 자신의 모든 데이터를 삭제할 수 있어야 한다.

## 구현 범위

### 1. 탈퇴 API 엔드포인트
- `DELETE /api/user/account` — 회원 탈퇴
- 본인 인증(비밀번호 재확인 또는 OTP)
- Soft delete 우선 (30일 후 hard delete)

### 2. 삭제 대상 데이터
- `profiles` 테이블 — 사용자 프로필
- `chatbots` 테이블 — 생성한 챗봇
- `conversations` 테이블 — 대화 기록
- `messages` 테이블 — 메시지
- Supabase Auth 계정

### 3. 프론트엔드 탈퇴 UI
- 마이페이지 내 "계정 삭제" 섹션
- 경고 메시지 및 확인 절차
- 탈퇴 후 홈으로 리다이렉트

### 4. 데이터 내보내기 (선택)
- 탈퇴 전 데이터 다운로드 옵션 제공 (GDPR 이식성 권리)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/user/account/route.ts` | DELETE 탈퇴 API |
| `app/mypage/settings/page.tsx` 또는 관련 컴포넌트 | 탈퇴 UI |

## 완료 기준

- [ ] 탈퇴 API 엔드포인트 구현
- [ ] 관련 데이터 전체 삭제 처리
- [ ] Supabase Auth 계정 삭제
- [ ] 프론트엔드 탈퇴 UI 존재
- [ ] 탈퇴 후 세션 무효화 및 홈 리다이렉트
