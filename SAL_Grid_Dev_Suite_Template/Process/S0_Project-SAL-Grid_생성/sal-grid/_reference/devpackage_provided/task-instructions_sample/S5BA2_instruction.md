# S5BA2: 예시 프로젝트 서약서 시스템

## Task 정보
- **Task ID**: S5BA2
- **Task Name**: 예시 프로젝트 서약서 시스템
- **Stage**: S5 (개발 마무리)
- **Area**: BA (Backend APIs)
- **Dependencies**: 없음

## Task 목표

SSAL Works 예시 프로젝트 열람 및 복사 전 서약서 동의 시스템 구현.
무단 배포 방지 및 사용 조건 동의를 받고 기록 보관.

## 구현 내용

### 1. 서약서 모달 UI
- 도입 문구: "본인은 SSAL Works 예시 프로젝트의 문서 및 소스 코드 파일을 제공받음에 있어서 아래의 사항을 준수하기로 서약합니다."
- 서약 내용 3개항
- 서약자 정보 자동 표시 (일자, 서약자, 빌더 계정 ID, 이메일)
- 버튼: [위와 같이 서약합니다] / [다음에 하기]

### 2. 서약 내용
1. 제공받은 파일은 본인의 프로젝트 개발을 위한 참고자료로만 활용할 것이며, 타인(배우자 및 직계존비속 포함)에게는 제공하지 않을 것입니다.
2. 제공받은 파일은 SSAL Works 프로젝트와 유사한 프로젝트를 개발하는데 사용하지 않을 것입니다.
3. 제공받은 파일은 Sunny가 500시간 이상의 시간을 투입하여 만든 것으로서, 이것을 활용하여 세상에 도움이 되는 서비스를 효율적으로 신속하게 만들어서 사업화 할 것입니다.

### 3. 1회 연결 제한
- DB에서 연결 이력 확인
- 이미 연결한 경우: "이미 연결하셨습니다. 연결 기회는 1회만 제공됩니다."

### 4. 이메일 발송
- 서약 완료 시 서약서 사본을 사용자 이메일로 발송
- Resend API 사용

### 5. DB 저장
- download_agreements 테이블에 서약 기록 저장
- 필드: user_id, user_email, user_name, builder_account_id, resource_type, agreed_at

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | 서약서 모달 UI, JavaScript 함수 추가 |
| `S5_개발_마무리/Backend_APIs/send-agreement-email.js` | 서약서 이메일 발송 API (Stage) |
| `api/Backend_APIs/send-agreement-email.js` | 서약서 이메일 발송 API (Production) |
| `S5_개발_마무리/Database/30_download_agreements.sql` | DB 테이블 생성 SQL |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
