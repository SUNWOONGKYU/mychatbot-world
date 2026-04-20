# 접근성 감사 리포트 (WCAG 2.1 AA)

> @task S9FE3
> 기준: WCAG 2.1 Level A + AA
> 도구: `@axe-core/playwright` + 수동 키보드 테스트

## 감사 범위 (10 페이지)

1. `/` — Landing
2. `/skills` — 스킬 카탈로그
3. `/community` — 커뮤니티
4. `/customer-service` — 고객지원
5. `/login` — 로그인
6. `/signup` — 회원가입
7. `/jobs` — 구인
8. `/terms` — 이용약관
9. `/privacy` — 개인정보처리방침
10. `/refund` — 환불정책

## 자동화

### 실행

```bash
# 프로덕션 대상
TEST_BASE_URL=https://mychatbot.world pnpm test:a11y

# 로컬
pnpm dev &
TEST_BASE_URL=http://localhost:3000 pnpm test:a11y
```

### CI
- `.github/workflows/e2e.yml` → "Run Axe WCAG AA a11y audit" step
- PR 트리거 + push to main

## 기준 (S9FE3)

| Severity | 허용 건수 |
|----------|----------:|
| Critical | 0 |
| Serious | 0 |
| Moderate | ≤ 3 (개선 계획 병행) |
| Minor | ≤ 10 |

## 중점 체크 항목

### 필수 (Critical)
- [ ] 모든 `<img>`에 `alt` 속성 (장식용은 `alt=""`)
- [ ] form 요소에 `<label>` 또는 `aria-label`
- [ ] 고유한 `id` (중복 없음)
- [ ] 페이지당 하나의 `<h1>`
- [ ] `<html lang="ko">` 선언

### Serious
- [ ] 색 대비: 일반 텍스트 4.5:1, 대형 3:1
- [ ] focus indicator 보임 (outline 제거 시 대체 제공)
- [ ] 키보드만으로 모든 기능 접근 가능
- [ ] `aria-expanded`, `aria-controls` 정확
- [ ] 에러 메시지와 입력 필드 연결 (`aria-describedby`)

### Moderate
- [ ] 링크 텍스트 명확 ("여기 클릭" 금지)
- [ ] 랜드마크 역할 사용 (`<nav>`, `<main>`, `<footer>`)
- [ ] skip link 제공
- [ ] 애니메이션 prefers-reduced-motion 존중

## 수동 테스트 체크리스트

### 키보드 내비게이션
- [ ] Tab 순서가 논리적
- [ ] 모달 열림 시 focus trap
- [ ] ESC로 모달 닫기
- [ ] Enter로 버튼 활성화

### 스크린 리더 (NVDA/VoiceOver)
- [ ] 페이지 구조가 낭독됨 (제목·리스트·링크)
- [ ] 동적 콘텐츠 `aria-live` 알림
- [ ] 아이콘 버튼에 보조 텍스트

### 확대
- [ ] 200% 확대 시 가로 스크롤 없음
- [ ] 400% 확대 시 핵심 기능 유지

## 실측 결과 (PO 실행 후 기록)

| Page | Critical | Serious | Moderate | Minor | 상태 |
|------|---------:|--------:|---------:|------:|------|
| `/` | _ | _ | _ | _ | |
| `/skills` | _ | _ | _ | _ | |
| `/community` | _ | _ | _ | _ | |
| `/support` | _ | _ | _ | _ | |
| `/login` | _ | _ | _ | _ | |
| `/signup` | _ | _ | _ | _ | |
| `/pricing` | _ | _ | _ | _ | |
| `/legal/terms` | _ | _ | _ | _ | |
| `/legal/privacy` | _ | _ | _ | _ | |
| `/legal/refund` | _ | _ | _ | _ | |

## 이력

- 2026-04-20: 10페이지 감사 테스트 + 리포트 템플릿 (S9FE3)
- 2026-__-__: 1차 실측 (PO 실행 후 기록)
