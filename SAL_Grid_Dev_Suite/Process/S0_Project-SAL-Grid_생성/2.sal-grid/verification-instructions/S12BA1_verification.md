# S12BA1 Verification

## 검증 범위
- /api/bots 응답에 order_index, last_active, unread_count 포함
- Bearer 인증 유지

## 검증 방법
1. `tsc --noEmit` 통과
2. curl 로 `/api/bots` 호출 (Bearer 포함) → JSON 스키마 검사
3. 미인증 호출 → 401 확인
4. 응답 배열 order_index 기준 정렬 확인

## 합격 기준
- 응답 필드 3개 모두 존재
- 인증/정렬 정상
