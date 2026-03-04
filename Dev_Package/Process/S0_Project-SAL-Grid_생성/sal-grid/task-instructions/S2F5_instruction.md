# S2F5: VAD 음성 입력 개선

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S2F5 |
| Task 이름 | VAD 음성 입력 개선 |
| Stage | S2 — 개발 1차 |
| Area | F — Frontend |
| Dependencies | S2F3 |
| 실행 방식 | AI-Only |

## 배경 및 목적

기존 챗봇 대화 UI(S2F3)의 음성 입력은 4초 무음 타이머로 발화 종료를 감지한다. 이 방식은 사용자가 잠깐 멈출 때도 전송되거나, 긴 침묵을 기다려야 하는 문제가 있다. @ricky0123/vad-web 라이브러리의 VAD(Voice Activity Detection)를 적용하여 실제 발화 경계를 정확하게 감지한다.

## 세부 작업 지시

1. package.json에 @ricky0123/vad-web 패키지 추가
2. js/chat.js에서 기존 4초 타이머 로직 제거
3. VAD 초기화 코드 추가:
   - MicVAD.new() 설정
   - onSpeechStart, onSpeechEnd 콜백 구현
4. onSpeechEnd 콜백에서 기존 음성 전송 로직 호출
5. 참고 코드: 참고자료_AIRI/webai-example-realtime-voice-chat/
6. VAD 오류 시 기존 타이머 방식으로 폴백

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| js/chat.js | 4초 타이머 제거, VAD 초기화 및 콜백 적용 |
| package.json | @ricky0123/vad-web 의존성 추가 |

## 완료 기준
- [ ] @ricky0123/vad-web 패키지 설치 완료
- [ ] 4초 타이머 로직 제거됨
- [ ] VAD가 발화 시작(onSpeechStart) 감지 시 녹음 시작 UI 표시
- [ ] VAD가 발화 종료(onSpeechEnd) 감지 시 음성 데이터 전송
- [ ] 마이크 권한 없을 때 오류 메시지 표시
- [ ] 기존 텍스트 입력 방식과 공존 가능
- [ ] VAD 초기화 실패 시 폴백 동작
