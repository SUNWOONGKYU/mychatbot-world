# S4F4: 상속 설정 UI

## Task 정보
| 항목 | 값 |
|------|---|
| Task ID | S4F4 |
| Task 이름 | 상속 설정 UI |
| Stage | S4 — 개발 마무리 |
| Area | F — Frontend |
| Dependencies | S3F5, S4BA3 |
| 실행 방식 | AI-Only |

## 배경 및 목적

디지털 자산(챗봇)의 상속 설정 기능을 마이페이지에 추가한다. 사용자가 자신의 챗봇을 지정된 상속인에게 이전할 수 있도록 설정한다.

## 세부 작업 지시

1. pages/mypage/inheritance.html 생성:
   - 상속인 이메일 입력 필드
   - 상속 대상 봇 선택 (체크박스)
   - 상속 조건 설정 (사용 중지 후 N개월 경과)
   - 현재 상속 설정 목록 표시
   - 상속 취소/수정 기능

2. 상속 수락 페이지 (수락 이메일 링크에서 접근):
   - pages/mypage/inheritance-accept.html
   - 상속 요청 정보 표시
   - 수락/거절 버튼

3. S4BA3 API 연동:
   - POST /api/inheritance (상속 설정)
   - PATCH /api/inheritance/:id/accept (수락)
   - GET /api/inheritance (설정 목록)

4. 마이페이지(S3F5)에 "상속 설정" 메뉴 탭 추가

## 생성/수정 대상 파일
| 파일 경로 | 변경 내용 |
|----------|----------|
| pages/mypage/inheritance.html | 상속 설정 페이지 신규 생성 |
| pages/mypage/inheritance-accept.html | 상속 수락 페이지 신규 생성 |
| pages/mypage/index.html | 상속 설정 탭 추가 |

## 완료 기준
- [ ] pages/mypage/inheritance.html 생성
- [ ] 상속인 이메일 입력 및 저장 동작
- [ ] 상속 대상 봇 선택 가능
- [ ] 현재 상속 설정 목록 표시
- [ ] inheritance-accept.html 생성 및 수락 API 연동
- [ ] @task S4F4 주석 포함
- [ ] 모바일 반응형
