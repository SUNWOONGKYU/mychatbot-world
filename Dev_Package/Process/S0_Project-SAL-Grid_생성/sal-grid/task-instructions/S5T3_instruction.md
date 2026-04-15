# S5T3: API 통합 테스트 확장

## Task 정보
- **Task ID**: S5T3
- **Task Name**: API 통합 테스트 확장
- **Stage**: S5 (품질 개선)
- **Area**: T (Testing)
- **Dependencies**: S5BA1, S5BA2

## Task 목표

S5BA1(Zod 검증) 및 S5BA2(인증 패턴 표준화) 완료 후, 해당 변경사항에 대한 vitest 통합 테스트를 추가한다. 입력 검증 실패 케이스와 인증 패턴을 자동 테스트로 커버한다.

## 구현 범위

### 1. Zod 검증 테스트
```typescript
// tests/unit/validations.test.ts
describe('chatRequestSchema', () => {
  it('빈 메시지 거부', () => {
    const result = chatRequestSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('4001자 메시지 거부', () => {
    const result = chatRequestSchema.safeParse({ message: 'a'.repeat(4001) });
    expect(result.success).toBe(false);
  });

  it('유효한 요청 허용', () => {
    const result = chatRequestSchema.safeParse({ message: '안녕', chatbotId: 'uuid' });
    expect(result.success).toBe(true);
  });
});
```

### 2. 인증 패턴 테스트
```typescript
// tests/unit/api-auth.test.ts
describe('withAuth', () => {
  it('인증 없는 요청 401 반환', async () => {
    const req = mockRequest({ headers: {} });
    const res = await withAuth(handler)(req);
    expect(res.status).toBe(401);
  });

  it('유효한 세션으로 핸들러 호출', async () => {
    const req = mockRequest({ session: validSession });
    const res = await withAuth(handler)(req);
    expect(handlerCalled).toBe(true);
  });
});
```

### 3. 기존 테스트 커버리지 향상
- 현재 122 테스트 → 150+ 목표
- Edge case 추가

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `tests/unit/validations.test.ts` | Zod 스키마 테스트 |
| `tests/unit/api-auth.test.ts` | 인증 패턴 테스트 |

## 완료 기준

- [ ] Zod 검증 테스트 작성 (정상/오류 케이스)
- [ ] 인증 패턴 테스트 작성 (401/403 케이스)
- [ ] 모든 새 테스트 통과
- [ ] 총 테스트 커버리지 향상
