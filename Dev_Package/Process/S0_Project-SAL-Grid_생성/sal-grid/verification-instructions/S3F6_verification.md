# S3F6 검증 지시서

## 검증 대상
- Task ID: S3F6
- Task 이름: 모바일 UX 전면 개선 (PWA, 터치)

## 검증 체크리스트
- [ ] 파일 존재 확인: manifest.json, sw.js, css/chat.css 수정 확인
- [ ] @task S3F6 주석 존재 (sw.js 상단)
- [ ] kebab-case 파일명 규칙 준수
- [ ] manifest.json 필수 필드: name, short_name, icons, start_url, display
- [ ] sw.js install/fetch/activate 이벤트 핸들러 존재
- [ ] index.html에 manifest 링크 태그 추가됨
- [ ] index.html에 SW 등록 스크립트 추가됨
- [ ] 하드코딩 없음
- [ ] 기존 기능 회귀 없음

## Area별 추가 검증 (F — Frontend)
- [ ] manifest.json JSON 유효성 검사
- [ ] SW fetch 이벤트에 API 경로 Network First 전략
- [ ] css/chat.css에 min-height: 44px 터치 영역 스타일 추가
- [ ] iOS safe area (env(safe-area-inset-*)) CSS 존재
- [ ] 192x192, 512x512 아이콘 경로 정의 (실제 파일 불필요, 경로만)
