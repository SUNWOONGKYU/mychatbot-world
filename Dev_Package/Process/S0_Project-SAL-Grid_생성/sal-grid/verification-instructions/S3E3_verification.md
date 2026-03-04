# S3E3 검증 지시서

## 검증 대상
- Task ID: S3E3
- Task 이름: unspeech TTS 마이크로서비스

## 검증 체크리스트
- [ ] 파일 존재 확인: docker-compose.yml, api/External/tts-proxy.js
- [ ] @task S3E3 주석 존재 (tts-proxy.js 상단)
- [ ] kebab-case 파일명 규칙 준수
- [ ] docker-compose.yml에 unspeech 서비스 정의 존재
- [ ] tts-proxy.js에 UNSPEECH_URL 환경변수 사용
- [ ] 하드코딩 API 키/URL 없음
- [ ] 오류 처리 포함 (unspeech 서비스 다운 시)
- [ ] AGPL 라이선스 격리 이유 주석 존재

## Area별 추가 검증 (E — External)
- [ ] docker-compose.yml YAML 문법 유효성
- [ ] unspeech 서비스 ports 매핑 정의
- [ ] tts-proxy.js가 POST 요청만 처리 (method 체크)
- [ ] Content-Type: audio/wav 응답 헤더 설정
- [ ] unspeech 타임아웃 설정 (무한 대기 방지)
- [ ] 기존 TTS 관련 코드와 충돌 없음
