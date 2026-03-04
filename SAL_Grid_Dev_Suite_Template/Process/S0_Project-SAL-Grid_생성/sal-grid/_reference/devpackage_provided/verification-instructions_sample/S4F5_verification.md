# S4F5: 프로젝트 등록 API 연동 - 검증 지침

## 검증 정보
- **Task ID**: S4F5
- **Verification Agent**: code-reviewer

## 검증 항목

### 1. 코드 검증
- [ ] API 엔드포인트가 `/api/projects/create`로 변경됨
- [ ] Authorization 헤더에 Bearer 토큰 포함
- [ ] Supabase 세션에서 토큰 올바르게 가져옴
- [ ] 에러 핸들링 구현됨

### 2. 기능 테스트
- [ ] 로그인 상태에서 프로젝트 등록 성공
- [ ] 비로그인 상태에서 적절한 안내 메시지
- [ ] DB에 프로젝트 레코드 생성 확인
- [ ] UI에 프로젝트 목록 업데이트

### 3. 에러 케이스
- [ ] 네트워크 오류 시 사용자 안내
- [ ] API 오류 시 사용자 안내
- [ ] 중복 프로젝트명 처리

## 검증 방법

1. Production 사이트 접속
2. 로그인
3. "새로운 Project 등록" 클릭
4. 프로젝트 정보 입력 후 등록
5. Supabase projects 테이블 확인

## 통과 기준

- API 호출이 localhost가 아닌 Vercel API로 변경됨
- 프로젝트 등록 성공 (DB 저장 확인)
- 에러 상황에서 적절한 사용자 안내

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/06_verification.md` | 검증 기준 | 핵심 참조 |
