# S10FE4: SkillsMountPanel 구현

## Task 정보
- **Task ID**: S10FE4
- **Task Name**: SkillsMountPanel 구현
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: FE
- **Dependencies**: S10BA2
- **Agent**: `frontend-developer-core`

## Task 목표

Tab2 카드 "스킬" 패널 — 마운트된 스킬 목록 + 장착/해제.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/mypage/panels/SkillsMountPanel.tsx` | SkillsMountPanel 구현 |

## 구현 사양

/api/bots/[id]/skills 호출, 스킬 마켓에서 추가, 체크박스/토글로 해제.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
