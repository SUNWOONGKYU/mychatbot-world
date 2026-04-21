# S10BA6 Verification

## 검증 범위
- 두 라우트 모두 미인증 요청에 대해 401 을 반환하지 않음
- 인증된 사용자는 기존 userId 사용
- 대화 기록이 `guest-*` user_id 로 저장됨

## 검증 방법
1. 라우트 코드에서 401 가드가 제거되었는지 grep
2. middleware.ts 가 차단하지 않는지 확인
3. /bot/[botId] 페이지에 auth redirect 가 없는지 확인
4. PO: 시크릿 브라우저에서 QR/URL 접속 후 메시지 전송 → 정상 응답

## 합격 기준
- 미인증 POST 가 200 SSE 응답
- DB conversations 에 `guest-UUID` 행 저장됨
