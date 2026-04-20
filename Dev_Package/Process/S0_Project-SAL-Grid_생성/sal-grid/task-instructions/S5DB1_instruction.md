# S5DB1: Database 타입 자동 생성 적용

## Task 정보
- **Task ID**: S5DB1
- **Task Name**: Database 타입 자동 생성 적용
- **Stage**: S5 (품질 개선)
- **Area**: DB (Database)
- **Dependencies**: S4DB1

## Task 목표

Supabase CLI의 `gen types` 명령을 사용하여 데이터베이스 스키마에서 TypeScript 타입을 자동 생성하고, 코드 전반에 적용한다. 타입 불일치로 인한 런타임 오류를 컴파일 타임에 잡는다.

## 구현 범위

### 1. 타입 생성 명령
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
```

### 2. package.json 스크립트 추가
```json
{
  "scripts": {
    "gen:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/database.types.ts"
  }
}
```

### 3. 적용 범위
- `lib/supabase*.ts` 파일에서 생성된 타입 import
- API 라우트에서 DB 응답 타입 명시
- Supabase 클라이언트에 타입 파라미터 적용

### 4. CI 연동 (선택)
- GitHub Actions에서 스키마 변경 시 타입 재생성 자동화

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/database.types.ts` | 자동 생성된 DB 타입 파일 |
| `package.json` | gen:types 스크립트 추가 |
| `lib/supabase-client.ts` 등 | 생성된 타입 적용 |

## 완료 기준

- [ ] `lib/database.types.ts` 생성 완료
- [ ] `npm run gen:types` 명령 동작
- [ ] 주요 Supabase 클라이언트에 타입 적용
- [ ] 빌드 성공 (타입 에러 없음)
