# S5BA1: 서버 측 입력 검증 강화 (Zod)

## Task 정보
- **Task ID**: S5BA1
- **Task Name**: 서버 측 입력 검증 강화 (Zod)
- **Stage**: S5 (품질 개선)
- **Area**: BA (Backend APIs)
- **Dependencies**: S3BA1, S4BA4

## Task 목표

현재 수동 타입 검사 방식을 Zod 스키마 기반 서버 측 입력 검증으로 교체한다. 모든 API 엔드포인트에서 일관된 입력 검증을 적용하여 예기치 않은 데이터 형식으로 인한 오류를 방지한다.

## 구현 범위

### 1. Zod 설치
```bash
npm install zod
```

### 2. 검증 스키마 파일 생성
- `lib/validations/chat.ts` — 채팅 API 입력 스키마
- `lib/validations/admin.ts` — 어드민 API 입력 스키마
- `lib/validations/auth.ts` — 인증 관련 입력 스키마

### 3. 적용 대상 엔드포인트
- `app/api/chat/route.ts` — 메시지 내용, 챗봇 ID, 페르소나 설정
- `app/api/admin/*/route.ts` — 어드민 CRUD 요청 바디
- 회원가입/프로필 수정 API

### 4. 공통 검증 미들웨어 함수
```typescript
// lib/validate-request.ts
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }
  return result.data;
}
```

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/validations/chat.ts` | 채팅 API Zod 스키마 |
| `lib/validations/admin.ts` | 어드민 API Zod 스키마 |
| `lib/validate-request.ts` | 공통 검증 헬퍼 |
| `app/api/chat/route.ts` | Zod 검증 적용 |
| `app/api/admin/*/route.ts` | Zod 검증 적용 |

## 완료 기준

- [ ] Zod 패키지 설치 완료
- [ ] 주요 API 엔드포인트에 Zod 검증 적용
- [ ] 잘못된 입력 시 400 Bad Request + 상세 오류 메시지 반환
- [ ] 기존 테스트 통과 유지
