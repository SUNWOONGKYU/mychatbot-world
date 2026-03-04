# S4F2: 스킬 마켓플레이스 UI

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S4F2 |
| Task 이름 | 스킬 마켓플레이스 UI |
| Stage | S4 — 개발 마무리 |
| Area | F — Frontend |
| Dependencies | S3F5, S4BA2 |
| 실행 방식 | AI-Only |

## 배경 및 목적

챗봇 소유자가 자신이 개발한 스킬을 등록하고, 다른 사용자가 구매하거나 설치할 수 있는 마켓플레이스를 제공한다. S4BA2의 마켓플레이스 API와 연동한다.

## 세부 작업 지시

1. pages/marketplace/ 폴더 생성 및 페이지 작성:
   - index.html: 스킬 탐색 페이지 (카테고리 필터, 검색, 스킬 카드 목록)
   - upload.html: 스킬 업로드 페이지 (이름, 설명, 가격, 파일 업로드)
   - detail.html: 스킬 상세 페이지 (설명, 리뷰, 설치 버튼)

2. 스킬 카드 컴포넌트:
   - 스킬 이름, 카테고리, 가격 (크레딧 or 무료)
   - 설치 수, 평점
   - "설치하기" / "이미 설치됨" 버튼

3. S4BA2 API 연동:
   - GET /api/marketplace/skills (목록)
   - POST /api/marketplace/publish (업로드)
   - POST /api/marketplace/install/:skillId (설치)

4. 마이페이지(S3F5)에 "내 스킬" 탭 추가

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| pages/marketplace/index.html | 스킬 탐색 페이지 신규 생성 |
| pages/marketplace/upload.html | 스킬 업로드 페이지 신규 생성 |
| pages/marketplace/detail.html | 스킬 상세 페이지 신규 생성 |
| pages/mypage/index.html | "내 스킬" 탭 추가 |

## 완료 기준
- [ ] pages/marketplace/ 3개 페이지 생성
- [ ] 스킬 목록 API 데이터 표시
- [ ] 스킬 업로드 폼 동작
- [ ] 설치 버튼 API 연동
- [ ] 검색/필터 기능
- [ ] @task S4F2 주석 포함
- [ ] 모바일 반응형
