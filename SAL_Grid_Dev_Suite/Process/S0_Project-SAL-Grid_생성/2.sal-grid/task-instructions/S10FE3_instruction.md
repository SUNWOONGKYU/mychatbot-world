# S10FE3: KbPanel 구현

## Task 정보
- **Task ID**: S10FE3
- **Task Name**: KbPanel 구현
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: FE
- **Dependencies**: —
- **Agent**: `frontend-developer-core`

## Task 목표

Tab2 카드 "학습/KB" 패널 — kb_items 표/추가/삭제.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/mypage/panels/KbPanel.tsx` | KbPanel 구현 |

## 구현 사양

/api/kb GET/POST/DELETE 재사용. 파일 업로드 + 텍스트 조각. 라벨은 멘탈모델("학습/Learning") 유지.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
