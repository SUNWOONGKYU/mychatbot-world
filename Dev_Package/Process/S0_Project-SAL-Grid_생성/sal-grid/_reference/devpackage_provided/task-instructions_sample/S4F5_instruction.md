# S4F5: 프로젝트 등록 API 연동

## Task 정보
- **Task ID**: S4F5
- **Task Name**: 프로젝트 등록 API 연동
- **Stage**: S4 (개발 3차)
- **Area**: F (Frontend)
- **Level**: 2
- **Dependencies**: S2BA5
- **Task Agent**: `frontend-developer`
- **Verification Agent**: `code-reviewer`

## Task 목표

Production 환경에서 프로젝트 등록 기능이 작동하도록 수정

## 현재 문제

```javascript
// index.html:7560
fetch('http://localhost:3030/create-project', ...)
```

- localhost:3030 (로컬 서버)로 요청 → Production에서 작동 안 함

## 수정 사항

### 1. projects 테이블 확인/생성
- Supabase에 `projects` 테이블 존재 확인
- 없으면 생성

### 2. 프론트엔드 코드 수정
- `localhost:3030/create-project` → `/api/projects/create`
- 인증 토큰 포함 (Authorization 헤더)
- Supabase 세션에서 토큰 가져오기

### 3. 에러 핸들링
- API 오류 시 사용자 안내 메시지
- 네트워크 오류 처리

## 예상 코드

```javascript
// Supabase 세션에서 토큰 가져오기
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
    alert('로그인이 필요합니다.');
    return;
}

const response = await fetch('/api/projects/create', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
        name: name,
        description: description
    })
});
```

## 테스트 시나리오

1. 로그인 후 "새로운 Project 등록" 클릭
2. 프로젝트 이름/설명 입력
3. 등록 버튼 클릭
4. DB에 프로젝트 생성 확인
5. UI에 프로젝트 목록 추가 확인

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `Production/index.html` | API 호출 코드 수정 |
| `S5_개발_마무리/Database/projects_table.sql` (필요시) | 테이블 생성 |

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
