# S2F7 검증 지시서

## 검증 대상
- Task ID: S2F7
- Task 이름: 음성 확인 절차 UI

## 검증 체크리스트
- [ ] 파일 존재 확인: pages/create/index.html 수정 확인
- [ ] @task S2F7 주석 존재
- [ ] kebab-case 파일명 규칙 준수
- [ ] Step 4 섹션에 "인사말 듣기" 버튼 HTML 요소 존재
- [ ] /api/tts 호출 코드 존재
- [ ] Audio API 재생 코드 존재
- [ ] 로딩/재생 상태 UI 요소 존재
- [ ] 하드코딩 없음
- [ ] TTS API 오류 시 에러 메시지 표시

## Area별 추가 검증 (F — Frontend)
- [ ] 인사말 텍스트 비어있을 때 버튼 disabled 처리
- [ ] 동시 여러 번 클릭 방지 (재생 중 버튼 비활성화)
- [ ] 기존 위저드 흐름(Step 1~8) 영향 없음
- [ ] 모바일에서도 오디오 재생 코드 호환
