# S12FE1 Verification

## 검증 범위
- /hub 라우트 접근 가능
- 미로그인 시 /login 리다이렉트
- 봇 0개 CTA 노출

## 검증 방법
1. `tsc --noEmit` 통과
2. 배포 URL `/hub` 미로그인 접속 → 302 to /login?redirect=/hub
3. 로그인 후 접속 → 200
4. 봇 0개 계정 → "첫 페르소나를 만들어보세요" 문구 확인

## 합격 기준
- 3 시나리오 전부 통과
- 빌드 클린
