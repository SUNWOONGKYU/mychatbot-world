# S8QA1: S8 일괄 커밋·푸시·Vercel 배포

## Task 정보
- **Task ID**: S8QA1
- **Stage**: S8
- **Area**: QA
- **Dependencies**: S8BA1, S8FE1, S8FE2, S8FE3, S8FE4

## Task 목표

S8 Stage의 모든 코드 변경(BA1 + FE1~4) 및 SAL Grid 산출물을 하나의 커밋으로 묶어 푸시하고 Vercel 자동 배포를 확인한다.

## 요구사항

- Pre-commit hook(build-progress.js + upload-progress.js) 정상 실행 확인
- 커밋 메시지: `feat(s8): 런칭후 피드백 MBO — 봇 페르소나 표시 / 음성 토글 UX / 관리자 자동인증 / 사이드바 링크`
- `git push origin main`
- Vercel 빌드 로그에서 에러 없음 확인

## 검증
- 배포 URL(프로덕션)에서 변경 코드 반영 여부 확인 (정적 캐시 감안 소프트 리프레시)
