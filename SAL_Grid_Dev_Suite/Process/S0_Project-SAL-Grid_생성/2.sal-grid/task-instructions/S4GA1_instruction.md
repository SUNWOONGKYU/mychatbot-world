# Task Instruction - S4GA1

## Task ID
S4GA1

## Task Name
기존 코드 대조 점검 + 누락 보완 + 통합 디버깅

## Task Goal
기존 Vanilla 코드(pages/, api/, js/)와 신규 React 코드(app/, components/, lib/)를 1:1 대조하여 누락된 비즈니스 로직을 보완하고, 전체 통합 디버깅을 수행한다.

## Prerequisites
- S1~S3 전체 완료

## Specific Instructions

### 1. 기존 코드 핵심 파일 읽기 + 신규 코드 대조
각 기존 파일의 핵심 로직을 읽고, 신규 코드에 반영되었는지 확인.

### 2. 보완 대상 (이미 확인된 누락 목록)

#### Critical
- 감성 기반 모델 라우팅: app/api/chat/route.ts가 emotionLevel을 실제로 사용하지 않음
- 컨텍스트 오버플로 처리: 긴 대화 시 자동 압축 로직 없음

#### High
- 커뮤니티 API 백엔드 누락: app/api/community/ 라우트 없음 (페이지만 있음)
- 봇 템플릿 선택 흐름: templates/ 데이터를 Create 위저드에서 활용 안 함
- 회원가입/비밀번호 재설정 페이지 없음

#### Medium
- RAG 통합: KB 임베딩은 있지만 대화 API에서 참조 안 함
- Growth/레벨 시스템: XP 계산 로직 전체 누락
- 결제: Toss → 무통장 입금으로 변경 (S4BA2 수정)

### 3. 보완 실행
누락 항목별로 기존 Vanilla 파일을 참조하여 React 코드에 로직 추가/수정.

### 4. 통합 디버깅
- TypeScript 타입 체크 (tsc --noEmit)
- 파일 간 import 정합성
- API 엔드포인트 ↔ 프론트엔드 연동 점검

## Execution Type
AI-Only

## Remarks
- 이 Task 완료 후 추가 보완 Task가 동적으로 생성될 수 있음
- S4의 첫 번째 Task로 실행 (다른 S4 Task보다 먼저)
