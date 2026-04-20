# S5DO1: 모니터링·알림 설정

## Task 정보
- **Task ID**: S5DO1
- **Task Name**: 모니터링·알림 설정
- **Stage**: S5 (품질 개선)
- **Area**: DO (DevOps)
- **Dependencies**: S4DO1, S4DO2

## Task 목표

프로덕션 환경에서 오류 및 성능 이상을 실시간으로 감지하고 알림을 받을 수 있도록 모니터링 시스템을 구축한다.

## 구현 범위

### 1. Vercel Analytics 활성화
- Vercel Dashboard에서 Analytics 활성화
- Core Web Vitals(LCP, FID, CLS) 추적
- `@vercel/analytics` 패키지 설치 및 `_app.tsx`/`layout.tsx`에 적용

### 2. 에러 추적 (Sentry 또는 Vercel 네이티브)

**옵션 A: Sentry**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
- Sentry DSN 설정
- 오류 알림 규칙 설정 (새 오류 발생 시 즉시 알림)
- 성능 모니터링 트레이싱

**옵션 B: Vercel Log Drains**
- Vercel 네이티브 로그를 외부 서비스(Axiom, Datadog)로 전송

### 3. 알림 임계값 설정
- 5xx 오류율 > 1% → 즉시 알림
- 응답 시간 > 3초 → 경고 알림
- 가용성 < 99% → 즉시 알림

### 4. 헬스체크 엔드포인트
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/api/health/route.ts` | 헬스체크 엔드포인트 |
| `sentry.client.config.ts` 등 | Sentry 설정 (옵션 A 선택 시) |
| `app/layout.tsx` | Vercel Analytics 컴포넌트 추가 |

## 완료 기준

- [ ] `/api/health` 엔드포인트 응답 확인
- [ ] Vercel Analytics 대시보드에서 데이터 수신
- [ ] 오류 발생 시 알림 수신 확인 (테스트 오류 트리거)
- [ ] 알림 임계값 설정 완료
