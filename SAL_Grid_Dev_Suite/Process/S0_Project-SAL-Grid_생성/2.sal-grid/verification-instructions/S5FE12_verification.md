# S5FE12 Verification Instruction

## 검증 항목

### 1. CSS 문법 검증
- globals.css 파일이 CSS 파싱 에러 없이 유효한가
- CSS 변수 참조가 모두 올바른가 (`rgb(var(--xxx))` 패턴)

### 2. 다크/라이트 일관성 검증
- `.dark` 클래스에서 보더 변수가 반투명 화이트인가
- `.light` 클래스에서 보더 변수가 기존 유지인가
- 그림자 변수가 다크/라이트 양쪽 정의되어 있는가

### 3. 유틸 클래스 검증
- `.text-hero`, `.text-display`, `.text-h1`, `.text-h2` letter-spacing 클래스 존재
- `.card-hover:hover` 퍼플 글로우 클래스 존재
- `.tabular-nums` 클래스 존재

### 4. 기존 호환성 검증
- 기존 CSS 변수(--shadow-sm, --shadow-md 등)가 덮어쓰기 아닌 업데이트인가
- 기존 컴포넌트가 참조하는 변수명이 유지되는가

### 5. 빌드 검증
- `npx tsc --noEmit --skipLibCheck` 에러 없음

## 검증 기준
- PASS: 위 5개 항목 모두 통과
- NEEDS FIX: 하나라도 실패
