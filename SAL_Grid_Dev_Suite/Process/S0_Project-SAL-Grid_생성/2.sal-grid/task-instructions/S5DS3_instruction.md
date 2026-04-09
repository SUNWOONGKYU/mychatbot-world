# S5DS3: 핵심 컴포넌트 디자인 스펙

## Task 정보
- **Task ID**: S5DS3
- **Task Name**: 핵심 컴포넌트 디자인 스펙
- **Stage**: S5 (디자인 혁신)
- **Area**: DS (Design)
- **Dependencies**: S5DS1, S5DS2

## Task 목표

S5DS1(네비게이션 구조)과 S5DS2(컬러 시스템)를 기반으로 MCW 전면 리디자인에 사용될 핵심 컴포넌트의 디자인 스펙을 정의한다. 버튼, 카드, 인풋, 배지, 모달 등 재사용 컴포넌트의 크기/컬러/타이포그래피/상태(hover/active/disabled) 스펙을 포함한다.

## 산출물 (이미 완료)

이 Task는 소급(Retroactive) Task로, 기획 산출물이 이미 존재한다.

| 파일 | 내용 |
|------|------|
| `zz_KingFolder/_TalkTodoPlan/2026_04_07__P3_컴포넌트_디자인_스펙.md` | 핵심 컴포넌트 전체 스펙 완료 |

## 주요 설계 내용

1. **Button 컴포넌트**: BtnPrimary / BtnSecondary / BtnGhost / BtnDanger — 크기 sm/md/lg
2. **Card 컴포넌트**: BotCard / SkillCard / JobCard / PostCard — hover 애니메이션 포함
3. **Input/Form 컴포넌트**: Input / Textarea / Select / Checkbox / Toggle — 포커스 링 스펙
4. **Badge 컴포넌트**: 상태 배지 / 카테고리 배지 / 수익 배지
5. **디자인 토큰 전역 변수**: CSS 변수 정의 (globals.css 구조)
6. **Pretendard 폰트**: 타이포그래피 스케일 (text-xs ~ text-7xl)

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `zz_KingFolder/_TalkTodoPlan/2026_04_07__P3_컴포넌트_디자인_스펙.md` | 신규 생성 (기획 완료) |
