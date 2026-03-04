# S2E1 검증 지시서

## 검증 대상
- Task ID: S2E1
- Task 이름: xsai SDK 통합 + 무료 모델 라우팅

## 검증 체크리스트
- [ ] 파일 존재 확인: api/_shared.js, package.json
- [ ] @task S2E1 주석 존재 (api/_shared.js 상단)
- [ ] kebab-case 파일명 규칙 준수
- [ ] @xsai/generate-text 패키지 package.json 포함
- [ ] generateText() 함수 사용 (fetch() 직접 호출 제거)
- [ ] MODEL_STACK에 google/gemini-2.0-flash-exp:free 1순위 포함
- [ ] getOptimalModel() 함수 존재 및 emotion/cost 파라미터 처리
- [ ] 하드코딩 API 키 없음 (process.env 사용)
- [ ] 무료 모델 실패 시 유료 모델 폴백 로직 존재
- [ ] 기존 대화 API(S2BA3) 호환성 유지

## Area별 추가 검증 (E — External)
- [ ] 외부 서비스 호출 오류 처리 (try/catch, 타임아웃)
- [ ] 환경변수 미설정 시 명확한 오류 메시지
- [ ] API 응답 형식이 기존 코드와 호환
- [ ] 모델 선택 로직 단위 테스트 가능 구조
