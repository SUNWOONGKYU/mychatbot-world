# S5FE4: 4대 메뉴 페이지 리디자인 (Birth/Skills/Jobs/Community + 채팅UI)

## Task 정보
- **Task ID**: S5FE4
- **Task Name**: 4대 메뉴 페이지 리디자인 (Birth/Skills/Jobs/Community + 채팅UI)
- **Stage**: S5 (디자인 혁신)
- **Area**: FE (Frontend)
- **Dependencies**: S5DS4, S5FE1, S5FE2

## Task 목표

S5DS4 와이어프레임과 S5FE1 디자인 시스템으로 MCW 4대 핵심 메뉴 페이지(Birth/Skills/Jobs/Community)와 채팅 UI를 전면 리디자인한다. Learning 메뉴는 폐지되어 마이페이지 챗봇학습 탭으로 통합되었으므로, 4대 메뉴 구조에 맞춰 페이지를 재구성한다.

## 구현 항목

1. **Birth 페이지 (/birth)**:
   - 챗봇 생성 위저드 3단계 (목적 선택 → 스킬 장착 → 배포)
   - BotCard 컴포넌트, 진행률 스텝 인디케이터
   - 성격/외형/아바타 설정, QR 코드 + 배포 URL 패널

2. **Skills 페이지 (/skills)**:
   - 스킬 카드 그리드 (SkillCard 컴포넌트, 카테고리 필터)
   - 내 스킬 탭 / 스킬 탐색 탭 전환
   - 스킬 판매하기 CTA (앰버 강조)

3. **Jobs 페이지 (/jobs)**:
   - 채용 목록 (JobCard 컴포넌트, 직종 필터)
   - 구봇(고용) / 구직(등록) 탭 분리
   - 매칭 현황 배지

4. **Community 페이지 (/community)**:
   - 게시판 목록 (PostCard 컴포넌트, 카테고리 탭)
   - 글쓰기 버튼 (Primary CTA), 마당(카테고리) 탭

5. **채팅 UI (/chat/[botId])**:
   - 채팅 메시지 버블 리디자인 (사용자/봇 구분)
   - 입력창 + 전송 버튼 + TTS/STT 버튼
   - 모바일 최적화 (하단 고정 입력창)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/birth/page.tsx` | Birth 메인 리디자인 |
| `app/birth/create/page.tsx` | 챗봇 생성 위저드 리디자인 |
| `app/skills/page.tsx` | Skills 페이지 리디자인 |
| `app/jobs/page.tsx` | Jobs 페이지 리디자인 |
| `app/community/page.tsx` | Community 페이지 리디자인 |
| `app/chat/[botId]/page.tsx` | 채팅 UI 리디자인 |
| `components/birth/BotCard.tsx` | BotCard 컴포넌트 리디자인 |
| `components/skills/SkillCard.tsx` | SkillCard 컴포넌트 리디자인 |
| `components/jobs/JobCard.tsx` | JobCard 컴포넌트 리디자인 |
| `components/community/PostCard.tsx` | PostCard 컴포넌트 리디자인 |
