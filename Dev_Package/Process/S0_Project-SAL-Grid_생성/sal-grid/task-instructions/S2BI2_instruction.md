# S2BI2: API 미배포 파일 Root 동기화

## Task 정보
- **Task ID**: S2BI2
- **Task Name**: API 미배포 파일 Root 동기화
- **Stage**: S2 (개발 1차)
- **Area**: BI (Backend Infra)
- **Dependencies**: S1BI1

## Task 목표
Stage 폴더에만 존재하고 Root api/에 미배포된 API 파일들을 Root로 동기화. marketplace.js, inheritance.js, school-session.js 등 확인 및 배포.

## 생성/수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `api/marketplace.js` | 스킬장터 API - Stage에서 Root로 동기화 |
| `api/inheritance.js` | 상속 관리 API - Stage에서 Root로 동기화 |
| `api/school-session.js` | 학교 세션 API - Stage에서 Root로 동기화 |
| `api/_shared.js` | 공유 유틸리티 함수 업데이트 |
| `api/Backend_APIs/` | Stage 폴더의 모든 API 파일 배포 |
