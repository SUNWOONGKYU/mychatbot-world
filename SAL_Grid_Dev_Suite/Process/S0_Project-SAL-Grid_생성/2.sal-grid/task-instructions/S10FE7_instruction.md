# S10FE7: BotSettings 저장 통합

## Task 정보
- **Task ID**: S10FE7
- **Task Name**: BotSettings 저장 통합
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: FE
- **Dependencies**: S10BA4
- **Agent**: `frontend-developer-core`

## Task 목표

Tab2 카드 "설정" 패널 — tone/persona/model PATCH 저장 라운드트립.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/mypage/panels/BotSettings.tsx` | BotSettings 저장 통합 |

## 구현 사양

폼 제출 → PATCH /api/bots/[id] → 성공 시 로컬 상태 갱신 + 토스트. 저장 전/후 값 비교로 dirty 검출.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
