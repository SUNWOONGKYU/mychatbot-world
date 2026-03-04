# S4T4: 전체 통합 테스트

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S4T4 |
| Task 이름 | 전체 통합 테스트 |
| Stage | S4 — 개발 마무리 |
| Area | T — Testing |
| Dependencies | S4F2, S4F3, S4F4, S4BA2, S4BA3 |
| 실행 방식 | AI-Only |

## 배경 및 목적

Phase 3 기능(마켓플레이스, 비즈니스 대시보드, 상속)이 모두 완성된 후 전체 통합 E2E 테스트를 수행한다. 새 기능이 기존 기능과 충돌하지 않는지 검증한다.

## 세부 작업 지시

1. tests/ 폴더에 통합 테스트 작성:
   - tests/marketplace.test.js: 마켓플레이스 스킬 등록/탐색/설치 플로우
   - tests/revenue.test.js: 수익 이벤트 생성 및 집계 검증
   - tests/inheritance.test.js: 상속 설정/수락 플로우
   - tests/regression.test.js: 기존 핵심 기능 회귀 테스트

2. 각 테스트 파일:
   - 테스트 환경: 테스트 DB 또는 Supabase 테스트 프로젝트
   - 사전 조건 setup/teardown 포함
   - 성공/실패 케이스 모두 포함

3. 테스트 실행 스크립트 (package.json):
   - "test:integration": "node --experimental-vm-modules jest tests/"
   - "test:all": "npm run test && npm run test:integration"

4. 테스트 결과 리포트 생성 (tests/results/ 폴더)

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| tests/marketplace.test.js | 마켓플레이스 통합 테스트 |
| tests/revenue.test.js | 수익 통합 테스트 |
| tests/inheritance.test.js | 상속 통합 테스트 |
| tests/regression.test.js | 기존 기능 회귀 테스트 |
| package.json | test:integration 스크립트 추가 |

## 완료 기준
- [ ] tests/ 4개 파일 생성
- [ ] 각 파일 최소 5개 테스트 케이스
- [ ] 마켓플레이스 CRUD 테스트 통과
- [ ] 수익 집계 로직 테스트 통과
- [ ] 상속 플로우 테스트 통과
- [ ] 기존 인증/챗봇/대화 API 회귀 테스트 통과
- [ ] package.json test 스크립트 업데이트
