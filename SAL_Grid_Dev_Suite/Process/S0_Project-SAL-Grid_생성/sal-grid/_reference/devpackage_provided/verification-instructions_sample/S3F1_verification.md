# Verification Instruction - S3F1

## Task ID
S3F1

## Task Name
AI Q&A 인터페이스

## Verification Agent
code-reviewer

## Verification Criteria

### 1. UI 구성 확인
- [ ] AI 서비스 선택 드롭다운 (Gemini, ChatGPT, Perplexity)
- [ ] 질문 입력 텍스트 영역
- [ ] 전송 버튼
- [ ] 답변 표시 영역
- [ ] 크레딧 잔액 표시

### 2. AI 서비스 선택
- [ ] 3개 서비스 옵션 표시
- [ ] 각 서비스별 가격/크레딧 표시
- [ ] 선택 시 UI 업데이트

### 3. 질문/답변 플로우
- [ ] 질문 입력 후 전송
- [ ] 로딩 인디케이터 표시
- [ ] 답변 렌더링 (마크다운 지원)
- [ ] 에러 시 사용자 친화적 메시지

### 4. 크레딧 시스템
- [ ] 현재 크레딧 잔액 표시
- [ ] 크레딧 부족 시 안내
- [ ] 크레딧 충전 페이지 링크

### 5. 히스토리 기능
- [ ] 이전 질문/답변 목록
- [ ] 대화 맥락 유지 (선택적)

## Test Commands
```bash
# E2E 테스트
npx playwright test ai-qa.spec.js

# UI 스크린샷 비교
npx playwright test --update-snapshots
```

## Build Verification
- [ ] HTML 문법 오류 없음
- [ ] JavaScript 콘솔 에러 없음
- [ ] CSS 스타일 정상 적용

## Integration Verification
- [ ] S3BA1 AI Q&A API와 연동
- [ ] S3BA2 AI 가격 조회 API와 연동
- [ ] S3S1 구독 권한 체크 연동

## Expected Files
- Production/Frontend/pages/ai/qa.html
- Production/Frontend/assets/js/ai-qa.js
- Production/Frontend/assets/css/ai-qa.css
- S3_개발-2차/Frontend/pages/ai/qa.html

## Notes
- 스트리밍 응답 지원 권장
- 답변 복사 기능 추가 권장
- 모바일 최적화 필수
