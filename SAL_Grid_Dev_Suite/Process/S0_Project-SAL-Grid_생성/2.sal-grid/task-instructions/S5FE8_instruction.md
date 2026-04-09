# S5FE8: 관리자 대시보드 구현 — 섹션5~8 (챗봇/스킬/구봇구직/커뮤니티)

## Task 정보
- **Task ID**: S5FE8
- **Task Name**: 관리자 대시보드 구현 — 섹션5~8 (챗봇/스킬/구봇구직/커뮤니티)
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5DS4, S5FE1, S5FE2, S5FE7

## Task 목표

S5FE7에서 구현한 관리자 대시보드 구조 위에 섹션5~8(챗봇/스킬/구봇구직/커뮤니티)를 추가 구현한다. PO 확정 스펙(2026-04-07) 기준.

## 구현 항목

### 섹션5. 챗봇 관리 (/admin/bots)
- 전체 봇 목록 / 검색
- 상태 변경 (active/inactive/suspended)
- 신고된 봇 처리 (내용 확인 → 경고/정지/삭제)
- 챗봇 데모보기 — 선택한 봇과 바로 대화 테스트

### 섹션6. 스킬 관리 (/admin/skills)
- 스킬 목록 CRUD / 설치 건수 집계
- 관리자 공식 스킬 등록 ("공식" 배지)
- 회원 스킬 등록 검수 — 검수 대기 목록 → 승인/반려(사유) — 배지 표시

### 섹션7. 구봇구직 관리 (/admin/jobs)
- 등록된 공고 목록
- 부적절 공고 처리 (숨김/삭제)
- 매칭 현황 모니터링
- 정산 관리 — 수수료(20%) 계산 / 승인·거부

### 섹션8. 커뮤니티 관리 (/admin/community)
- 신고된 게시글/댓글 목록
- 관리자 강제 삭제 (삭제 사유 기록 + 작성자에게 알림)
- 경고 발송
- 마당(카테고리) 관리 (추가/수정/삭제)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/admin/bots/page.tsx` | 챗봇 관리 섹션 |
| `app/admin/skills/page.tsx` | 스킬 관리 섹션 |
| `app/admin/jobs/page.tsx` | 구봇구직 관리 섹션 |
| `app/admin/community/page.tsx` | 커뮤니티 관리 섹션 |
| `components/admin/BotManageTable.tsx` | 봇 관리 테이블 |
| `components/admin/SkillReviewPanel.tsx` | 스킬 검수 패널 |
