# Verification Instruction - S2BA5

## Task ID
S2BA5

## Task Name
프로젝트 관리 API

## Verification Agent
code-reviewer

## Verification Criteria

### 1. API 엔드포인트 확인
- [ ] POST /api/projects - 프로젝트 생성
- [ ] GET /api/projects - 프로젝트 목록
- [ ] GET /api/projects/:id - 프로젝트 상세
- [ ] PUT /api/projects/:id - 프로젝트 수정
- [ ] POST /api/projects/:id/complete - 프로젝트 완료

### 2. 인증/권한 확인
- [ ] 모든 엔드포인트 인증 필요
- [ ] 본인 프로젝트만 수정/삭제 가능
- [ ] 관리자는 모든 프로젝트 접근 가능

### 3. 데이터 검증
- [ ] 프로젝트 이름 필수
- [ ] 상태 값 유효성 (pending, in_progress, completed)
- [ ] 날짜 형식 검증

### 4. 응답 형식
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Project Name",
    "status": "in_progress",
    "user_id": "uuid",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### 5. 에러 처리
- [ ] 인증 실패: 401 Unauthorized
- [ ] 권한 없음: 403 Forbidden
- [ ] 프로젝트 없음: 404 Not Found
- [ ] 입력 오류: 400 Bad Request

## Test Commands
```bash
# 프로젝트 생성
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project"}'

# 프로젝트 목록
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN"

# 프로젝트 완료
curl -X POST http://localhost:3000/api/projects/123/complete \
  -H "Authorization: Bearer $TOKEN"
```

## Build Verification
- [ ] API 파일 문법 오류 없음
- [ ] 라우팅 정상 작동
- [ ] DB 연결 정상

## Integration Verification
- [ ] S1D1 DB 스키마 projects 테이블 연동
- [ ] S2S1 인증 미들웨어 적용
- [ ] RLS 정책 정상 작동

## Expected Files
- Production/Backend_APIs/api/projects/index.js
- Production/Backend_APIs/api/projects/[id].js
- Production/Backend_APIs/api/projects/[id]/complete.js
- S2_개발-1차/Backend_APIs/api/projects/*.js

## Notes
- 프로젝트 삭제는 soft delete 권장
- 페이지네이션 구현 권장
