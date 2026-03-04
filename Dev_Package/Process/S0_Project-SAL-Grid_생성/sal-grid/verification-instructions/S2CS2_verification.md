# S2CS2 검증 지시서

## 검증 대상
- Task ID: S2CS2
- Task 이름: 직업별 템플릿 콘텐츠

## 검증 체크리스트
- [ ] 파일 존재 확인: templates/ 폴더 10개 JSON 파일
- [ ] templates/seed.sql 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] 각 JSON 파일에 category, template_name, persona_prompt, greeting, sample_faqs 포함
- [ ] sample_faqs 각 2개 이상
- [ ] 하드코딩 없음
- [ ] JSON 파일 문법 유효성 (JSON.parse 오류 없음)

## Area별 추가 검증 (CS — Content/System)
- [ ] 10개 카테고리 모두 생성: lawyer, restaurant, realtor, clinic, academy, salon, cafe, gym, studio, shop
- [ ] persona_prompt가 해당 직업의 특성 반영 (30자 이상)
- [ ] greeting이 자연스러운 한국어 비즈니스 문장
- [ ] seed.sql이 bot_templates 테이블 INSERT 구문 포함
- [ ] seed.sql 실행 시 10개 레코드 삽입 가능
- [ ] sample_faqs 내 question/answer 키 형식 일치
