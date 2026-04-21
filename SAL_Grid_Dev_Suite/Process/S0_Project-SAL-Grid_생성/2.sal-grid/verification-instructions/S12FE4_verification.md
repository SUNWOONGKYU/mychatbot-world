# S12FE4 Verification

## 검증 범위
- 활성 탭의 ChatWindow 만 마운트
- 전환 시간 <150ms
- Lazy 로드

## 검증 방법
1. `tsc --noEmit` 통과
2. React DevTools / Playwright DOM count: `querySelectorAll('[data-chat-window]').length === 1`
3. performance.now() 전환 전/후 차이 측정 → <150ms
4. 네트워크 탭에서 별도 chunk 로드 확인 (초기 진입 시 ChatWindow 번들 지연 로드)

## 합격 기준
- 모든 KPI 통과
