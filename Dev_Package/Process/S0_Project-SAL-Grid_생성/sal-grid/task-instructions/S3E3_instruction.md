# S3E3: unspeech TTS 마이크로서비스

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S3E3 |
| Task 이름 | unspeech TTS 마이크로서비스 |
| Stage | S3 — 개발 2차 |
| Area | E — External/Engine |
| Dependencies | S3E1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

unspeech는 AGPL-3.0 라이선스 오픈소스 TTS 엔진이다. AGPL 특성상 서버 사이드에서 사용할 경우 전체 소스코드 공개 의무가 발생하므로, 격리된 Docker 컨테이너로 독립 배포하여 CoCoBot 메인 코드베이스와 분리한다. MCW는 HTTP API로만 unspeech를 호출한다.

## 세부 작업 지시

1. docker-compose.yml에 unspeech 서비스 추가:
   ```yaml
   services:
     unspeech:
       image: unspeech/unspeech:latest
       ports:
         - "8080:8080"
       environment:
         - UNSPEECH_MODEL=kokoro
       restart: unless-stopped
   ```

2. api/External/tts-proxy.js 생성:
   - POST /api/tts 요청을 unspeech HTTP API로 프록시
   - 요청: { text, voice, speed }
   - unspeech 응답(audio/wav)을 클라이언트에 반환
   - unspeech 서비스 URL은 환경변수 UNSPEECH_URL로 관리

3. 기존 TTS 관련 코드가 있다면 tts-proxy.js로 통합

4. README 또는 주석에 AGPL 라이선스 고지 및 격리 이유 문서화

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| docker-compose.yml | unspeech 서비스 추가 |
| api/External/tts-proxy.js | unspeech HTTP 프록시 API 신규 생성 |

## 완료 기준
- [ ] docker-compose.yml에 unspeech 서비스 정의
- [ ] api/External/tts-proxy.js 생성
- [ ] POST /api/tts 호출 시 unspeech로 프록시
- [ ] 오디오 응답 정상 반환
- [ ] UNSPEECH_URL 환경변수 사용 (하드코딩 금지)
- [ ] AGPL 라이선스 격리 이유 주석 포함
- [ ] @task S3E3 주석 포함
