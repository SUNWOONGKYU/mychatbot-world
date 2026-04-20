# S5DB1 검증 지침: Database 타입 자동 생성 적용

## 검증 에이전트
`database-developer-core`

## 검증 항목

### 1. 타입 파일 존재
- [ ] `lib/database.types.ts` 파일 존재
- [ ] 파일이 실제 DB 테이블 구조를 반영 (주요 테이블 타입 포함)

### 2. 스크립트 설정
- [ ] `package.json`에 `gen:types` 스크립트 존재
- [ ] 스크립트 실행 시 타입 파일 재생성 가능

### 3. 적용 확인
- [ ] Supabase 클라이언트 파일에서 생성된 타입 사용
- [ ] `createClient<Database>()` 패턴 또는 동등한 방식 적용

### 4. 빌드
- [ ] `npm run build` 성공 (타입 에러 없음)
- [ ] `npm run test` 통과

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
