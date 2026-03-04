# S2E1: xsai SDK 통합 + 무료 모델 라우팅

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S2E1 |
| Task 이름 | xsai SDK 통합 + 무료 모델 라우팅 |
| Stage | S2 — 개발 1차 |
| Area | E — External/Engine |
| Dependencies | S2BA3 |
| 실행 방식 | AI-Only |

## 배경 및 목적

현재 api/_shared.js는 OpenRouter API를 직접 fetch()로 호출하고 있다. xsai SDK를 도입하면 표준화된 인터페이스로 다양한 AI 프로바이더를 통합할 수 있으며, 무료 모델 우선 라우팅을 통해 비용을 절감할 수 있다. 특허 Fig 4의 감정+비용 기반 모델 선택 로직을 구현한다.

## 세부 작업 지시

1. package.json에 @xsai/generate-text, @xsai/providers 패키지 추가
2. api/_shared.js의 직접 fetch() 호출을 xsai generateText()로 리팩토링
3. MODEL_STACK에 무료 모델 추가:
   - 1순위: google/gemini-2.0-flash-exp:free
   - 기존 모델은 유료 폴백으로 유지
4. getOptimalModel() 함수 구현:
   - emotion 파라미터에 따른 모델 선택
   - 비용 기반 우선순위 적용
   - 무료 모델 사용 가능 여부 체크 후 폴백
5. 기존 API 엔드포인트 호환성 유지

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| api/_shared.js | xsai SDK 적용, getOptimalModel() 추가, MODEL_STACK 업데이트 |
| package.json | @xsai/generate-text, @xsai/providers 의존성 추가 |

## 완료 기준
- [ ] @xsai/generate-text 패키지 설치 및 동작 확인
- [ ] generateText() 함수로 기존 fetch() 대체 완료
- [ ] google/gemini-2.0-flash-exp:free 모델이 MODEL_STACK 1순위
- [ ] getOptimalModel()이 emotion과 cost를 기반으로 모델 반환
- [ ] 기존 대화 API (S2BA3)와 호환성 유지
- [ ] 하드코딩된 API 키 없음 (환경변수 사용)
- [ ] 오류 처리: 무료 모델 실패 시 유료 모델로 자동 폴백
