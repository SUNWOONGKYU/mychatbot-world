# S5FE6: 마이페이지 리디자인 — 탭1~4 (프로필/챗봇관리/챗봇학습/스킬관리)

## Task 정보
- **Task ID**: S5FE6
- **Task Name**: 마이페이지 리디자인 — 탭1~4 (프로필/챗봇관리/챗봇학습/스킬관리)
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5DS4, S5FE1, S5FE2

## Task 목표

마이페이지(/mypage) 8탭 구조 중 탭1~4를 전면 리디자인한다. PO 확정 기능 스펙(2026-04-07)을 기준으로 구현한다.

## 구현 항목

### 탭1. 프로필 관리 (/mypage?tab=profile)
- 닉네임, 이메일, 가입일 표시
- 프로필 아바타 업로드 (이미지 크롭 포함)
- 알림 설정 토글 (상속 동의/입금 완료/스킬 업데이트/공지/구봇구직 매칭)

### 탭2. 챗봇 관리 (/mypage?tab=bots)
- 내 챗봇 목록 (카드 뷰) + 작성 중 초안 카드
- 챗봇별 URL 패널 (배포 URL + QR 코드 생성 + URL 복사)
- 페르소나 관리 (최대 10개) — 추가/삭제/편집
- AI 인사말 자동 생성, FAQ 자동 생성 버튼
- per-persona 툴 6종 패널:
  1. 대화 로그 뷰어
  2. KB 지식베이스 (업로드/FAQ/Obsidian)
  3. 스킬 장착/해제 (마켓에서 받은 스킬)
  4. 챗봇스쿨 (학습 현황)
  5. 커뮤니티 활동 내역
  6. 챗봇 설정 (AI 모델/온도/DM 보안정책 3단계)
- 챗봇 복제 ("80% 같고 20% 다른 챗봇" 만들기)
- 챗봇 내보내기/가져오기 (JSON 백업·복원)
- 봇 삭제

### 탭3. 챗봇 학습 (/mypage?tab=learning) — 구 Learning 메뉴 통합
- KB 주입 (파일 업로드 / 텍스트 입력 / Obsidian .md)
- Wiki-e-RAG 연동:
  - Wiki 자동 생성 (Ingest)
  - Wiki 페이지 목록/편집
  - Wiki 그래프 뷰 (연결 시각화)
  - Wiki Lint (품질 점검)
  - 축적 현황 (복리 성장 지표)
- FAQ 추가/편집
- 전체 챗봇의 학습 현황 한눈에 보기

### 탭4. 스킬 관리 (/mypage?tab=skills)
- 스킬 마켓에서 다운로드 받은 내 스킬 목록
- 스킬 활성/비활성 토글
- 어떤 챗봇에 장착했는지 표시
- 스킬 제거
- 스킬 마켓에 내 스킬 등록하기 (스킬 제작 → 마켓 등록)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/mypage/page.tsx` | 마이페이지 8탭 레이아웃 + 탭1~4 구현 |
| `components/mypage/ProfileTab.tsx` | 탭1 프로필 관리 |
| `components/mypage/BotsTab.tsx` | 탭2 챗봇 관리 (BotCard + 페르소나 패널) |
| `components/mypage/LearningTab.tsx` | 탭3 챗봇 학습 (Wiki-e-RAG + KB) |
| `components/mypage/SkillsTab.tsx` | 탭4 스킬 관리 |
| `components/mypage/PersonaPanel.tsx` | 페르소나 편집 패널 |
| `components/mypage/ToolPanel.tsx` | per-persona 툴 6종 패널 |
