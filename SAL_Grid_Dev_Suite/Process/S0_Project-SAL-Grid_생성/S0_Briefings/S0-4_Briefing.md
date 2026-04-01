# viewer

## 개요

SAL Grid 데이터를 **시각적으로 조회**할 수 있는 HTML 뷰어를 제공합니다.

## 뷰어 종류

### JSON Method 용 (기본)
- `viewer_json.html`: PC용 / JSON 파일 (내 프로젝트)
- `viewer_mobile_json.html`: 모바일용 / JSON 파일

### Database Method 용 (선택)
- `viewer_database.html`: PC용 / Supabase DB (예시용, SSAL Works 데이터)
- `viewer_mobile_database.html`: 모바일용 / Supabase DB

## 제공 기능

### 전체 현황 대시보드
- Stage별 진행률 (막대 그래프)
- Area별 분포 (파이 차트)
- 완료/진행중/대기 Task 카운트

### Task 목록
- Stage/Area 필터링
- 상태별 필터링 (Pending/In Progress/Executed/Completed)
- 검색 기능

### Task 상세 정보
- 22개 속성 전체 표시
- 의존성 Task 링크
- 검증 결과 확인

## 저장 위치

```
S0_Project-SAL-Grid_생성/
└── viewer/
    ├── viewer_json.html
    └── viewer_mobile_json.html
```

## 사용 방법

1. `viewer_json.html` 파일을 브라우저에서 엽니다
2. JSON 파일 경로가 올바른지 확인합니다
3. 새로고침하여 최신 데이터를 반영합니다

## 참고사항

- 뷰어는 **읽기 전용**입니다. 데이터 수정은 JSON 파일에서 직접 수행합니다.
- 모바일에서는 `viewer_mobile_json.html`을 사용하세요.

