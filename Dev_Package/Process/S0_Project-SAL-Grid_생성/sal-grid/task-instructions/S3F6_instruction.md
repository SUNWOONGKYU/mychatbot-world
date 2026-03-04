# S3F6: 모바일 UX 전면 개선 (PWA, 터치)

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S3F6 |
| Task 이름 | 모바일 UX 전면 개선 (PWA, 터치) |
| Stage | S3 — 개발 2차 |
| Area | F — Frontend |
| Dependencies | S3F1 |
| 실행 방식 | AI-Only |

## 배경 및 목적

모바일 사용자 비중이 높은 한국 시장에서 경쟁력 확보를 위해 PWA 지원과 터치 UX를 최적화한다. 홈 화면 추가, 오프라인 캐싱, 터치 영역 최적화를 구현한다.

## 세부 작업 지시

1. manifest.json 생성 (루트):
   - name, short_name, icons (192x192, 512x512)
   - start_url, display: "standalone"
   - theme_color, background_color

2. sw.js (Service Worker) 생성 (루트):
   - install 이벤트: 핵심 파일 캐싱 (index.html, css/chat.css, js/chat.js)
   - fetch 이벤트: Cache First 전략 (정적 자산), Network First (API)
   - activate 이벤트: 이전 캐시 정리

3. css/chat.css 모바일 최적화:
   - 터치 영역 최소 44px 보장 (버튼, 링크)
   - iOS safe area 지원 (env(safe-area-inset-*))
   - 모바일 키보드 올라올 때 레이아웃 조정
   - 스와이프 제스처 힌트

4. index.html에 manifest 링크 및 SW 등록 스크립트 추가

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| manifest.json | PWA 매니페스트 신규 생성 |
| sw.js | Service Worker 신규 생성 |
| css/chat.css | 모바일 터치 최적화 스타일 추가 |
| index.html | manifest 링크 및 SW 등록 추가 |

## 완료 기준
- [ ] manifest.json 유효성 검사 통과
- [ ] Service Worker 등록 성공 (DevTools > Application 확인)
- [ ] 정적 자산 오프라인 캐싱 동작
- [ ] 터치 영역 44px 이상
- [ ] iOS Safari에서 홈 화면 추가 가능
- [ ] Lighthouse PWA 점수 80점 이상
- [ ] 모바일 키보드 표시 시 채팅 입력창 가시성 유지
