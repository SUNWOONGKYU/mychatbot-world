# Verification Instruction - S4S1

---

## Task ID
S4S1

## Task Name
관리자 권한 체크

## Verification Agent
security-auditor

## Verification Criteria

### 1. 파일 존재 확인
- [ ] api/lib/admin-auth.js 존재
- [ ] api/middleware/withAdmin.js 존재

### 2. 관리자 권한 미들웨어 검증
- [ ] withAdmin 함수 존재
- [ ] JWT 토큰 검증
- [ ] 사용자 역할(role) 확인
- [ ] 인증 실패 시 401 응답
- [ ] 권한 없음 시 403 응답

### 3. 권한 체크 로직 검증
- [ ] users 테이블 role 컬럼 확인
- [ ] is_admin 플래그 또는 role='admin' 확인
- [ ] 관리자 판별 로직 정확

### 4. 관리자 전용 라우트 보호
- [ ] /api/admin/* 라우트 보호
- [ ] 관리자 대시보드 API 보호
- [ ] 사용자 관리 API 보호

### 5. 보안 테스트
- [ ] 일반 사용자로 관리자 API 접근 시 403 반환
- [ ] 토큰 없이 접근 시 401 반환
- [ ] 관리자로 접근 시 정상 응답

## Test Commands
```bash
# 일반 사용자로 관리자 API 접근 (403 예상)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"

# 관리자로 관리자 API 접근 (200 예상)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 토큰 없이 접근 (401 예상)
curl -X GET http://localhost:3000/api/admin/users
```

## Build Verification
- [ ] 미들웨어 문법 오류 없음
- [ ] Supabase 연동 정상
- [ ] JWT 검증 로직 정상

## Integration Verification
- [ ] S2S1 인증 미들웨어와 연동
- [ ] S4F1 관리자 대시보드와 연동
- [ ] RLS 정책과 일관성

## Expected Files
- Production/Backend_APIs/api/lib/admin-auth.js
- Production/Backend_APIs/api/middleware/withAdmin.js
- S4_개발-3차/Security/admin-auth.js

## Pass Criteria
- 관리자만 관리자 API 접근 가능
- 일반 사용자 접근 차단
- 에러 응답 형식 일관

---

## 저장 위치 검증 항목
- [ ] S4_개발-3차/Security/ 폴더에 저장되었는가?
