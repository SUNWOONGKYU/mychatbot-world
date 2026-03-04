---
description: "이미지 생성 종합 시스템 (SVG/HTML/Mermaid/Pillow)"
user-invocable: true
---

# Create Image (이미지 생성 종합 시스템)

이미지를 만들어야 할 때 이 시스템을 따른다. 상황에 맞는 최적의 방식을 선택하여 서브 에이전트에게 위임한다. 모델은 작업 복잡도에 따라 선택: 단순 변환=haiku, 복잡한 디자인/레이아웃=sonnet.

## Phase 1. 방식 선택 (Decision Tree)

### 빠른 판단 플로우

```
이미지가 필요하다
  ├─ 표준 다이어그램인가? (시퀀스/간트/ER/클래스)
  │   └─ YES → Mermaid (가장 빠름)
  │
  ├─ 복잡한 레이아웃/표/대시보드인가?
  │   └─ YES → HTML→PNG (CSS 자유도 최고)
  │
  ├─ 조직도/플로우차트/구조도인가?
  │   └─ YES → SVG (확대 가능, 편집 쉬움)
  │
  ├─ 사진 위 텍스트/이미지 합성인가?
  │   └─ YES → Python Pillow (픽셀 제어)
  │
  └─ 잘 모르겠다 → HTML (가장 범용적)
```

### 방식별 비교표

| 방식 | 확장자 | 최적 용도 | 장점 | 단점 | PNG 변환 |
|------|--------|----------|------|------|---------|
| **Mermaid** | .md/.html | 시퀀스/간트/ER/클래스 다이어그램 | 텍스트 기반, 빠름, 유지보수 쉬움 | 커스텀 디자인 제한 | 브라우저 스크린샷 |
| **HTML→PNG** | .html→.png | 표/대시보드/카드 UI/복잡한 레이아웃 | CSS 자유도 최고, 반응형, 한글 완벽 | 변환 도구 필요 | Puppeteer/Chrome |
| **SVG** | .svg→.png | 조직도/플로우차트/아이콘/로고 | 확대해도 선명, 편집 쉬움, 텍스트 정확 | 복잡한 레이아웃 어려움 | cairosvg/Inkscape |
| **Pillow** | .png | 픽셀 제어/이미지 합성/썸네일 | 프로그래밍 자유도 높음 | 한글 이모지 깨짐, 레이아웃 어려움 | 불필요 (직접 PNG) |

---

## Phase 2. 방식별 서브 에이전트 템플릿

### 1. Mermaid 방식 (권장: 표준 다이어그램)

**언제:** 표준 다이어그램 타입, 빠르게 만들어야 할 때, 마크다운 문서에 포함할 때

**서브 에이전트 프롬프트:**
```markdown
너는 Mermaid 다이어그램 전문가다.

## 임무
[요구사항을 구체적으로 설명]

## 출력
- 파일: C:/Users/home/Desktop/[파일명].html
- 형식: HTML 파일 안에 Mermaid CDN + 다이어그램 코드 포함

## 기술 조건
- Mermaid CDN 사용: <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
- 초기화 코드: <script>mermaid.initialize({startOnLoad:true, theme:'default'});</script>
- 다이어그램 타입: [flowchart|sequenceDiagram|gantt|erDiagram|classDiagram|gitGraph]
- 테마: default (밝음) 또는 dark (어두움)
- 한글 레이블 지원
- 페이지 전체 중앙 정렬
- 배경색: 흰색 (#ffffff)

## 제약사항
- 외부 파일 의존 금지 (모든 것을 하나의 HTML에)
- 인라인 스타일로 다이어그램 컨테이너 중앙 정렬
- 브라우저에서 바로 열 수 있어야 함

## 완료 보고
파일 저장 완료 후 "done" 보고.
```

**에이전트 설정:**
- `model: "haiku"`
- `subagent_type: "general-purpose"`
- `mode: "bypassPermissions"`

**지원 다이어그램 타입:**
- `flowchart` - 플로우차트 (TB/LR 방향 설정 가능)
- `sequenceDiagram` - 시퀀스 다이어그램
- `gantt` - 간트 차트 (일정 관리)
- `erDiagram` - ER 다이어그램 (데이터베이스 설계)
- `classDiagram` - 클래스 다이어그램 (객체 지향 설계)
- `gitGraph` - Git 브랜치 그래프

**PNG 변환 (필요시):**
```bash
# Chrome headless로 스크린샷
chrome --headless --screenshot=output.png --window-size=1600,1200 "file:///C:/Users/home/Desktop/diagram.html"

# 또는 Puppeteer
npx puppeteer screenshot --url "file:///C:/Users/home/Desktop/diagram.html" --output diagram.png --width 1600 --full-page
```

---

### 2. HTML→PNG 방식 (권장: 복잡한 레이아웃)

**언제:** 복잡한 레이아웃, 표, 대시보드, 카드 UI, CSS 그리드/플렉스 필요

**서브 에이전트 프롬프트:**
```markdown
너는 HTML/CSS 디자인 전문가다.

## 임무
[요구사항을 구체적으로 설명]

## 출력
- 파일: C:/Users/home/Desktop/[파일명].html
- 최종: C:/Users/home/Desktop/[파일명].png (변환 필요)

## 기술 조건
- 단일 HTML 파일 (모든 CSS는 <style> 태그 안에 인라인으로)
- 외부 CDN/라이브러리 절대 금지 (완전 오프라인 동작)
- font-family: 'Malgun Gothic', 'Microsoft Sans Serif', sans-serif
- 배경색 반드시 포함 (body {background: #f5f5f5;} 등)
- 고정 너비 권장: 1200px (스크린샷 최적화)
- 카드/컨테이너: 흰색 배경 + box-shadow로 입체감
- 반응형 필요 시 @media 쿼리 사용
- 인쇄 최적화: @media print 스타일 포함

## 디자인 원칙
- 여백: padding/margin 충분히 (빽빽하지 않게)
- 폰트 크기: 최소 14px 이상 (가독성)
- 색상 대비: 배경과 텍스트 간 명도 차이 충분히
- 연한 회색 텍스트 금지 (모두 진하게)

## 제약사항
- 이모지는 사용 가능 (HTML은 렌더링 잘 됨)
- JavaScript 최소화 (정적 페이지 지향)
- 모든 리소스 인라인 (이미지는 data URI 또는 생략)

## 완료 보고
HTML 파일 저장 완료 후 "done" 보고.
PNG 변환은 별도 에이전트가 수행.
```

**에이전트 설정:**
- `model: "haiku"`
- `subagent_type: "general-purpose"`
- `mode: "bypassPermissions"`

**PNG 변환 (별도 에이전트 투입):**

서브 에이전트 프롬프트 (Bash 타입):
```markdown
너는 HTML→PNG 변환 전문가다.

## 임무
C:/Users/home/Desktop/[파일명].html을 PNG로 변환하라.

## 실행 방법 (우선순위)
1. Puppeteer 사용 (권장):
   ```bash
   npx puppeteer screenshot \
     --url "file:///C:/Users/home/Desktop/[파일명].html" \
     --output "C:/Users/home/Desktop/[파일명].png" \
     --width 1200 \
     --full-page
   ```

2. Chrome headless 사용 (대안):
   ```bash
   chrome --headless \
     --screenshot="C:/Users/home/Desktop/[파일명].png" \
     --window-size=1200,900 \
     "file:///C:/Users/home/Desktop/[파일명].html"
   ```

## 완료 보고
PNG 파일 생성 완료 후 "done" 보고.
```

**에이전트 설정:**
- `model: "haiku"`
- `subagent_type: "Bash"`
- `mode: "bypassPermissions"`

---

### 3. SVG 방식 (권장: 벡터 그래픽)

**언제:** 조직도, 플로우차트, 구조도, 아이콘, 로고 (확대/축소 필요, 나중에 편집 가능)

**서브 에이전트 프롬프트:**
```markdown
너는 SVG 디자인 전문가다.

## 임무
[요구사항을 구체적으로 설명]

## 출력
- 파일: C:/Users/home/Desktop/[파일명].svg
- 최종: C:/Users/home/Desktop/[파일명].png (필요시 변환)

## 기술 조건
- 순수 SVG XML (외부 의존성 절대 금지)
- font-family: 'Malgun Gothic', sans-serif
- viewBox 사용하여 반응형 (예: viewBox="0 0 800 600")
- 이모지 사용 금지 (텍스트 또는 SVG 도형으로 대체)
- text-anchor="middle" + dominant-baseline="middle"로 중앙 정렬
- filter로 drop-shadow 효과 가능
- <defs>로 재사용 요소 정의 (그라디언트, 패턴 등)

## 디자인 원칙
- 색상: 진하고 가독성 높게 (#333, #000 등)
- stroke-width: 최소 2px 이상 (선이 너무 얇으면 안 보임)
- 텍스트 크기: font-size 최소 16px
- 여백: 요소 간 충분한 간격

## 제약사항
- 이모지 절대 사용 금지 (SVG는 이모지 렌더링 불안정)
- 외부 이미지 참조 금지 (<image xlink:href> 사용 금지)
- 모든 스타일 인라인 또는 <style> 태그 내

## 완료 보고
SVG 파일 저장 완료 후 "done" 보고.
```

**에이전트 설정:**
- `model: "haiku"`
- `subagent_type: "general-purpose"`
- `mode: "bypassPermissions"`

**PNG 변환 (필요시, 별도 에이전트 투입):**

서브 에이전트 프롬프트 (Bash 타입):
```markdown
너는 SVG→PNG 변환 전문가다.

## 임무
C:/Users/home/Desktop/[파일명].svg를 PNG로 변환하라.

## 실행 방법 (우선순위)
1. cairosvg 사용 (권장):
   ```bash
   pip install cairosvg
   python -c "import cairosvg; cairosvg.svg2png(url='C:/Users/home/Desktop/[파일명].svg', write_to='C:/Users/home/Desktop/[파일명].png', output_width=1600)"
   ```

2. Inkscape CLI 사용 (대안):
   ```bash
   inkscape "C:/Users/home/Desktop/[파일명].svg" \
     --export-type=png \
     --export-filename="C:/Users/home/Desktop/[파일명].png" \
     --export-width=1600
   ```

3. Chrome headless 사용 (최종 대안):
   ```bash
   chrome --headless \
     --screenshot="C:/Users/home/Desktop/[파일명].png" \
     --window-size=1600,1200 \
     "C:/Users/home/Desktop/[파일명].svg"
   ```

## 완료 보고
PNG 파일 생성 완료 후 "done" 보고.
```

**에이전트 설정:**
- `model: "haiku"`
- `subagent_type: "Bash"`
- `mode: "bypassPermissions"`

---

### 4. Python Pillow 방식 (최후 수단)

**언제:** 픽셀 단위 제어, 기존 이미지 위에 텍스트 합성, 썸네일 생성, 배너 제작

**주의사항 (Windows 환경):**
- Windows malgun.ttf에서 이모지 렌더링 안 됨 (□로 깨짐)
- 이모지 대신 텍스트 또는 도형 사용 필수
- 텍스트 레이아웃 정밀 제어 어려움 → 가능하면 SVG나 HTML 사용 권장

**서브 에이전트 프롬프트:**
```markdown
너는 Python Pillow 이미지 생성 전문가다.

## 임무
[요구사항을 구체적으로 설명]

## 출력
- 파일: C:/Users/home/Desktop/[파일명].png

## 기술 조건
- from PIL import Image, ImageDraw, ImageFont
- 폰트 경로:
  - 일반: C:/Windows/Fonts/malgun.ttf
  - 볼드: C:/Windows/Fonts/malgunbd.ttf
- 이모지 절대 사용 금지 (Windows에서 렌더링 안 됨)
- 최소 폰트 크기: 18px
- 텍스트 색상: 진하게 (#000000, #333333 등)
- 연한 회색 텍스트 금지
- 배경색 반드시 설정

## 디자인 원칙
- 텍스트 정렬: textbbox() 사용하여 중앙/우측 정렬 계산
- 여백: 텍스트와 이미지 경계 간 충분한 간격
- 안티앨리어싱: ImageFont.truetype(..., size)로 폰트 크기 조절

## 코드 구조
```python
from PIL import Image, ImageDraw, ImageFont

# 이미지 생성
img = Image.new('RGB', (800, 600), color='white')
draw = ImageDraw.Draw(img)

# 폰트 로드
font = ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', 24)

# 텍스트 그리기
draw.text((400, 300), '텍스트 내용', fill='black', font=font, anchor='mm')

# 저장
img.save('C:/Users/home/Desktop/[파일명].png')
print('done')
```

## 제약사항
- 이모지 절대 사용 금지 (□로 깨짐)
- 복잡한 레이아웃은 SVG/HTML 권장
- 텍스트 여러 줄일 경우 수동으로 y 좌표 계산 필요

## 완료 보고
스크립트 실행하여 PNG 저장 완료 후 "done" 보고.
```

**에이전트 설정:**
- `model: "haiku"`
- `subagent_type: "general-purpose"`
- `mode: "bypassPermissions"`

---

## Phase 3. 공통 디자인 원칙

모든 방식에 적용되는 설계 원칙:

### 1. 가독성 최우선
- 최소 폰트 크기: 14px 이상 (HTML/SVG), 18px 이상 (Pillow)
- 연한 색 금지: 회색은 #666 이상으로 진하게
- 배경과 텍스트 명도 대비: 최소 4.5:1 (WCAG AA 기준)

### 2. 여백 균형
- 빽빽하지 않되 낭비 없이
- 요소 간 최소 간격: 8px~16px
- 외곽 여백: 20px~40px

### 3. 색상 대비
- 배경이 밝으면 텍스트는 어둡게 (#000, #333)
- 배경이 어두우면 텍스트는 밝게 (#fff, #f5f5f5)
- 강조색 사용 시 충분한 채도

### 4. 한글 폰트 필수
- Malgun Gothic (맑은 고딕) 필수 지정
- 대체 폰트: 'Microsoft Sans Serif', sans-serif

### 5. 이모지 주의
- **사용 가능:** HTML, Mermaid, SVG (브라우저 렌더링)
- **사용 금지:** Python Pillow (Windows에서 깨짐)

### 6. 파일 위치
- **기본 저장 위치:** `C:/Users/home/Desktop/`
- 파일명은 요구사항에 따라 결정 (의미 있는 이름 사용)

---

## Phase 4. 용병 활용 전략 (외부 AI)

서브 에이전트(haiku)로 부족하거나 특수한 작업이 필요할 때 **용병(외부 AI)**을 활용한다.

### 용병 Type A: CLI 용병 (Headless 모드)

복잡한 이미지 생성 코드나 대용량 처리가 필요할 때 외부 AI를 headless로 직접 호출.

**활용 시나리오:**

#### 1. Codex (OpenAI) - 복잡한 이미지 생성 코드
```bash
codex -p "Python Pillow로 복잡한 인포그래픽 생성 스크립트 작성. 여러 데이터 소스를 통합하여 시각화." --full-auto -C "C:/Users/home/Desktop"
```

**언제 사용:**
- Pillow 코드가 100줄 이상으로 복잡할 때
- 데이터 처리 + 시각화 통합 필요
- 알고리즘 기반 이미지 생성 (예: 차트, 그래프)

**장점:**
- 코드 자동 생성 및 실행에 강함
- 복잡한 로직 처리 가능
- 디버깅까지 자동 수행

---

#### 2. Gemini (Google) - 대용량 데이터 시각화
```bash
gemini -p "1000줄짜리 CSV 데이터를 읽어서 HTML 대시보드로 시각화. 차트 10개 포함."
```

**언제 사용:**
- 대용량 데이터(수천 줄 이상) 시각화
- 여러 차트/그래프를 하나의 HTML에 통합
- 컨텍스트가 매우 큰 작업

**장점:**
- 대용량 컨텍스트 처리 능력 (2M+ tokens)
- 복잡한 데이터 분석 + 시각화 통합
- 다중 파일 동시 처리

---

#### 3. Grok (xAI) - 빠른 간단 이미지
```bash
grok -p "간단한 HTML 막대 차트 만들어줘. 데이터: [1,2,3,4,5]"
```

**언제 사용:**
- 매우 단순하고 빠르게 만들어야 할 때
- 프로토타입 단계
- 실시간 처리 필요

**장점:**
- 응답 속도 빠름
- 간단한 작업에 적합
- 비용 효율적

---

### 용병 Type B: API/MCP 용병 (정찰병)

디자인 참고 자료, 색상 팔레트, 레이아웃 트렌드 조사가 필요할 때 **Perplexity** 소환.

**활용 시나리오:**

#### Perplexity - 디자인 리서치
```bash
# 1순위: MCP 서버 (설정되어 있을 경우)
# perplexity_ask MCP 도구 사용
MCP.perplexity_ask("2026년 최신 대시보드 디자인 트렌드와 색상 팔레트 추천")

# 2순위: API 직접 호출 (MCP 미설정 시)
curl -s https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar",
    "messages": [
      {
        "role": "user",
        "content": "2026년 최신 인포그래픽 디자인 트렌드, 색상 조합, 타이포그래피 best practice 알려줘"
      }
    ]
  }' | jq -r '.choices[0].message.content'
```

**언제 사용:**
- 디자인 트렌드 조사 필요
- 색상 팔레트 추천
- 레이아웃 참고 사례 검색
- 특정 업종(금융, 의료, 교육)의 시각화 스타일 조사

**장점:**
- 실시간 웹 검색 기반 최신 정보
- 디자인 best practice 제공
- 구체적인 예시와 함께 제공

---

### 용병 투입 판단 플로우

```
이미지 생성 작업 시작
  │
  ├─ 단순/표준 작업인가?
  │   └─ YES → 서브 에이전트(haiku) 투입
  │
  ├─ 복잡한 코드 필요? (100줄+ Pillow 코드)
  │   └─ YES → Codex (CLI 용병)
  │
  ├─ 대용량 데이터 시각화? (1000줄+ CSV)
  │   └─ YES → Gemini (CLI 용병)
  │
  ├─ 빠르게 프로토타입? (간단한 차트)
  │   └─ YES → Grok (CLI 용병)
  │
  └─ 디자인 참고 필요? (트렌드, 색상, 레이아웃)
      └─ YES → Perplexity (API/MCP 용병)
```

---

### 용병 활용 예시 (실전)

**예시 1: 복잡한 데이터 시각화**
```
유저 요청: "CSV 파일 1000줄을 읽어서 10가지 차트가 포함된 HTML 대시보드 만들어줘"

실행:
1. Perplexity로 대시보드 디자인 트렌드 조사
2. Gemini CLI로 대용량 데이터 처리 + HTML 생성
3. 서브 에이전트(haiku, Bash)로 HTML→PNG 변환
```

**예시 2: 복잡한 인포그래픽**
```
유저 요청: "회사 조직도 + 실적 차트 + 타임라인을 하나의 인포그래픽으로"

실행:
1. Perplexity로 인포그래픽 레이아웃 참고 사례 조사
2. Codex CLI로 Pillow 복합 스크립트 자동 생성
3. 서브 에이전트(haiku)로 최종 PNG 검증
```

**예시 3: 빠른 프로토타입**
```
유저 요청: "간단한 막대 차트 빨리 만들어줘"

실행:
1. Grok CLI로 HTML 차트 즉시 생성 (10초)
2. 서브 에이전트(haiku, Bash)로 PNG 변환 (선택)
```

---

## Phase 5. 실행 절차 (통합)

이 커맨드가 호출되면 다음 절차를 따른다:

### Step 1: 요구사항 분석
1. 유저의 이미지 요구사항을 분석
2. 이미지 유형 판별 (다이어그램/레이아웃/조직도/합성)
3. 복잡도 평가 (단순/중간/복잡/대규모)
4. **용병 필요성 판단** (복잡한 코드/대용량 데이터/디자인 리서치)

### Step 2: 방식 선택
1. **Phase 1의 Decision Tree**에 따라 최적 방식 선택
2. **Phase 4의 용병 판단 플로우**로 용병 필요성 확인
3. 선택 근거를 유저에게 간략히 설명 (1줄)

### Step 3: 리서치 (필요시)
1. 디자인 참고가 필요하면 **Perplexity 용병** 투입
2. 색상 팔레트, 레이아웃, 트렌드 조사
3. 조사 결과를 다음 단계에 반영

### Step 4: 생성 (서브 에이전트 또는 용병)
**단순/표준 작업:**
- **Phase 2의 해당 템플릿**을 사용하여 서브 에이전트 투입
- 모델: 단순 생성/변환=haiku, 복잡한 레이아웃/디자인=sonnet
- 투입 방식: HTML/SVG/Mermaid → `general-purpose`, PNG 변환 → `Bash`
- 권한: `bypassPermissions`

**복잡/대규모 작업:**
- 복잡한 코드 → **Codex CLI 용병** (headless)
- 대용량 데이터 → **Gemini CLI 용병** (headless)
- 빠른 프로토타입 → **Grok CLI 용병** (headless)
- 용병 실행 결과를 받아 검증

### Step 5: PNG 변환 (필요시)
1. SVG 또는 HTML로 생성한 경우, PNG 변환 필요성 판단
2. 필요하면 별도 서브 에이전트(Bash 타입) 투입
3. 변환 도구 우선순위:
   - SVG→PNG: cairosvg > Inkscape > Chrome
   - HTML→PNG: Puppeteer > Chrome headless

### Step 6: 결과 전달
1. 생성된 파일 경로 확인
2. 유저에게 파일 위치 + 미리보기 (가능하면) 전달
3. 품질 검증 체크리스트 확인 (Phase 6 참고)
4. 추가 수정 필요 시 재투입 (서브 에이전트 또는 용병)

---

## Phase 6. 고급 전략

### 병렬 생성 (여러 이미지 동시)
독립적인 이미지 여러 개 필요 시 서브 에이전트를 병렬 투입:
```
Task(haiku, Mermaid) → 시퀀스 다이어그램
Task(haiku, HTML) → 대시보드
Task(haiku, SVG) → 로고
```

**용병 활용 병렬:**
```
Perplexity API → 디자인 트렌드 조사 (백그라운드)
Codex CLI → 복잡한 Pillow 스크립트 생성 (headless)
서브 에이전트(haiku) → Mermaid 다이어그램 생성 (병렬)
```

### 반복 생성 (배치 작업)
동일 템플릿으로 여러 변형 필요 시:
1. 첫 번째 이미지 생성 (템플릿 확정)
2. 데이터만 변경하여 반복 생성 (스크립트 자동화)
3. **대량 배치는 Codex/Gemini 용병 활용** (100개 이상)

### 품질 검증
생성 후 자동 체크리스트:
- [ ] 파일이 존재하는가?
- [ ] 파일 크기가 0이 아닌가?
- [ ] (HTML/SVG) 브라우저에서 정상 렌더링되는가?
- [ ] (PNG) 이미지 뷰어에서 정상 표시되는가?
- [ ] 한글이 깨지지 않았는가?
- [ ] 이모지가 □로 깨지지 않았는가? (Pillow 경우)
- [ ] 디자인 원칙 준수? (가독성, 색상 대비, 여백)

---

## Phase 7. 트러블슈팅

### 문제: 한글이 깨진다
- **원인:** 폰트 미지정
- **해결:** font-family: 'Malgun Gothic' 추가

### 문제: 이모지가 □로 표시된다
- **원인:** Pillow + Windows malgun.ttf 조합
- **해결:** 이모지 대신 텍스트 사용, 또는 SVG/HTML 방식으로 변경

### 문제: PNG 변환이 안 된다
- **원인:** 변환 도구 미설치
- **해결:**
  - `npm install -g puppeteer` 실행
  - 또는 Chrome 설치 확인
  - 또는 `pip install cairosvg` 실행

### 문제: 레이아웃이 의도와 다르다
- **원인:** CSS/SVG 좌표 계산 오류
- **해결:** 서브 에이전트에게 재지시 (구체적인 좌표/크기 명시)

### 문제: 파일이 너무 크다
- **원인:** 고해상도 또는 복잡한 SVG
- **해결:**
  - PNG: 해상도 낮춤 (width 조절)
  - SVG: 단순화 또는 최적화 도구 사용

---

## 요약 (Quick Reference)

### 방식별 선택표

| 상황 | 방식 | 실행자 | 변환 |
|------|------|--------|------|
| 시퀀스 다이어그램 | Mermaid | 서브(haiku) | Chrome/Puppeteer |
| 간트 차트 | Mermaid | 서브(haiku) | Chrome/Puppeteer |
| 대시보드 (단순) | HTML | 서브(haiku) | Puppeteer |
| 대시보드 (대용량) | HTML | Gemini 용병 | Puppeteer |
| 표 | HTML | 서브(haiku) | Puppeteer |
| 조직도 | SVG | 서브(haiku) | cairosvg |
| 플로우차트 (커스텀) | SVG | 서브(haiku) | cairosvg |
| 로고 | SVG | 서브(haiku) | cairosvg |
| 썸네일 (합성, 단순) | Pillow | 서브(haiku) | 불필요 |
| 인포그래픽 (복잡) | Pillow | Codex 용병 | 불필요 |
| 프로토타입 (빠름) | HTML | Grok 용병 | 선택 |

### 용병 활용 기준

| 용병 | 언제 사용 | 호출 방법 |
|------|----------|----------|
| **Codex** | 복잡한 코드 (100줄+), 알고리즘 기반 이미지 | `codex -p "..." --full-auto -C "경로"` |
| **Gemini** | 대용량 데이터 (1000줄+), 복합 시각화 | `gemini -p "..."` |
| **Grok** | 빠른 프로토타입, 간단한 차트 | `grok -p "..."` |
| **Perplexity** | 디자인 리서치, 색상 팔레트, 트렌드 조사 | MCP 또는 `curl + API` |

### 기본 원칙

**방식 우선순위:** Mermaid > HTML > SVG > Pillow (왼쪽이 우선)

**실행자 선택:**
- 단순 변환/생성 → 서브 에이전트 (haiku)
- 복잡한 디자인/레이아웃 → 서브 에이전트 (sonnet)
- 복잡한 코드 → Codex 용병
- 대용량 데이터 → Gemini 용병
- 빠른 프로토타입 → Grok 용병
- 디자인 리서치 → Perplexity 용병

**저장 위치:** `C:/Users/home/Desktop/`

**모델 선택:** 단순=haiku, 복잡=sonnet (적재적소) | opus 절대 금지
