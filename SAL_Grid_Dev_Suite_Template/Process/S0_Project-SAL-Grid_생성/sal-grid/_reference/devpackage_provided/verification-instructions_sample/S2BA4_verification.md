# Verification Instruction - S2BA4

## Task ID
S2BA4

## Task Name
회원가입 API

## Verification Agent
code-reviewer

## Verification Criteria

### 1. API 엔드포인트 확인
- [ ] POST /api/auth/signup 존재
- [ ] 요청 바디: email, password 필수
- [ ] 응답: 성공/실패 JSON

### 2. 입력 검증
- [ ] 이메일 형식 검증
- [ ] 비밀번호 최소 길이 (8자)
- [ ] 비밀번호 복잡성 (권장)
- [ ] 중복 이메일 검사

### 3. Supabase Auth 연동
- [ ] supabase.auth.signUp() 호출
- [ ] 사용자 메타데이터 저장
- [ ] users 테이블 연동 (trigger 또는 직접)

### 4. 에러 처리
- [ ] 중복 이메일: 409 Conflict
- [ ] 잘못된 입력: 400 Bad Request
- [ ] 서버 에러: 500 Internal Server Error

### 5. 보안 검증
- [ ] Rate Limiting 적용 (회원가입 시도 제한)
- [ ] 비밀번호 해싱 (Supabase 자동)
- [ ] 민감 정보 로깅 금지

## Test Commands
```bash
# 정상 회원가입 테스트
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 중복 이메일 테스트
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com","password":"password123"}'
```

## Build Verification
- [ ] API 파일 문법 오류 없음
- [ ] Supabase 클라이언트 초기화 정상
- [ ] 환경변수 참조 정상

## Integration Verification
- [ ] S1S1 Supabase Auth 설정과 연동
- [ ] S2F3 회원가입 UI와 연동
- [ ] S2BA2 환영 이메일 발송 트리거

## Expected Files
- Production/Backend_APIs/api/auth/signup.js
- S2_개발-1차/Backend_APIs/api/auth/signup.js

## Notes
- 이메일 인증 활성화 여부는 Supabase 설정에 따름
- 회원가입 후 자동 로그인 또는 이메일 인증 대기
