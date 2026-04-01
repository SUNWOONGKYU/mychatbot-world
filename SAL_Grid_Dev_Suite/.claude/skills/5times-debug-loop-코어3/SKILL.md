---
description: "5회 반복 디버깅 루프 — 문제를 분석하고 수정하고 검증하며 최대 5회 반복. 시각적 결과물이 있는 경우 Playwright 스크린샷으로 자동 검증"
user-invocable: true
---

# /5times-debug-loop

**문제를 분석 → 수정 → 검증 → 재분석**을 **최대 5회 반복**하여 자동으로 해결한다.
시각적 결과물(UI/CSS/HTML)이 있는 경우, Playwright 스크린샷으로 검증한다.

## 빠른 실행

```
사용자: "/5times-debug-loop
         문제: [문제 설명]
         파일: [수정 대상 파일]
         검증방법: [스크린샷 URL / 테스트 명령어 / 로그 확인 등]"

→ 최대 5회 루프 자동 실행
```

---

## 루프 구조 (최대 5회)

```
Round N:
  1. 문제 분석 (현재 상태 파악)
  2. 원인 진단 (근본 원인 특정)
  3. 수정 (코드/설정 변경)
  4. 검증 (결과 확인)
     ├─ 시각적 결과물 → Playwright 스크린샷 촬영 + Read tool로 분석
     ├─ 코드/로직 → 테스트 실행 / 빌드 확인
     └─ API/서버 → 응답 확인 / 로그 분석
  5. 완료 판정 → OK면 종료, 아니면 다음 Round
```

---

## 검증 방법별 가이드

### 1. 시각적 결과물 (UI/CSS/HTML) — Playwright 스크린샷

```bash
# 기본 (1440×900)
npx playwright screenshot "[URL]" /c/Users/home/AppData/Local/Temp/debug_shot_N.png \
  --viewport-size="1440,900" \
  --wait-for-timeout=3000

# 모바일 (390×844)
npx playwright screenshot "[URL]" /c/Users/home/AppData/Local/Temp/debug_shot_mobile_N.png \
  --viewport-size="390,844" \
  --wait-for-timeout=3000
```

**PNG 읽기:**
```
Read tool → file_path: "C:/Users/home/AppData/Local/Temp/debug_shot_N.png"
```

**체크 항목:**
| 항목 | 확인 내용 |
|------|----------|
| 여백 | 요소 주변 불필요한 공백 크기 |
| 오버플로우 | 콘텐츠가 화면 밖으로 나가는지 |
| 정렬 | 요소들이 의도한 위치에 있는지 |
| 비율 | SVG/이미지 종횡비 유지 여부 |
| 반응형 | 뷰포트 크기에 따라 레이아웃 변화 |
| 폰트/색상 | 텍스트 가독성, 색상 대비 |

### 2. 코드/빌드 — 명령어 실행

```bash
# 빌드 확인
npm run build

# 타입 체크
npx tsc --noEmit

# 테스트
npm test
```

### 3. API/서버 — 응답 확인

```bash
curl -s "[URL]" | head -50
```

---

## 배포 패턴 (시각적 결과물 수정 후)

### Vercel CLI
```bash
cd [repo-root] && vercel --prod
# ⚠️ 서브폴더에서 실행 금지 (rootDirectory 설정 충돌)
```

### Git Push (GitHub Pages 등)
```bash
git add . && git commit -m "fix: ..." && git push
```

---

## 완료 판정 기준

루프를 **조기 종료**하는 조건:
- ✅ 문제가 해결된 경우 (스크린샷/테스트/로그로 확인)
- ✅ 사용자가 "OK" / "퍼펙트" / "좋아" 라고 한 경우

**5회 소진 후에도 미해결 시:**
```
"5회 디버깅 루프 완료. 현재 상태:
- Round 1: [문제] → [시도]
- Round 2: [문제] → [시도]
...
- 남은 문제: [설명]
- 제안: [다음 접근법]"
```

---

## 자주 쓰는 CSS 수정 패턴

### SVG 지도 여백 제거
```css
/* 원인: viewBox가 실제 콘텐츠보다 넓음 */
viewBox="[left] [top] [width] [height]"  /* 타이트하게 조정 */

/* 원인: height:100% + width:auto → 실제 width 작음 */
#svg { height: calc(100vh - Npx); width: auto; }
```

### Flex 컨테이너 여백 제거
```css
.container { width: fit-content; }
.parent { align-items: center; }  /* 자식이 내용 크기로 */
```

### 전체 화면 높이 고정 (스크롤 없음)
```css
html, body { height: 100vh; overflow: hidden; }
.main { height: calc(100vh - [header]px); overflow: hidden; }
.side-col { height: 100%; overflow-y: auto; }
```

### 범례/오버레이 절대 배치
```css
.container { position: relative; }
.legend {
  position: absolute;
  bottom: 20px; right: 20px;
  background: rgba(255,255,255,0.92);
  border-radius: 10px; padding: 8px 10px;
  border: 1px solid #e5e7eb;
}
```

---

## 실전 교훈 (2026-03-14, election-map-pages)

| 문제 | 원인 | 해결 |
|------|------|------|
| SVG 옆에 여백 많음 | SVG viewBox가 실제 지도보다 넓음 + 요소 크기 불일치 | viewBox 타이트하게 + `width:auto; height:calc(100vh-Npx)` |
| 지도가 납작해짐 | `width:auto` flex item = 100% 아님, SVG 기본 크기(300px) | 명시적 height + wrapper div |
| 범례 위치 이상 | flex row 안에 있어서 SVG 너비 잡아먹음 | `position:absolute`로 빈 공간에 overlay |
| 카드 너비 조정 | grid column px 직접 수정 | `200px → 240px` (20% 증가) |
| `width:fit-content` 무시됨 | flex item은 항상 block → `align-items: center` 필요 | 부모에 `align-items: center` + `width: fit-content` |

---

## 스킬 호출 예시

### 시각적 문제
```
/5times-debug-loop
URL: https://election-map-pages.vercel.app
문제: 지도 우측 여백 너무 많고 카드가 좁음
파일: C:/Development_PoliticianFinder_com/election-map-pages/index.html
검증방법: Playwright 스크린샷 (1440x900)
배포방식: vercel --prod (election-map-pages 폴더에서)
```

### 빌드/코드 문제
```
/5times-debug-loop
문제: TypeScript 빌드 오류
파일: 1_Frontend/src/app/api/report-purchase/route.ts
검증방법: npm run build
```
