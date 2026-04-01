# My Chatbot World — 사용자 흐름도

> 작성일: 2026-03-31

---

## 메인 사용자 흐름

```
[Landing] → [Birth] → [Create 위저드]
                           ↓
              [음성 인터뷰] → [AI 분석] → [FAQ 생성] → [배포]
                                                        ↓
                                                   [Bot 대화]
                                                        ↓
                              ┌──────────┬──────────┬──────────┐
                              ↓          ↓          ↓          ↓
                          [Home]    [School]    [Skills]    [Community]
                        대시보드      학습      스킬마켓    커뮤니티
                              ↓          ↓          ↓
                          [Jobs] ←──────────────────┘
                        수익활동
                              ↓
                        [Business]
                       수익 대시보드
                              ↓
                        [MyPage]
                       피상속 관리
```

## 페이지별 흐름

### 신규 사용자
1. Landing → 데모 체험 (Guest 모드)
2. 회원가입/로그인 (Supabase Auth)
3. Birth → 챗봇 탄생 애니메이션
4. Create → 5분 위저드
5. Home → 대시보드 진입

### 기존 사용자
1. 로그인 → Home (대시보드)
2. Bot → 대화 / School → 학습
3. Skills → 스킬 장착 / Jobs → 수익 활동

### 게스트 (비로그인)
1. Landing → Guest 모드
2. 제한된 기능 체험
3. 회원가입 유도

## 12개 메뉴 ↔ 페이지 매핑

| 메뉴 | URL 경로 | 파일 |
|------|---------|------|
| Landing | / | index.html |
| Birth | /pages/birth/ | birth/index.html |
| Create | /pages/create/ | create/index.html |
| Bot | /pages/bot/ | bot/chat.html |
| Home | /pages/home/ | home/index.html |
| School | /pages/learning/ | learning/index.html |
| Skills | /pages/skills/ | skills/index.html |
| Jobs | /pages/jobs/ | jobs/index.html |
| Community | /pages/community/ | community/index.html |
| Business | /pages/business/ | business/index.html |
| MyPage | /pages/mypage/ | mypage/index.html |
| Guest | /pages/guest/ | guest/index.html |
