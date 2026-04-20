# S5DB2 검증 지침: Supabase RLS 전면 감사

## 검증 에이전트
`security-specialist-core`

## 검증 항목

### 1. 감사 SQL 스크립트 존재
- [ ] RLS 감사 SQL 파일 존재
- [ ] 수정 내역이 문서화됨

### 2. RLS 활성화 확인
- [ ] 주요 테이블(profiles, chatbots, conversations, messages)에 RLS 활성화
- [ ] RLS 없는 테이블이 있다면 의도적 예외인지 명시

### 3. 정책 적절성
- [ ] 각 테이블의 소유자 기반 정책 존재 (auth.uid() = user_id)
- [ ] anon 역할에 불필요한 쓰기 권한 없음

### 4. 테스트 케이스
- [ ] 다른 사용자 데이터 접근 불가 테스트 케이스 존재
- [ ] 테스트 결과 Pass 확인

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
