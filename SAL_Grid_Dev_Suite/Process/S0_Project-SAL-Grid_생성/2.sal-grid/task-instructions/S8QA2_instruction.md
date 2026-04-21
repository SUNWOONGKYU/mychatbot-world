# S8QA2: 프로덕션 E2E 검증 (봇·음성·관리자 플로우)

## Task 정보
- **Task ID**: S8QA2
- **Stage**: S8
- **Area**: QA
- **Dependencies**: S8QA1
- **Execution Type**: Human-AI

## Task 목표

배포 완료 후 사용자 피드백 3건의 실제 해결 여부를 프로덕션 환경에서 검증한다.

## 검증 플로우

### 1) 봇 페이지 페르소나 이름
- URL: `https://mychatbot.world/bot/gim-byeonhosa`
- 비로그인 상태에서 접속
- 1번째 페르소나 이름이 "AI Assistant"가 아닌 실제 이름으로 표시되는지 확인

### 2) 음성/텍스트 모드 토글
- 위 페이지에서 "🎙️ 음성" 탭 선택 → 마이크 권한 허용 → 녹음 → 텍스트 탭으로 전환
- 녹음이 자동 정지되는지, 모드 전환 UI가 시각적으로 드러나는지 확인

### 3) 관리자 자동 로그인
- wksun999 계정(`is_admin=true`)으로 로그인
- `/mypage` → 사이드바 최하단 "🔒 관리자 대시보드" 클릭
- `/admin` 진입 시 비밀번호 폼 없이 즉시 대시보드 표시되는지 확인
- 비관리자 계정은 /admin 접근 시 "권한 없음" 메시지 확인

### 4) 부수 체크
- `/mypage` 사이드바 220px 고정 유지(recent commit 2d3c7c5)
- 4대 네비(Birth/Skills/Jobs/Community) 변화 없음
