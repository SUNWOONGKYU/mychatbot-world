---
description: "PPT 슬라이드쇼 웹페이지 생성 + GitHub 공유"
user-invocable: true
---

# /slideshow — PPT 슬라이드쇼 웹페이지 생성 + GitHub 공유

콘텐츠를 **슬라이드쇼 형태의 단일 HTML 웹페이지**로 만들고, GitHub에 푸시하여 **공유 가능한 URL**을 생성한다.

## Usage
/slideshow $ARGUMENTS

## Parameters
- $ARGUMENTS: 슬라이드 콘텐츠 소스. 아래 중 하나:
  - 파일 경로: `thesis_report.md`, `proposal.html`, `data.json`
  - **PPT 파일: `presentation.pptx`** (python-pptx로 슬라이드 내용 자동 추출)
  - 직접 지시: `"FX Pooling 시스템 소개 10장"`, `"프로젝트 현황 발표자료"`
  - 디렉토리: `prototype/` (코드베이스 기반 발표자료 자동 생성)

## Description

PPT 없이도 브라우저에서 바로 프레젠테이션 가능한 슬라이드쇼 웹페이지를 생성한다.
키보드 좌우 화살표, 스와이프, 진행 바, 전체화면 모두 지원.
GitHub Pages로 즉시 공유 가능.

---

## 실행 절차 (EXECUTE NOW — 설명만 출력 금지)

> **이 스킬이 호출되면 아래 절차를 즉시 실행하라. 방법을 설명하거나 코드 예시만 출력하지 말 것.**

### Phase 1: 콘텐츠 수집

1. `$ARGUMENTS`에서 소스 파악
2. 소스가 `.pptx` 파일이면 → **Phase 1-P: PPTX 추출** 실행
3. 소스가 텍스트 파일(.md/.html/.json/.txt)이면 → Read tool로 읽기
4. 소스가 텍스트 지시면 → 슬라이드 구성안 작성
5. 소스가 디렉토리면 → 주요 파일 스캔 후 구성안 작성

#### Phase 1-P: PPTX 파일 추출 (python-pptx)

`.pptx` 파일이 입력된 경우 아래 순서로 슬라이드 내용과 **원본 색상**을 추출한다.
**핵심 원칙: PPTX 원본의 색상을 최대한 그대로 유지한다.** 배경색, 텍스트 색상, 강조색을 추출하여 슬라이드쇼에 반영한다.

**Step 1 — python-pptx 설치 확인:**
```bash
pip install python-pptx 2>/dev/null || pip install python-pptx --user
```

**Step 2 — 추출 스크립트 실행 (색상 포함):**
Bash tool로 아래 Python 스크립트를 실행한다. `{PPTX_PATH}`를 실제 파일 경로로 치환할 것.

```bash
python -c "
import json, sys
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.dml.color import RGBColor

def rgb_to_hex(rgb):
    if rgb is None: return None
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def get_font_color(run):
    try:
        if run.font.color and run.font.color.rgb:
            return rgb_to_hex(run.font.color.rgb)
    except: pass
    return None

def get_bg_color(slide):
    try:
        bg = slide.background
        if bg.fill and bg.fill.fore_color and bg.fill.fore_color.rgb:
            return rgb_to_hex(bg.fill.fore_color.rgb)
    except: pass
    return None

def get_shape_fill(shape):
    try:
        if shape.fill and shape.fill.fore_color and shape.fill.fore_color.rgb:
            return rgb_to_hex(shape.fill.fore_color.rgb)
    except: pass
    return None

prs = Presentation(r'{PPTX_PATH}')

# 테마 색상 추출 (슬라이드 마스터에서)
theme_colors = {}
try:
    theme = prs.slide_masters[0].slide_layouts[0].slide_master
    # 기본 색상 팔레트
except: pass

slides_data = []
all_text_colors = []
all_bg_colors = []

for i, slide in enumerate(prs.slides):
    slide_info = {
        'index': i+1, 'title': '', 'texts': [], 'tables': [], 'images': [],
        'bg_color': get_bg_color(slide),
        'text_colors': []
    }

    for shape in slide.shapes:
        shape_fill = get_shape_fill(shape)

        if shape.has_text_frame:
            is_title = False
            try:
                is_title = slide.shapes.title and shape.shape_id == slide.shapes.title.shape_id
            except: pass

            if is_title:
                title_text = shape.text_frame.text.strip()
                slide_info['title'] = title_text
                # 제목 색상
                for para in shape.text_frame.paragraphs:
                    for run in para.runs:
                        c = get_font_color(run)
                        if c:
                            slide_info['text_colors'].append(c)
                            all_text_colors.append(c)
            else:
                for para in shape.text_frame.paragraphs:
                    text = para.text.strip()
                    if text:
                        level = para.level if para.level else 0
                        bold = any(run.font.bold for run in para.runs if run.font.bold)
                        # 각 run별 색상 수집
                        colors = []
                        for run in para.runs:
                            c = get_font_color(run)
                            if c:
                                colors.append(c)
                                all_text_colors.append(c)
                        color = colors[0] if colors else None
                        slide_info['texts'].append({
                            'text': text, 'level': level, 'bold': bold,
                            'color': color, 'shape_fill': shape_fill
                        })

        if shape.has_table:
            table = shape.table
            rows = []
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                rows.append(cells)
            slide_info['tables'].append(rows)

        if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            slide_info['images'].append('image_placeholder')

    if not slide_info['title'] and slide_info['texts']:
        slide_info['title'] = slide_info['texts'].pop(0)['text']

    if slide_info['bg_color']:
        all_bg_colors.append(slide_info['bg_color'])

    slides_data.append(slide_info)

# 가장 많이 사용된 색상 → 테마 추천
from collections import Counter
dominant_text = Counter(all_text_colors).most_common(3)
dominant_bg = Counter(all_bg_colors).most_common(1)

output = {
    'slides': slides_data,
    'color_palette': {
        'dominant_text_colors': [c[0] for c in dominant_text],
        'dominant_bg_color': dominant_bg[0][0] if dominant_bg else None,
        'total_slides': len(slides_data)
    }
}
print(json.dumps(output, ensure_ascii=False, indent=2))
"
```

**Step 3 — 원본 색상을 슬라이드쇼 CSS 변수에 반영:**
추출된 `color_palette`를 사용하여 `:root` CSS 변수를 원본 PPTX 색상으로 오버라이드한다.
- `dominant_bg_color` → `--bg` (배경색)
- `dominant_text_colors[0]` → `--text` (본문 색상)
- `dominant_text_colors[1]` → `--accent` (강조 색상)
- 각 슬라이드의 `bg_color`가 다르면 해당 `.slide`에 `style="background:..."` 인라인 적용
- 각 텍스트의 `color`가 있으면 `<span style="color:...">` 감싸기
- `shape_fill`이 있으면 해당 블록에 배경색 적용

**색상 적용 우선순위:**
1. 개별 텍스트 `color` (인라인 스타일로 직접 적용)
2. 슬라이드별 `bg_color` (슬라이드 div에 인라인 배경)
3. 전체 팔레트 `color_palette` (CSS 변수 오버라이드)
4. 추출 실패 시 → 기본 다크 테마 유지

**Step 4 — 추출 결과를 슬라이드 구성안으로 변환:**
- 각 슬라이드의 `title` → `<h2>` 제목
- `texts` 배열 → `<ul><li>` 불릿 리스트 (level에 따라 들여쓰기)
- `tables` 배열 → `<table>` HTML 테이블
- `images` → 이미지가 있었다는 표시 (바이너리 추출 불가하므로 `[이미지]` 플레이스홀더 삽입)
- bold 텍스트 → `<strong>` 태그 감싸기
- 첫 슬라이드가 타이틀 슬라이드인지 자동 판별 (텍스트가 적고 제목만 있으면 타이틀)
- 마지막 슬라이드가 "감사합니다"/"Q&A"/"Thank you" 등이면 end-slide 클래스 적용

**python-pptx 설치 실패 시 대응:**
- pip가 없거나 설치 실패하면 PO에게 안내:
  `"python-pptx 설치가 필요합니다. pip install python-pptx 를 실행해주세요."`
- 또는 .pptx를 Google Slides에서 열어 텍스트를 복사한 뒤 직접 지시 방식으로 전환

**슬라이드 구성안 작성 시 원칙:**
- 첫 슬라이드: 타이틀 + 부제 + 날짜
- 중간 슬라이드: 핵심 내용 (슬라이드당 1가지 주제)
- 마지막 슬라이드: 요약 / Q&A / 감사
- 슬라이드 수: 별도 지시 없으면 8~15장
- 각 슬라이드에 제목(h2) + 본문(bullet/표/코드/수식) 구성

### Phase 2: HTML 슬라이드쇼 생성

Write tool로 단일 HTML 파일을 생성한다. 아래 템플릿 구조를 따른다.

**파일명 규칙:** `{주제}-slideshow.html` (kebab-case)

**필수 기능:**
- 키보드 네비게이션 (← → 화살표, Space=다음, Escape=전체화면 해제)
- 터치 스와이프 (모바일)
- 진행 바 (상단)
- 슬라이드 번호 표시 (우하단 "3 / 12")
- 전체화면 버튼 (F키 또는 버튼 클릭)
- 반응형 (모바일/태블릿/PC)
- 인쇄 CSS (@media print → 슬라이드별 page-break)
- 다크 테마 기본 (밝은 배경 옵션도 토글 가능)
- 애니메이션 전환 효과 (slide-in)
- 외부 의존성 0개 (CDN 없음, 완전 자립형 단일 HTML)

**HTML 템플릿 구조:**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{슬라이드 제목}</title>
  <style>
    /* ── Reset + Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; }

    /* ── Theme Variables ── */
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent2: #a78bfa;
      --code-bg: #1e293b;
      --slide-max-w: 1100px;
    }
    :root.light {
      --bg: #ffffff;
      --surface: #f8fafc;
      --text: #1e293b;
      --muted: #64748b;
      --accent: #2563eb;
      --accent2: #7c3aed;
      --code-bg: #f1f5f9;
    }

    body { background: var(--bg); color: var(--text); }

    /* ── Progress Bar ── */
    .progress { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); z-index: 100; transition: width 0.3s ease; }

    /* ── Slide Container ── */
    .slides { position: relative; width: 100%; height: 100vh; }
    .slide {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      padding: 60px 48px 80px;
      opacity: 0; transform: translateX(60px);
      transition: opacity 0.45s ease, transform 0.45s ease;
      pointer-events: none;
    }
    .slide.active { opacity: 1; transform: translateX(0); pointer-events: auto; }
    .slide.prev { opacity: 0; transform: translateX(-60px); }
    .slide-inner {
      max-width: var(--slide-max-w); width: 100%;
    }

    /* ── Typography ── */
    .slide h2 { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; margin-bottom: 32px; line-height: 1.3; }
    .slide h2 .accent { color: var(--accent); }
    .slide h3 { font-size: 1.3rem; color: var(--accent); margin-bottom: 16px; font-weight: 700; }
    .slide p { font-size: 1.15rem; line-height: 1.8; color: var(--muted); margin-bottom: 16px; }
    .slide ul, .slide ol { font-size: 1.1rem; line-height: 2; padding-left: 24px; color: var(--text); }
    .slide li { margin-bottom: 8px; }
    .slide li::marker { color: var(--accent); }
    .slide strong { color: var(--accent); font-weight: 700; }
    .slide code { background: var(--code-bg); padding: 2px 8px; border-radius: 4px; font-size: 0.95em; }
    .slide pre { background: var(--code-bg); border-radius: 12px; padding: 20px 24px; overflow-x: auto; margin: 16px 0; font-size: 0.9rem; line-height: 1.6; }
    .slide table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 1rem; }
    .slide th { background: var(--surface); padding: 10px 16px; text-align: left; font-weight: 700; border-bottom: 2px solid var(--accent); }
    .slide td { padding: 10px 16px; border-bottom: 1px solid rgba(148,163,184,0.15); }
    .slide tr:hover td { background: rgba(56,189,248,0.05); }

    /* ── Title Slide ── */
    .slide.title-slide { text-align: center; }
    .slide.title-slide h1 { font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 900; line-height: 1.2; margin-bottom: 16px; }
    .slide.title-slide .subtitle { font-size: 1.3rem; color: var(--muted); margin-bottom: 24px; }
    .slide.title-slide .date { font-size: 1rem; color: var(--accent); }

    /* ── End Slide ── */
    .slide.end-slide { text-align: center; }

    /* ── Stat Cards / Grid ── */
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
    .card { background: var(--surface); border-radius: 12px; padding: 20px 24px; border: 1px solid rgba(148,163,184,0.1); }
    .card .label { font-size: 0.85rem; color: var(--muted); margin-bottom: 4px; }
    .card .value { font-size: 1.8rem; font-weight: 800; color: var(--accent); }
    .card .desc { font-size: 0.85rem; color: var(--muted); margin-top: 4px; }

    /* ── Two Column ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

    /* ── Highlight Box ── */
    .highlight { background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(167,139,250,0.1)); border-left: 4px solid var(--accent); padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 16px 0; }

    /* ── Side Arrows (좌우 큰 화살표) ── */
    .arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(0,0,0,0.45); border: none; color: var(--accent);
      font-size: 38px; cursor: pointer; padding: 18px 10px; z-index: 10;
      border-radius: 6px; transition: background 0.2s; line-height: 1;
    }
    .arrow:hover { background: rgba(56,189,248,0.35); }
    .arrow-l { left: 0; }
    .arrow-r { right: 0; }

    /* ── Bottom Nav Bar (하단 내비게이션) ── */
    .nav-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: var(--surface); border-top: 1px solid rgba(148,163,184,0.15);
      padding: 10px 20px; display: flex; align-items: center; justify-content: center;
      gap: 20px; z-index: 100;
    }
    .nav-btn {
      background: none; border: 2px solid var(--accent); color: var(--accent);
      padding: 6px 24px; border-radius: 20px; cursor: pointer;
      font-size: 15px; font-weight: 700; transition: all 0.2s; font-family: inherit;
    }
    .nav-btn:hover { background: var(--accent); color: var(--bg); }
    .nav-btn:disabled { border-color: rgba(148,163,184,0.2); color: rgba(148,163,184,0.3); cursor: default; background: none; }
    .counter { color: var(--muted); font-size: 15px; min-width: 70px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }

    /* ── Theme Toggle ── */
    .theme-toggle { position: fixed; top: 12px; right: 12px; z-index: 100; background: var(--surface); border: 1px solid rgba(148,163,184,0.2); color: var(--text); border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
    /* ── Fullscreen Button ── */
    .fs-toggle { position: fixed; top: 12px; right: 80px; z-index: 100; background: var(--surface); border: 1px solid rgba(148,163,184,0.2); color: var(--text); border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 13px; }

    /* ── Print ── */
    @media print {
      .nav-bar, .progress, .theme-toggle, .fs-toggle, .arrow { display: none !important; }
      .slides { position: static; height: auto; }
      .slide { position: static; opacity: 1 !important; transform: none !important; pointer-events: auto !important; page-break-after: always; height: 100vh; padding: 40px; }
    }

    /* ── Mobile ── */
    @media (max-width: 640px) {
      .slide { padding: 40px 20px 70px; }
      .card-grid { grid-template-columns: 1fr; }
      .arrow { font-size: 28px; padding: 14px 8px; }
    }
  </style>
</head>
<body>

<div class="progress" id="progress"></div>
<button class="fs-toggle" id="fsToggle" title="전체화면 (F)">⛶</button>
<button class="theme-toggle" id="themeToggle">Light</button>

<div class="slides" id="slides">
  <!-- 좌우 화살표 (슬라이드 컨테이너 안) -->
  <button class="arrow arrow-l" id="arrow-l" onclick="prev()" title="이전 (←)">❮</button>
  <button class="arrow arrow-r" id="arrow-r" onclick="next()" title="다음 (→)">❯</button>

  <!-- ▼▼▼ 여기에 슬라이드 삽입 ▼▼▼ -->

  <div class="slide title-slide active">
    <div class="slide-inner">
      <h1>{메인 타이틀}</h1>
      <div class="subtitle">{부제}</div>
      <div class="date">{날짜}</div>
    </div>
  </div>

  <div class="slide">
    <div class="slide-inner">
      <h2>{슬라이드 제목}</h2>
      <!-- 본문 내용: ul, p, table, .card-grid, .two-col, .highlight, pre 등 -->
    </div>
  </div>

  <!-- ... 슬라이드 반복 ... -->

  <div class="slide end-slide">
    <div class="slide-inner">
      <h2>감사합니다</h2>
      <p style="font-size:1.2rem;margin-top:16px">Q&A</p>
    </div>
  </div>

  <!-- ▲▲▲ 슬라이드 끝 ▲▲▲ -->
</div>

<nav class="nav-bar">
  <button class="nav-btn" id="btn-p" onclick="prev()">◀ 이전</button>
  <span class="counter" id="counter">1 / N</span>
  <button class="nav-btn" id="btn-n" onclick="next()">다음 ▶</button>
</nav>

<script>
const slides = document.querySelectorAll('.slide');
const btnP = document.getElementById('btn-p');
const btnN = document.getElementById('btn-n');
const arrowL = document.getElementById('arrow-l');
const arrowR = document.getElementById('arrow-r');
const counter = document.getElementById('counter');
const progress = document.getElementById('progress');
let cur = 0;

function updateSlide(n) {
  if (n < 0 || n >= slides.length) return;
  slides.forEach(s => s.classList.remove('active', 'prev'));
  if (n > cur) slides[cur].classList.add('prev');
  cur = n;
  slides[cur].classList.add('active');
  counter.textContent = (cur + 1) + ' / ' + slides.length;
  progress.style.width = ((cur + 1) / slides.length * 100) + '%';
  // 첫/마지막 슬라이드에서 버튼 비활성화
  btnP.disabled = (cur === 0);
  btnN.disabled = (cur === slides.length - 1);
  arrowL.style.display = (cur === 0) ? 'none' : '';
  arrowR.style.display = (cur === slides.length - 1) ? 'none' : '';
}
function next() { updateSlide(cur + 1); }
function prev() { updateSlide(cur - 1); }
function toggleFS() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'f' || e.key === 'F') toggleFS();
  if (e.key === 'Home') updateSlide(0);
  if (e.key === 'End') updateSlide(slides.length - 1);
});
let tx = 0;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
document.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); } });
document.getElementById('themeToggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  document.getElementById('themeToggle').textContent = document.documentElement.classList.contains('light') ? 'Dark' : 'Light';
});
document.getElementById('fsToggle').addEventListener('click', toggleFS);
updateSlide(0);
</script>
</body>
</html>
```

**슬라이드 작성 원칙:**
- 슬라이드당 텍스트 최소화 (bullet 5개 이내, 문장 짧게)
- 숫자/통계는 `.card-grid > .card` 사용
- 비교/대조는 `.two-col` 사용
- 핵심 인용/강조는 `.highlight` 사용
- 코드는 `<pre><code>` 사용
- `<strong>` 태그로 키워드 강조 (자동으로 accent 색상)
- 각 `<h2>` 안에서 핵심 단어는 `<span class="accent">` 감싸기

### Phase 3: GitHub 푸시 + 공유 URL 생성

1. **현재 Git 상태 확인:**
   ```bash
   git status
   git remote -v
   ```

2. **GitHub Pages 대상 경로에 파일 배치:**
   - 프로젝트 루트 또는 `docs/` 폴더에 HTML 파일 저장
   - 이미 GitHub Pages가 설정된 경우 해당 경로에 저장

3. **커밋 + 푸시:**
   ```bash
   git add {파일경로}
   git commit -m "docs: {제목} 슬라이드쇼 웹페이지 추가"
   git push
   ```

4. **공유 URL 안내:**
   ```
   GitHub Pages URL:
   https://{username}.github.io/{repo}/{파일경로}

   또는 GitHub raw/직접 접근:
   파일을 브라우저에서 직접 열어도 동작 (단일 HTML, 외부 의존성 없음)
   ```

5. **결과 보고:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     슬라이드쇼 생성 완료
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     파일:   {파일 경로}
     슬라이드: {N}장
     용량:   {N} KB
     공유:   {GitHub Pages URL}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   조작법:
     ← → 화살표  이전/다음 슬라이드
     Space       다음 슬라이드
     F           전체화면 토글
     Home / End  첫 / 마지막 슬라이드
     좌우 화살표  좌우 큰 버튼 클릭
     하단 바      이전 ◀ / ▶ 다음 버튼
     스와이프     모바일 터치 좌우
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

### Phase 4: 사용자 피드백 반영 (선택)

AskUserQuestion으로 확인:
- "슬라이드 내용을 수정하거나 추가할 부분이 있나요?"
- 수정 요청 시 Edit tool로 해당 슬라이드만 수정 → 재푸시

---

## 예시

```
/slideshow FX Pooling 시스템 소개 10장
/slideshow thesis_report.md 기반 발표자료
/slideshow presentation.pptx
/slideshow "C:\Documents\발표자료.pptx"
/slideshow prototype/ 코드 아키텍처 발표
/slideshow "프로젝트 현황 보고 — SAL Grid 진행률 포함"
```

## 주의사항

1. **외부 의존성 0개** — CDN 없음, 폰트 로드 없음. 오프라인에서도 동작.
2. **단일 HTML** — CSS/JS 모두 인라인. 파일 1개로 완결.
3. **GitHub Pages 미설정 시** — 파일을 로컬에서 직접 열어도 100% 동작.
4. **한글 최적화** — 시스템 폰트(Pretendard/Apple SD/맑은 고딕) 폴백 체인.
5. **인쇄 지원** — Ctrl+P로 슬라이드별 페이지 분리 인쇄 가능.
6. **PPTX 변환 시** — `python-pptx` 패키지 필요 (`pip install python-pptx`). 이미지는 바이너리 추출 불가하므로 `[이미지]` 플레이스홀더로 대체. 텍스트·표·제목·불릿은 완전 추출.
