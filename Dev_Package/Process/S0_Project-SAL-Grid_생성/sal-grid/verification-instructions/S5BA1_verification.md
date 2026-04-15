# S5BA1 검증 지침: 서버 측 입력 검증 강화 (Zod)

## 검증 에이전트
`code-reviewer-core`

## 검증 항목

### 1. Zod 설치 확인
- [ ] `package.json`에 `zod` 의존성 존재

### 2. 스키마 파일 존재
- [ ] `lib/validations/` 디렉토리 또는 동등한 경로에 스키마 파일 존재

### 3. API 엔드포인트 적용 확인
- [ ] `app/api/chat/route.ts`에 Zod 검증 적용
- [ ] 빈 메시지 전송 시 400 Bad Request 반환
- [ ] 4000자 초과 메시지 시 400 반환

### 4. 어드민 API 검증
- [ ] `app/api/admin/*/route.ts` 관련 엔드포인트에 검증 적용

### 5. 테스트
- [ ] Zod 검증 관련 단위 테스트 존재
- [ ] `npm run test` 통과

### 6. 빌드
- [ ] `npm run build` 성공

## 합격 기준
위 모든 항목 Pass 시 Verified 처리
