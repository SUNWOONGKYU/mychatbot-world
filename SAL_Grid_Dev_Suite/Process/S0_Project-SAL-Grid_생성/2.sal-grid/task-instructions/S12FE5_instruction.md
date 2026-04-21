# S12FE5: + 탭 → Birth 위저드 모달

## Task 정보
- **Task ID**: S12FE5
- **Stage**: S12 / **Area**: FE
- **Dependencies**: S12FE4

## 목표
`+` 탭 클릭 시 Birth 위저드(Step1~Step8)를 모달로 띄우고, 완료 시 새 봇을 맨 오른쪽 탭으로 추가 + 자동 활성화한다.

## 생성/수정 파일
- `components/hub/BirthWizardModal.tsx` (Dialog 래퍼)
- `app/create/` 의 Step1~Step8 컴포넌트를 재사용 (page 가 아닌 컴포넌트 export 필요 시 리팩토링)

## 구현 포인트
- 모달 오픈 시 스크롤 락
- Step8 완료 후 `/api/bots` refetch → 새 봇 목록에 추가 → setActive(new.id)
- 10개 도달 시 + 탭 disabled (S12FE2 에서 처리), 모달 열리지 않음
- esc/배경클릭 닫기 → 위저드 진행 중이면 "정말 나가시겠습니까?" confirm

## 주의
- Birth 위저드 자체 로그인 필수 정책 유지 (project_wizard_auth_policy)
- hub 는 이미 로그인 필수이므로 추가 게이트 불필요
