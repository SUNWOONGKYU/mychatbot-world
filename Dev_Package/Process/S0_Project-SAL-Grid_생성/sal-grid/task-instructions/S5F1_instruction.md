# S5F1: 접근성 개선 WCAG 2.2

## Task 정보
- **Task ID**: S5F1
- **Task Name**: 접근성 개선 WCAG 2.2
- **Stage**: S5 (품질 개선)
- **Area**: F (Frontend)
- **Dependencies**: S4F5, S4F6

## Task 목표

WCAG 2.2 AA 수준의 접근성 기준을 충족하도록 주요 UI 컴포넌트를 개선한다.

## 구현 범위

### 1. 이미지 대체 텍스트
- 모든 `<img>` 태그에 의미 있는 `alt` 텍스트 추가
- 장식용 이미지는 `alt=""`

### 2. ARIA 레이블
- 버튼/링크에 명확한 레이블 추가
- 아이콘 버튼: `aria-label` 필수
- 모달/다이얼로그: `role="dialog"`, `aria-labelledby`

### 3. 키보드 내비게이션
- Tab 순서 논리적으로 정렬
- 포커스 가시성 확보 (`:focus-visible` 스타일)
- 모달에서 포커스 트랩(focus trap)

### 4. 색상 대비
- 텍스트 색상 대비 비율 4.5:1 이상 (일반 텍스트)
- 대형 텍스트 3:1 이상
- 현재 디자인 토큰 검토 및 수정

### 5. 스크린 리더 지원
- 채팅 메시지 영역에 `aria-live="polite"` 추가
- 로딩 상태 `aria-busy` 처리
- 오류 메시지 `aria-describedby`

### 검사 도구
```bash
# axe-core 기반 자동 검사
npm install -D @axe-core/playwright
```

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| 주요 컴포넌트 `.tsx` 파일들 | ARIA 레이블, alt 텍스트 추가 |
| `app/globals.css` 또는 디자인 토큰 | 색상 대비 수정 |

## 완료 기준

- [ ] axe-core 자동 검사 오류 0건
- [ ] 키보드만으로 핵심 기능 사용 가능
- [ ] 색상 대비 4.5:1 이상 준수
- [ ] 이미지 alt 텍스트 완비
