# 스킬 제작 임무 배정

저장 위치: G:\내 드라이브\mychatbot-world\skill-market\

## 프롬프트 스킬 (prompt-skills/) — 10개

각 스킬은 개별 JSON 파일로 저장. 형식:
```json
{
  "id": "스킬ID",
  "name": "스킬명",
  "icon": "이모지",
  "category": "카테고리",
  "description": "설명",
  "type": "prompt",
  "isFree": true/false,
  "price": 0,
  "systemPrompt": "전문적이고 상세한 시스템 프롬프트 (최소 500자 이상)",
  "examples": ["예시 질문1", "예시 질문2", "예시 질문3"],
  "tags": ["태그1", "태그2"]
}
```

### 1. Alpha — 욕설 필터 (profanity-filter.json)
- 욕설/비속어/혐오 표현 감지 및 정중한 거절
- systemPrompt에 한국어 욕설 패턴, 우회 표현, 등급별 대응 포함

### 2. Bravo — 감정 분석 (sentiment.json)
- 사용자 감정 파악 + 공감 표현 + 적절한 어조 조절
- systemPrompt에 감정 분류 체계, 공감 표현 패턴, 위기 감지(자해/폭력) 포함

### 3. Charlie — 이모지 반응 (emoji-react.json)
- 감정 맞춤 이모지 자동 추가
- systemPrompt에 감정별 이모지 매핑 테이블, 사용 빈도 규칙 포함

### 4. Delta — 다국어 번역 (multilang.json)
- 20개 언어 자동 감지 및 해당 언어로 답변
- systemPrompt에 언어 감지 로직, 언어별 인사말, 번역 품질 가이드 포함

### 5. Echo — 음성 답변 TTS (tts-basic.json)
- 음성 출력에 최적화된 구어체 답변
- systemPrompt에 음성 친화 규칙(짧은 문장, 자연스러운 호흡, 특수기호 배제) 포함

### 6. Foxtrot — 스팸 방지 (spam-block.json)
- 반복 질문/도배 감지 및 차단
- systemPrompt에 반복 패턴 감지, 차단 메시지, 예외 처리 포함

### 7. Golf — FAQ 자동 생성 (faq-auto.json)
- 대화 패턴 분석으로 FAQ 후보 추천
- systemPrompt에 패턴 인식 로직, FAQ 추천 화법, 등록 유도 포함

### 8. Hotel — 설문조사 (survey.json)
- 대화 종료 시 만족도 수집
- systemPrompt에 자연스러운 설문 유도, 5점 척도, 피드백 수집 화법 포함

### 9. India — 리드 수집 (lead-collect.json)
- 자연스러운 연락처 수집 유도
- systemPrompt에 유도 화법, GDPR/개인정보 동의, CRM 연동 안내 포함

### 10. Juliet — 트레이딩 전문가 (trader-expert.json)
- 기술적/기본적 분석, 매매 전략, 리스크 관리
- systemPrompt에 이동평균, RSI, MACD, 볼린저밴드, PER/PBR/ROE, 분할매수, 손절 규칙 포함

## 연동 스킬 (integration-skills/) — 4개

각 스킬은 개별 폴더로 저장. 구성:
- skill.json (메타데이터 + systemPrompt)
- handler.js (API 연동 코드 — api/skill-integrations.js에서 추출)
- README.md (설치/설정 가이드)

### 11. Kilo — 예약 시스템 (reservation/)
- 상담 예약 받기, 캘린더 연동
- handler.js: 예약 데이터 수집 + 저장 로직

### 12. Lima — 쿠폰 발급 (coupon/)
- 자동 쿠폰 생성, 유효기간 설정
- handler.js: 쿠폰 코드 생성 + 유효기간 로직

### 13. Mike — 이메일 전송 (email-send/)
- 문의사항 자동 메일 발송
- handler.js: Resend API 연동 코드

### 14. November — 카카오톡 알림 (kakao-noti/)
- 중요 메시지 카톡 전달
- handler.js: 카카오 알림톡 API 연동 코드
