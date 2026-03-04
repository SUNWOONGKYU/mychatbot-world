# Verification Instruction - S1BI2

## Task ID
S1BI2

## Task Name
Sentry 에러 트래킹 설정

## Verification Agent
qa-specialist

## Verification Criteria

### 1. Sentry SDK 설치 확인
- [ ] @sentry/browser 패키지 설치 확인
- [ ] package.json에 Sentry 의존성 포함

### 2. 클라이언트 설정 확인
- [ ] Sentry.init() 호출 존재
- [ ] DSN 환경변수 사용 (SENTRY_DSN)
- [ ] 환경 구분 설정 (development/production)

### 3. 서버 설정 확인
- [ ] Serverless Functions에 Sentry 연동
- [ ] 에러 캡처 미들웨어 적용

### 4. 환경변수 확인
- [ ] SENTRY_DSN이 Vercel에 설정됨
- [ ] 개발/프로덕션 환경별 프로젝트 분리

### 5. 에러 캡처 테스트
- [ ] 테스트 에러 발생 시 Sentry 대시보드에 기록
- [ ] 에러 메시지, 스택 트레이스 정상 수집
- [ ] 사용자 컨텍스트 정보 포함

## Test Commands
```bash
# 패키지 확인
npm list @sentry/browser

# 테스트 에러 발생 (개발 환경에서만)
node -e "throw new Error('Test error for Sentry')"
```

## Build Verification
- [ ] npm install 성공
- [ ] 빌드 에러 없음
- [ ] Sentry 초기화 오류 없음

## Integration Verification
- [ ] S1BI1 환경변수와 연동
- [ ] Vercel 배포 시 정상 작동
- [ ] 클라이언트/서버 에러 모두 수집

## Expected Files
- Production/Frontend/assets/js/sentry-init.js
- api/lib/sentry.js
- S1_개발_준비/Backend_Infra/SENTRY_SETUP.md

## Notes
- 개발 초기에 설정하여 버그 조기 발견
- 에러 알림 설정 권장
- 민감한 정보가 Sentry에 전송되지 않도록 주의
