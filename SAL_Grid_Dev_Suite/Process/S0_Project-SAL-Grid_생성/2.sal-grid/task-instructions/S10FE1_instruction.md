# S10FE1: QR 코드 렌더 (mypage+Step8)

## Task 정보
- **Task ID**: S10FE1
- **Task Name**: QR 코드 렌더 (mypage+Step8)
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: FE
- **Dependencies**: —
- **Agent**: `frontend-developer-core`

## Task 목표

공용 QRImage 컴포넌트로 Tab2 카드와 Step8 다운로드 모달 모두 실 PNG 렌더.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/common/qr-image.tsx, components/create/steps/Step8Deploy.tsx, components/mypage/Tab2BotManage.tsx` | QR 코드 렌더 (mypage+Step8) |

## 구현 사양

qrcode npm 패키지 toDataURL 사용. 이미 배포 완료(commit b0be67c). Completed/Verified 초기 상태로 등록.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
