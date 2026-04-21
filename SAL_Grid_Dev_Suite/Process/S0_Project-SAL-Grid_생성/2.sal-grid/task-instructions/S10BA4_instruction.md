# S10BA4: bot PATCH 설정 저장 API

## Task 정보
- **Task ID**: S10BA4
- **Task Name**: bot PATCH 설정 저장 API
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: BA
- **Dependencies**: S10DB2
- **Agent**: `api-developer-core`

## Task 목표

/api/bots/[id] PATCH — tone/persona_traits/learning_sources/model 부분 업데이트.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/bots/[id]/route.ts` | bot PATCH 설정 저장 API |

## 구현 사양

허용 필드 whitelist, 소유권 체크, updated_at 갱신. RLS 우회는 service_role.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
