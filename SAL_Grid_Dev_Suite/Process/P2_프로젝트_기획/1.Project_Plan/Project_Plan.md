# My Chatbot World — 프로젝트 계획

> 작성일: 2026-03-31
> 소급 도입: 기존 프로토타입 분석 기반

---

## 프로젝트 비전

**핵심 아이디어**: 누구나 5분 만에 AI 챗봇을 만들고, 라이프사이클 전체를 관리하는 플랫폼

**문제 정의**: AI를 쓰고 싶지만 복잡한 설정·비용·기술 장벽으로 접근 못하는 대다수 국민

**해결책**: 음성 인터뷰 → 자동 생성 → 학습 → 성장 → 수익 → 상속

## 핵심 기능 (12개 메뉴)

| # | 메뉴 | 기능 | 현재 완성도 |
|---|------|------|:----------:|
| 1 | Landing | 서비스 소개·체험 데모 | 95% |
| 2 | Birth | 챗봇 탄생 애니메이션 | 100% |
| 3 | Create | 5분 생성 위저드 (음성→분석→FAQ→배포) | 60% |
| 4 | Bot | AI 대화 (페르소나·감성슬라이더·TTS/STT) | 75% |
| 5 | Home | 대시보드 (KB·사용량·설정) | 70% |
| 6 | School | 학습/멘토링 (시나리오·채점) | 55% |
| 7 | Skills | 스킬 마켓 (설치·실행·결제·리뷰) | 60% |
| 8 | Jobs | 수익활동 (채용·매칭·정산) | 50% |
| 9 | Community | 커뮤니티 (게시판·마당·북마크) | 65% |
| 10 | Business | 수익 대시보드 (수익API·정산) | 30% |
| 11 | MyPage | 프로필·피상속 관리 | 25% |
| 12 | Guest | 게스트 모드 (비로그인 체험) | 95% |

## 기술 스택

| 구분 | 현재 | 전환 계획 |
|------|------|----------|
| Frontend | Vanilla (HTML/CSS/JS) | React/Next.js 점진적 전환 |
| Backend | Vercel Serverless (Node.js) | 유지 |
| Database | Supabase (PostgreSQL + Storage) | 유지 |
| AI | OpenRouter 멀티 AI 라우팅 | 유지 |
| Deploy | Vercel (mychatbot.world) | 유지 |
| Auth | Supabase Auth | 유지 |

## Stage 구성

| Stage | 이름 | 주요 내용 | Task 수 |
|-------|------|----------|:------:|
| S1 | 개발 준비 | 인프라·DB·인증·디자인 시스템 | 12 |
| S2 | 개발 1차 | 핵심 기능 (Create·Bot·Home·Community) | 15 |
| S3 | 개발 2차 | 확장 기능 (School·Skills·Jobs·Business) | 18 |
| S4 | 개발 마무리 | MyPage·피상속·테스트·문서·배포 | 15 |

> **총 Task 수**: 60개 (21개 소급 도입 + 39개 신규) / S1(12)+S2(15)+S3(18)+S4(15)=60

---

## 참조 문서

📁 Brainstorming/
📄 MCW_개발현황_메뉴별_20260331.md
📄 프로젝트 핵심 기술 및 프로세스.txt
📄 AI_unified_architecture.md
