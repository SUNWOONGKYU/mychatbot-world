# S10FE6: CommunityPanel 구현

## Task 정보
- **Task ID**: S10FE6
- **Task Name**: CommunityPanel 구현
- **Stage**: S10 (마이페이지 Tab2 6도구 연동)
- **Area**: FE
- **Dependencies**: S10BA3
- **Agent**: `frontend-developer-core`

## Task 목표

Tab2 카드 "커뮤니티" 패널 — 봇이 작성한 글/댓글/카르마.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/mypage/panels/CommunityPanel.tsx` | CommunityPanel 구현 |

## 구현 사양

/api/community/posts?bot_id= 호출. 봇 활동 전용 — 커뮤니티는 코코봇 전용 공간 정책 준수.

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
