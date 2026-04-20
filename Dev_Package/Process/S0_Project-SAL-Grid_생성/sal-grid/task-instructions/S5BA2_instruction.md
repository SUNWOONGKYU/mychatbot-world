# S5BA2: API 인증 패턴 표준화

## Task 정보
- **Task ID**: S5BA2
- **Task Name**: API 인증 패턴 표준화
- **Stage**: S5 (품질 개선)
- **Area**: BA (Backend APIs)
- **Dependencies**: S4S1, S4BA4

## Task 목표

현재 각 API 라우트마다 인증 로직이 중복 구현되어 있는 문제를 해결한다. 공통 인증 HOC(Higher-Order Component) 또는 래퍼 함수를 도입하여 인증 패턴을 일관되게 표준화한다.

## 구현 범위

### 1. 공통 인증 래퍼 함수
```typescript
// lib/api-auth.ts
export function withAuth(handler: AuthedHandler): NextApiHandler {
  return async (req, res) => {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    return handler(req, res, session);
  };
}

export function withAdminAuth(handler: AdminHandler): NextApiHandler {
  return withAuth(async (req, res, session) => {
    if (!isAdmin(session.user)) return res.status(403).json({ error: 'Forbidden' });
    return handler(req, res, session);
  });
}
```

### 2. 적용 범위
- 일반 인증 필요 API: `withAuth` 래퍼 적용
- 어드민 전용 API: `withAdminAuth` 래퍼 적용
- 공개 API: 명시적으로 public 표시

### 3. 표준화할 응답 형식
- 401 Unauthorized: `{ error: 'Authentication required' }`
- 403 Forbidden: `{ error: 'Insufficient permissions' }`

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/api-auth.ts` | 공통 인증 래퍼 함수 |
| `app/api/*/route.ts` | 래퍼 함수 적용 (중복 인증 코드 제거) |

## 완료 기준

- [ ] `lib/api-auth.ts` withAuth/withAdminAuth 구현
- [ ] 주요 보호 엔드포인트에 래퍼 적용
- [ ] 인증 없는 요청 시 401 반환
- [ ] 권한 없는 어드민 요청 시 403 반환
- [ ] 기존 기능 정상 동작 확인
