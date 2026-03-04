# S2CS2: 직업별 템플릿 콘텐츠

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S2CS2 |
| Task 이름 | 직업별 템플릿 콘텐츠 |
| Stage | S2 — 개발 1차 |
| Area | CS — Content/System |
| Dependencies | S2DB1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

신규 사용자가 빠르게 챗봇을 설정할 수 있도록 직업별 사전 구성된 템플릿을 제공한다. S2DB1의 bot_templates 테이블에 삽입할 JSON 시드 데이터를 작성한다.

## 세부 작업 지시

1. templates/ 폴더에 직업 카테고리별 JSON 파일 생성:
   - templates/lawyer.json — 변호사/법무사
   - templates/restaurant.json — 음식점/카페
   - templates/realtor.json — 부동산 중개사
   - templates/clinic.json — 의원/병원
   - templates/academy.json — 학원/교습소
   - templates/salon.json — 미용실/네일샵
   - templates/cafe.json — 카페/베이커리
   - templates/gym.json — 헬스장/PT센터
   - templates/studio.json — 스튜디오/공방
   - templates/shop.json — 일반 소매점

2. 각 JSON 파일 구조:
   ```json
   {
     "category": "lawyer",
     "template_name": "법률 상담 AI 어시스턴트",
     "persona_prompt": "당신은 친절한 법률 안내 AI입니다...",
     "greeting": "안녕하세요! 법률 궁금증, 편하게 물어보세요.",
     "sample_faqs": [
       { "question": "상담 비용이 어떻게 되나요?", "answer": "..." },
       { "question": "예약은 어떻게 하나요?", "answer": "..." }
     ]
   }
   ```

3. templates/seed.sql 작성:
   - 10개 템플릿을 bot_templates 테이블에 INSERT하는 SQL

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| templates/lawyer.json | 변호사 템플릿 콘텐츠 |
| templates/restaurant.json | 음식점 템플릿 콘텐츠 |
| templates/realtor.json | 부동산 템플릿 콘텐츠 |
| templates/clinic.json | 의원 템플릿 콘텐츠 |
| templates/academy.json | 학원 템플릿 콘텐츠 |
| templates/salon.json | 미용실 템플릿 콘텐츠 |
| templates/cafe.json | 카페 템플릿 콘텐츠 |
| templates/gym.json | 헬스장 템플릿 콘텐츠 |
| templates/studio.json | 스튜디오 템플릿 콘텐츠 |
| templates/shop.json | 소매점 템플릿 콘텐츠 |
| templates/seed.sql | DB INSERT SQL |

## 완료 기준
- [ ] 10개 직업 카테고리 JSON 파일 생성
- [ ] 각 파일에 category, template_name, persona_prompt, greeting, sample_faqs 포함
- [ ] sample_faqs 각 2개 이상
- [ ] persona_prompt가 해당 직업의 특성 반영
- [ ] seed.sql로 bot_templates 테이블에 삽입 가능
- [ ] 한국어 콘텐츠 (자연스러운 비즈니스 한국어)
