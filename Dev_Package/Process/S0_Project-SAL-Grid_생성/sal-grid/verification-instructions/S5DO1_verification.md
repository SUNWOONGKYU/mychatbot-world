# S5DO1 검증 지침: 모니터링·알림 설정

## 검증 에이전트
`code-reviewer-core`

## 검증 항목

### 1. 헬스체크 엔드포인트
- [ ] `GET /api/health` 응답 200
- [ ] 응답 바디에 `status: 'ok'` 포함

### 2. 모니터링 도구 설정
- [ ] Vercel Analytics 활성화 (대시보드에서 확인)
- [ ] `@vercel/analytics` 또는 동등 패키지가 `layout.tsx`에 적용
- [ ] 에러 추적 도구(Sentry 등) 설정 파일 존재

### 3. 알림 설정
- [ ] 오류 알림 임계값 설정 완료
- [ ] 테스트 오류 트리거 후 알림 수신 확인 (또는 설정 화면 캡처)

### 4. 빌드
- [ ] `npm run build` 성공

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
