---
description: "문서 생성기 (PDF/DOCX/PPTX/XLSX/HWP)"
user-invocable: true
---

# /doc-generator — 문서 생성기 (PDF · DOCX · PPTX · XLSX · HWP)

문서를 **생성 · 읽기 · 편집 · 변환**하는 통합 스킬. Anthropic 공식 document-skills 기반 + 한글(HWP) 최적화.

## Usage
/doc-generator $ARGUMENTS

## Description

5가지 문서 형식을 하나의 커맨드로 처리. 한글 폰트/인코딩 + HWP 네이티브 지원.

## Parameters
- $ARGUMENTS: 작업 설명 또는 파일 경로 (예: "보고서.pdf 만들어줘", "data.xlsx 읽어서 분석", "발표자료.pptx 10장")

---

## ⚡ 즉시 실행 (EXECUTE NOW — 설명만 출력 금지)

> **이 스킬이 호출되면 아래 절차를 즉시 실행하라. 방법을 설명하거나 코드 예시만 출력하지 말 것.**

### 실행 절차

1. `$ARGUMENTS`에서 **입력 파일/내용** + **출력 형식** 파악
2. Phase 0 결정 트리로 형식 결정
3. 해당 Phase의 명령어를 **Bash 도구로 즉시 실행**
4. 출력 파일 존재 및 크기 확인 (`ls -la {출력파일}`)
5. 결과 보고 (성공/실패, 파일 경로, 용량)

### PDF 변환 기본 실행 패턴 (가장 빈번한 케이스)

**MD/내용 → PDF** (즉시 실행 순서):

```bash
# Step 1: 입력 파일 확인
ls -la {입력파일}

# Step 2-A: 내용이 있으면 HTML 먼저 생성 (Python 또는 Write 도구)
# Step 2-B: MD 파일이면 pandoc으로 HTML 변환
pandoc "{입력파일}" -o "{출력}.html" --standalone --metadata pagetitle="{제목}"

# Step 3: Chrome headless로 PDF 생성
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless --disable-gpu --no-sandbox \
  --print-to-pdf="{출력절대경로}.pdf" \
  --print-to-pdf-no-header \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=10000 \
  "file:///{HTML절대경로}.html"

# Step 4: 생성 확인
ls -la "{출력}.pdf"
```

> **⚠️ 주의**: `$ARGUMENTS`가 파일 경로라면 그 파일을 변환하라. 텍스트/내용이라면 먼저 HTML로 저장 후 변환하라. **어떤 경우에도 설명만 출력하고 끝내지 말 것.**

---

## Phase 0. 형식 선택 (Decision Tree)

```
문서 작업 요청
  │
  ├─ PDF 관련? (읽기/생성/병합/분할/OCR/폼)
  │   └─ → Phase 1: PDF
  │
  ├─ Word 문서? (보고서/메모/편지/계약서)
  │   └─ → Phase 2: DOCX
  │
  ├─ 프레젠테이션? (발표/슬라이드/피치덱)
  │   └─ → Phase 3: PPTX
  │
  ├─ 스프레드시트? (데이터/표/차트/재무모델)
  │   └─ → Phase 4: XLSX
  │
  └─ 아래한글? (.hwp/.hwpx 읽기/변환)
      └─ → Phase 5: HWP
```

### 형식별 Quick Reference

| 형식 | 생성 도구 | 읽기 도구 | 편집 도구 | 한글 폰트 |
|------|----------|----------|----------|-----------|
| **PDF** | reportlab, Chrome headless | pypdf, pdfplumber | pypdf | Malgun Gothic |
| **DOCX** | docx-js (npm) | pandoc | XML 직접편집 | Malgun Gothic |
| **PPTX** | pptxgenjs (npm) | markitdown | XML 직접편집 | Malgun Gothic |
| **XLSX** | openpyxl | pandas | openpyxl | Malgun Gothic |
| **HWP** | (한컴오피스 전용) | pyhwp, olefile | LibreOffice | 네이티브 |

---

## 한글 폰트 통합 설정 (모든 형식 공통)

Windows 환경 한글 깨짐 방지. **모든 문서 생성 시 반드시 적용.**

### 폰트 경로
```
일반: C:/Windows/Fonts/malgun.ttf (맑은 고딕)
볼드: C:/Windows/Fonts/malgunbd.ttf (맑은 고딕 Bold)
고정폭: C:/Windows/Fonts/consola.ttf (Consolas)
```

### 형식별 한글 적용법

**PDF (reportlab)**:
```python
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont('MalgunGothic', 'C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('MalgunGothicBold', 'C:/Windows/Fonts/malgunbd.ttf'))
# 사용: Paragraph("한글 텍스트", ParagraphStyle('ko', fontName='MalgunGothic'))
```

**PDF (Chrome headless)**:
```bash
# 한글은 시스템 폰트 자동 감지. 별도 설정 불필요.
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless --print-to-pdf="output.pdf" input.html
```

**DOCX (docx-js)**:
```javascript
// 기본 폰트를 Malgun Gothic으로 설정
styles: {
  default: { document: { run: { font: "Malgun Gothic", size: 24 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 32, bold: true, font: "Malgun Gothic" },
      paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
  ]
}
```

**PPTX (pptxgenjs)**:
```javascript
// 슬라이드 마스터에 한글 폰트 지정
slide.addText("한글 제목", {
  fontFace: "Malgun Gothic", fontSize: 36, bold: true, color: "000000"
});
```

**XLSX (openpyxl)**:
```python
from openpyxl.styles import Font
cell.font = Font(name='Malgun Gothic', size=11)
```

---

## Phase 1. PDF

### 1-1. PDF 읽기/추출

```python
# 텍스트 추출
from pypdf import PdfReader
reader = PdfReader("document.pdf")
for page in reader.pages:
    print(page.extract_text())

# 테이블 추출 → DataFrame
import pdfplumber, pandas as pd
with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            df = pd.DataFrame(table[1:], columns=table[0])
            print(df)
```

### 1-2. PDF 생성

**방법 A: reportlab (Python, 프로그래밍 제어)**
```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# 한글 폰트 등록
pdfmetrics.registerFont(TTFont('MalgunGothic', 'C:/Windows/Fonts/malgun.ttf'))

doc = SimpleDocTemplate("report.pdf", pagesize=A4)
styles = getSampleStyleSheet()
ko_style = ParagraphStyle('Korean', parent=styles['Normal'], fontName='MalgunGothic', fontSize=12)

story = [
    Paragraph("보고서 제목", ParagraphStyle('KoTitle', parent=styles['Title'], fontName='MalgunGothic')),
    Spacer(1, 12),
    Paragraph("본문 내용입니다.", ko_style),
]
doc.build(story)
```

**방법 B: Chrome headless (HTML → PDF, 최고 품질)**

CSS 완벽 지원, 한글 폰트 자동 감지. **가장 권장하는 방법.**

```bash
# Chrome 경로 (OS별)
# Windows: "/c/Program Files/Google/Chrome/Application/chrome.exe"
# Mac:     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Linux:   google-chrome 또는 chromium-browser

"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless --disable-gpu --no-sandbox \
  --print-to-pdf="output.pdf" \
  --print-to-pdf-no-header \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=10000 \
  "file:///C:/path/to/input.html"
```

**필수 플래그 설명:**
| 플래그 | 용도 |
|--------|------|
| `--headless` | GUI 없이 실행 (캐싱 문제 시 `--headless=new`) |
| `--print-to-pdf=PATH` | PDF 출력 경로 (절대경로, `/` 구분자) |
| `--print-to-pdf-no-header` | 머리글/바닥글 제거 (날짜/URL 제거) |
| `--run-all-compositor-stages-before-draw` | 렌더링 완료 대기 |
| `--virtual-time-budget=10000` | JS/CSS 로딩 대기 (10초) |

**입력 파일 URL 형식:** `file:///C:/path/to/file.html` (슬래시 3개 + 절대경로)

**방법 C: pandoc (Markdown → PDF, 목차 자동)**
```bash
pandoc input.md -o output.pdf \
  --pdf-engine=xelatex \
  -V mainfont="Malgun Gothic" \
  -V monofont="Consolas" \
  -V geometry:margin=20mm \
  --toc --toc-depth=3
```

**방법 D: MD → HTML → PDF 파이프라인 (CSS 커스텀, 최고 품질)**

Markdown을 pandoc으로 styled HTML로 변환 후 Chrome headless로 PDF 생성. **보고서/기획서에 최적.**

```bash
# Step 1: Markdown → Styled HTML (pandoc + CSS)
pandoc input.md -o output.html \
  --standalone \
  --css=report-style.css \
  --metadata pagetitle="보고서 제목"

# Step 2: HTML → PDF (Chrome headless)
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless --disable-gpu --no-sandbox \
  --print-to-pdf="output.pdf" \
  --print-to-pdf-no-header \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=10000 \
  "file:///C:/path/to/output.html"
```

**Python 래퍼 (자동화용):**
```python
import subprocess, os, platform

def find_chrome():
    """OS별 Chrome 경로 자동 탐지"""
    if platform.system() == 'Windows':
        for path in [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        ]:
            if os.path.exists(path): return path
    elif platform.system() == 'Darwin':
        path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if os.path.exists(path): return path
    return "google-chrome"  # Linux fallback

def md_to_pdf(md_file, pdf_file, css_file=None, title="Document"):
    """Markdown → HTML → PDF 2단계 변환"""
    html_file = md_file.rsplit('.', 1)[0] + '.html'

    # Step 1: MD → HTML
    pandoc_cmd = ["pandoc", md_file, "-o", html_file, "--standalone",
                  "--metadata", f"pagetitle={title}"]
    if css_file and os.path.exists(css_file):
        pandoc_cmd += [f"--css={css_file}"]
    subprocess.run(pandoc_cmd, check=True)

    # Step 2: HTML → PDF
    html_abs = os.path.abspath(html_file).replace('\\', '/')
    pdf_abs = os.path.abspath(pdf_file).replace('\\', '/')
    chrome_cmd = [
        find_chrome(), '--headless', '--disable-gpu', '--no-sandbox',
        f'--print-to-pdf={pdf_abs}', '--print-to-pdf-no-header',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=10000',
        f'file:///{html_abs}'
    ]
    subprocess.run(chrome_cmd, capture_output=True, text=True,
                   encoding='utf-8', errors='ignore')

    if os.path.exists(pdf_file):
        size_kb = os.path.getsize(pdf_file) / 1024
        print(f"PDF 생성 완료: {pdf_file} ({size_kb:.1f} KB)")
        return True
    return False
```

### 1-3. PDF 편집

```python
from pypdf import PdfReader, PdfWriter

# 병합
writer = PdfWriter()
for pdf in ["doc1.pdf", "doc2.pdf"]:
    for page in PdfReader(pdf).pages:
        writer.add_page(page)
with open("merged.pdf", "wb") as f:
    writer.write(f)

# 분할
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    w = PdfWriter()
    w.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as f:
        w.write(f)

# 회전
page = PdfReader("input.pdf").pages[0]
page.rotate(90)

# 암호화
writer.encrypt("userpass", "ownerpass")

# 워터마크
watermark = PdfReader("watermark.pdf").pages[0]
for page in PdfReader("doc.pdf").pages:
    page.merge_page(watermark)
```

### 1-4. PDF OCR (스캔 문서)

```python
import pytesseract
from pdf2image import convert_from_path

images = convert_from_path('scanned.pdf')
for i, img in enumerate(images):
    text = pytesseract.image_to_string(img, lang='kor')  # 한국어 OCR
    print(f"Page {i+1}: {text}")
```

### 1-5. PDF 폼 필드

```python
# 필드 확인
from pypdf import PdfReader
reader = PdfReader("form.pdf")
fields = reader.get_fields()
for name, field in fields.items():
    print(f"{name}: {field.get('/V', 'empty')}")

# 필드 채우기
from pypdf import PdfWriter
writer = PdfWriter()
writer.append("form.pdf")
writer.update_page_form_field_values(writer.pages[0], {"field_name": "값"})
writer.write("filled.pdf")
```

### 1-6. CLI 도구

```bash
# 텍스트 추출 (poppler)
pdftotext input.pdf output.txt
pdftotext -layout input.pdf output.txt  # 레이아웃 보존

# 병합/분할 (qpdf)
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf
qpdf input.pdf --pages . 1-5 -- first5.pdf

# 이미지 추출
pdfimages -j input.pdf output_prefix
```

### 1-7. A4 보고서 CSS 템플릿

방법 D(MD→HTML→PDF) 사용 시 아래 CSS를 `report-style.css`로 저장하여 활용.
프로젝트별로 색상/폰트만 변경하면 전문 보고서 품질 확보.

```css
/* === A4 보고서 CSS 템플릿 === */

:root {
  --primary: #1e40af;
  --primary-light: #3b82f6;
  --primary-pale: #dbeafe;
  --success: #059669;
  --success-pale: #d1fae5;
  --warning: #d97706;
  --warning-pale: #fef3c7;
  --danger: #dc2626;
  --danger-pale: #fee2e2;
  --text: #111827;
  --text-sub: #4b5563;
  --bg: #ffffff;
  --bg-alt: #f9fafb;
  --border: #e5e7eb;
  --font: 'Malgun Gothic', -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'Consolas', 'Courier New', monospace;
}

@page {
  size: A4 portrait;
  margin: 20mm 25mm;
  @bottom-center {
    content: "- " counter(page) " -";
    font-size: 9pt;
    color: #9ca3af;
  }
}
@page :first { @bottom-center { content: none; } }

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font);
  font-size: 11pt;
  line-height: 1.7;
  color: var(--text);
  max-width: 210mm;
  margin: 0 auto;
}

/* 타이포그래피 */
h1 {
  font-size: 22pt; font-weight: 800; color: var(--primary);
  text-align: center; margin-bottom: 16pt; page-break-after: avoid;
}
h2 {
  font-size: 18pt; font-weight: 700; color: var(--primary);
  margin-top: 30pt; margin-bottom: 14pt; padding: 8pt 12pt;
  border-left: 5pt solid var(--primary);
  background: linear-gradient(to right, var(--primary-pale), transparent);
  page-break-after: avoid;
}
h3 {
  font-size: 14pt; font-weight: 700; color: var(--text);
  margin-top: 20pt; margin-bottom: 10pt; padding-left: 8pt;
  border-left: 3pt solid var(--success); page-break-after: avoid;
}
h4 {
  font-size: 12pt; font-weight: 600; margin-top: 14pt; margin-bottom: 8pt;
  page-break-after: avoid;
}
p { margin-bottom: 10pt; text-align: justify; word-break: keep-all; }

/* 표 */
table {
  width: 100%; border-collapse: collapse; margin: 14pt 0;
  font-size: 10pt; page-break-inside: avoid;
  border: 1pt solid var(--border);
}
thead { background: var(--primary); color: white; }
thead th { padding: 10pt 14pt; text-align: left; font-weight: 700; }
tbody tr { border-bottom: 1pt solid var(--border); }
tbody tr:nth-child(even) { background: var(--bg-alt); }
tbody td { padding: 8pt 14pt; }

/* 인용 (한 줄 요약용) */
blockquote {
  margin: 14pt 0; padding: 14pt 18pt;
  background: var(--primary-pale); border-left: 5pt solid var(--primary);
  border-radius: 6pt; font-size: 13pt; font-weight: 600; color: var(--primary);
  page-break-inside: avoid;
}
blockquote p { margin: 0; text-align: left; }

/* 코드 */
pre {
  margin: 14pt 0; padding: 14pt; background: var(--bg-alt);
  border: 1pt solid var(--border); border-radius: 6pt;
  font-family: var(--font-mono); font-size: 10pt;
  page-break-inside: avoid; overflow-x: auto;
}
code { font-family: var(--font-mono); font-size: 10pt; }

/* 수평선 */
hr {
  border: none; height: 2pt; margin: 20pt 0;
  background: linear-gradient(to right, var(--primary), var(--primary-light), transparent);
}

/* 리스트 */
ul, ol { margin-left: 18pt; margin-bottom: 10pt; }
li { margin-bottom: 5pt; line-height: 1.6; }

/* 인쇄 최적화 */
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  h1, h2, h3, h4, table, blockquote, pre { page-break-inside: avoid; }
  p, li { orphans: 3; widows: 3; }
  thead { display: table-header-group; }
}

/* 유틸리티 */
.page-break { page-break-before: always; }
.no-break { page-break-inside: avoid; }
```

**CSS 커스터마이징 가이드:**
| 변경 항목 | CSS 변수 | 예시 |
|----------|---------|------|
| 메인 색상 | `--primary` | 파란색 `#1e40af` → 초록색 `#065a60` |
| 폰트 | `--font` | Malgun Gothic → Pretendard |
| 여백 | `@page margin` | `20mm 25mm` → `15mm 20mm` |
| 본문 크기 | `body font-size` | `11pt` → `10pt` |

### 1-8. HTML 직접 작성 → PDF

CSS 템플릿 없이 HTML을 직접 작성하여 PDF로 변환할 때:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Malgun Gothic', sans-serif; font-size: 11pt; line-height: 1.7; }
  h1 { color: #1e40af; text-align: center; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e40af; color: white; padding: 8pt; }
  td { border: 1px solid #ddd; padding: 8pt; }
  @media print { * { -webkit-print-color-adjust: exact !important; } }
</style>
</head>
<body>
  <h1>보고서 제목</h1>
  <!-- 내용 -->
</body>
</html>
```

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless --disable-gpu --no-sandbox \
  --print-to-pdf="report.pdf" --print-to-pdf-no-header \
  --run-all-compositor-stages-before-draw --virtual-time-budget=10000 \
  "file:///C:/path/to/report.html"
```

---

## Phase 2. DOCX

### 2-1. DOCX 읽기

```bash
# pandoc으로 텍스트 추출
pandoc document.docx -o output.md

# tracked changes 포함
pandoc --track-changes=all document.docx -o output.md
```

### 2-2. DOCX 생성 (docx-js)

```bash
npm install -g docx
```

```javascript
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, PageNumber,
        LevelFormat, BorderStyle, WidthType, ShadingType, PageBreak } = require('docx');
const fs = require('fs');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Malgun Gothic", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Malgun Gothic" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Malgun Gothic" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({ children: [new TextRun({ text: "문서 제목", font: "Malgun Gothic" })] })
      ]})
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun("페이지 "), new TextRun({ children: [PageNumber.CURRENT] })
        ]})
      ]})
    },
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1,
        children: [new TextRun("보고서 제목")] }),
      new Paragraph({ children: [new TextRun("본문 내용입니다.")] }),
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1,
        children: [new TextRun("2장")] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => fs.writeFileSync("report.docx", buffer));
```

### 2-3. DOCX 테이블

```javascript
// DXA 단위: 1440 = 1인치
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

new Table({
  width: { size: 9026, type: WidthType.DXA }, // A4 콘텐츠 폭
  columnWidths: [4513, 4513],
  rows: [
    new TableRow({ children: [
      new TableCell({
        borders, width: { size: 4513, type: WidthType.DXA },
        shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "헤더", bold: true })] })]
      }),
      new TableCell({
        borders, width: { size: 4513, type: WidthType.DXA },
        shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: "헤더2", bold: true })] })]
      }),
    ]}),
  ]
})
```

### 2-4. DOCX 핵심 규칙
- **\n 사용 금지** → 별도 Paragraph로 분리
- **유니코드 불릿 금지** → LevelFormat.BULLET 사용
- **PageBreak는 반드시 Paragraph 안에**
- **ImageRun에 type 필수** (png/jpg)
- **테이블: WidthType.DXA만 사용** (PERCENTAGE는 Google Docs에서 깨짐)
- **ShadingType.CLEAR 사용** (SOLID는 검은 배경됨)

### 2-5. DOCX 편집 (기존 문서 수정)

```bash
# 1. 언팩
python scripts/office/unpack.py document.docx unpacked/

# 2. XML 직접 편집 (Edit 도구로 unpacked/word/document.xml 수정)

# 3. 리팩
python scripts/office/pack.py unpacked/ output.docx --original document.docx
```

---

## Phase 3. PPTX

### 3-1. PPTX 읽기

```bash
# 텍스트 추출
python -m markitdown presentation.pptx

# 슬라이드 이미지 변환
python scripts/office/soffice.py --headless --convert-to pdf presentation.pptx
pdftoppm -jpeg -r 150 presentation.pdf slide
```

### 3-2. PPTX 생성 (pptxgenjs)

```bash
npm install -g pptxgenjs
```

```javascript
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();

// 마스터 레이아웃
pres.defineSlideLayout({ name: 'CUSTOM', width: 10, height: 7.5 });
pres.layout = 'CUSTOM';

// 타이틀 슬라이드 (다크 배경)
let slide1 = pres.addSlide();
slide1.background = { color: "1E2761" };
slide1.addText("발표 제목", {
  x: 0.5, y: 2.5, w: 9, h: 1.5,
  fontFace: "Malgun Gothic", fontSize: 44, bold: true, color: "FFFFFF",
  align: "center"
});
slide1.addText("부제목 | 2026년 2월", {
  x: 0.5, y: 4.2, w: 9, h: 0.8,
  fontFace: "Malgun Gothic", fontSize: 20, color: "CADCFC",
  align: "center"
});

// 콘텐츠 슬라이드 (2단 레이아웃)
let slide2 = pres.addSlide();
slide2.background = { color: "F5F5F5" };
slide2.addText("섹션 제목", {
  x: 0.5, y: 0.3, w: 9, h: 0.8,
  fontFace: "Malgun Gothic", fontSize: 28, bold: true, color: "1E2761"
});
// 왼쪽 텍스트
slide2.addText([
  { text: "핵심 포인트 1\n", options: { fontSize: 16, bold: true, color: "333333" } },
  { text: "상세 설명 내용\n\n", options: { fontSize: 14, color: "666666" } },
  { text: "핵심 포인트 2\n", options: { fontSize: 16, bold: true, color: "333333" } },
  { text: "상세 설명 내용", options: { fontSize: 14, color: "666666" } },
], {
  x: 0.5, y: 1.3, w: 4.2, h: 5,
  fontFace: "Malgun Gothic", valign: "top"
});

// 숫자 강조 카드
slide2.addShape(pres.ShapeType.rect, {
  x: 5.2, y: 1.5, w: 4.3, h: 2,
  fill: { color: "FFFFFF" }, shadow: { type: 'outer', blur: 6, opacity: 0.2 },
  rectRadius: 0.1
});
slide2.addText("95%", {
  x: 5.2, y: 1.7, w: 4.3, h: 1,
  fontFace: "Malgun Gothic", fontSize: 60, bold: true, color: "1E64DC",
  align: "center"
});
slide2.addText("고객 만족도", {
  x: 5.2, y: 2.7, w: 4.3, h: 0.6,
  fontFace: "Malgun Gothic", fontSize: 16, color: "666666",
  align: "center"
});

pres.writeFile({ fileName: "presentation.pptx" });
```

### 3-3. PPTX 디자인 원칙

**색상 팔레트** (주제에 맞게 선택):

| 테마 | Primary | Secondary | Accent |
|------|---------|-----------|--------|
| Midnight Executive | `1E2761` | `CADCFC` | `FFFFFF` |
| Forest & Moss | `2C5F2D` | `97BC62` | `F5F5F5` |
| Coral Energy | `F96167` | `F9E795` | `2F3C7E` |
| Warm Terracotta | `B85042` | `E7E8D1` | `A7BEAE` |
| Ocean Gradient | `065A82` | `1C7293` | `21295C` |

**레이아웃 규칙**:
- 슬라이드 제목: 36-44pt bold
- 본문: 14-16pt
- 마진: 최소 0.5인치
- 모든 슬라이드에 시각 요소 포함 (텍스트만 금지)
- 같은 레이아웃 반복 금지 → 칼럼/카드/콜아웃 변형
- 제목 아래 밑줄 금지 (AI 생성 느낌)

### 3-4. PPTX QA (필수)

```bash
# 슬라이드 → 이미지 변환 후 시각 검증
python scripts/office/soffice.py --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 150 output.pdf slide
# → slide-01.jpg, slide-02.jpg ... 생성 후 Read로 확인
```

---

## Phase 4. XLSX

### 4-1. XLSX 읽기/분석

```python
import pandas as pd

df = pd.read_excel('data.xlsx')           # 기본 시트
all_sheets = pd.read_excel('data.xlsx', sheet_name=None)  # 전체 시트

df.head()       # 미리보기
df.info()       # 컬럼 정보
df.describe()   # 통계 요약
```

### 4-2. XLSX 생성 (openpyxl)

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = Workbook()
ws = wb.active
ws.title = "보고서"

# 한글 폰트 스타일
ko_header = Font(name='Malgun Gothic', size=12, bold=True, color='FFFFFF')
ko_body = Font(name='Malgun Gothic', size=11)
header_fill = PatternFill('solid', fgColor='1E64DC')
border = Border(
    left=Side(style='thin'), right=Side(style='thin'),
    top=Side(style='thin'), bottom=Side(style='thin')
)

# 헤더 행
headers = ["항목", "수량", "단가", "합계"]
for col, header in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col, value=header)
    cell.font = ko_header
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal='center')
    cell.border = border

# 데이터 행
data = [
    ["서버 호스팅", 3, 50000, None],
    ["도메인", 1, 15000, None],
    ["SSL 인증서", 1, 30000, None],
]
for r, row in enumerate(data, 2):
    for c, val in enumerate(row, 1):
        cell = ws.cell(row=r, column=c, value=val)
        cell.font = ko_body
        cell.border = border
    # 합계 수식 (하드코딩 금지!)
    ws.cell(row=r, column=4).value = f'=B{r}*C{r}'

# 총합 수식
total_row = len(data) + 2
ws.cell(row=total_row, column=3, value="총합").font = Font(name='Malgun Gothic', bold=True)
ws.cell(row=total_row, column=4, value=f'=SUM(D2:D{total_row-1})')

# 열 너비 조정
ws.column_dimensions['A'].width = 20
ws.column_dimensions['B'].width = 12
ws.column_dimensions['C'].width = 15
ws.column_dimensions['D'].width = 15

# 숫자 서식
for row in ws.iter_rows(min_row=2, max_row=total_row, min_col=3, max_col=4):
    for cell in row:
        if cell.value:
            cell.number_format = '#,##0'

wb.save('report.xlsx')
```

### 4-3. XLSX 수식 재계산 (필수)

openpyxl로 만든 파일은 수식 값이 계산되지 않은 상태. LibreOffice로 재계산:

```bash
python scripts/recalc.py output.xlsx
```

### 4-4. XLSX 핵심 규칙
- **수식 사용 필수** — Python에서 계산해서 하드코딩 금지
- **수식 재계산 필수** — 저장 후 반드시 `scripts/recalc.py` 실행
- **한글 폰트** — 모든 셀에 `Font(name='Malgun Gothic')` 적용
- **data_only=True로 열면 수식 영구 소실** — 읽기 전용으로만 사용
- **재무 모델**: 파란 텍스트=입력값, 검은 텍스트=수식, 노란 배경=주의

### 4-5. XLSX 기존 파일 편집

```python
from openpyxl import load_workbook

wb = load_workbook('existing.xlsx')
ws = wb.active

# 셀 수정
ws['A1'] = '새 값'
ws['A1'].font = Font(name='Malgun Gothic', size=11)

# 행/열 삽입
ws.insert_rows(2)
ws.delete_cols(3)

# 새 시트 추가
new_ws = wb.create_sheet('분석결과')
new_ws['A1'] = '데이터'

wb.save('modified.xlsx')
```

---

## Phase 5. HWP (아래한글)

한국 공공기관/기업에서 표준으로 사용하는 아래한글(.hwp, .hwpx) 파일 처리.

### 5-1. HWP 읽기 (텍스트 추출)

**방법 A: pyhwp (권장)**
```bash
pip install pyhwp
```

```bash
# 텍스트 추출
hwp5txt document.hwp > output.txt

# HTML 변환
hwp5html document.hwp > output.html

# ODT(OpenDocument) 변환
hwp5odt document.hwp

# 문서 구조 확인
hwp5proc cat document.hwp
```

**방법 B: olefile (저수준 파싱)**
```python
import olefile, zlib, struct

def extract_hwp_text(filepath):
    f = olefile.OleFileIO(filepath)
    encoded_text = b""
    for section in f.listdir():
        if section[0] == "BodyText":
            data = f.openstream(section).read()
            try:
                decoded = zlib.decompress(data, -15)
            except:
                decoded = data
            encoded_text += decoded

    # HWP 바이너리에서 텍스트 추출
    text = ""
    i = 0
    while i < len(encoded_text):
        if i + 1 < len(encoded_text):
            char_code = struct.unpack_from("<H", encoded_text, i)[0]
            if char_code == 0x0D:
                text += "\n"
            elif char_code > 31:
                text += chr(char_code)
        i += 2
    return text

text = extract_hwp_text("document.hwp")
print(text)
```

### 5-2. HWP 변환

**HWP → PDF/DOCX (LibreOffice)**
```bash
# HWP → PDF
python scripts/office/soffice.py --headless --convert-to pdf document.hwp

# HWP → DOCX
python scripts/office/soffice.py --headless --convert-to docx document.hwp

# 또는 직접 soffice 호출
soffice --headless --convert-to pdf document.hwp
soffice --headless --convert-to docx document.hwp
```

**HWP → HTML (pyhwp)**
```bash
hwp5html document.hwp --output document.html
# 이후 Chrome headless로 PDF 변환 가능
```

**HWPX (한글 XML 형식)**
```bash
# .hwpx는 ZIP 기반 XML 포맷 (DOCX와 유사)
# LibreOffice로 변환 가능
soffice --headless --convert-to pdf document.hwpx
soffice --headless --convert-to docx document.hwpx
```

### 5-3. HWP 변환 매트릭스

| From → To | 방법 | 품질 |
|-----------|------|------|
| HWP → PDF | LibreOffice headless | 우수 (레이아웃 보존) |
| HWP → DOCX | LibreOffice headless | 양호 (일부 서식 차이) |
| HWP → HTML | pyhwp (hwp5html) | 양호 (텍스트/표 보존) |
| HWP → TXT | pyhwp (hwp5txt) | 텍스트만 |
| HWP → ODT | pyhwp (hwp5odt) | 양호 |
| HWPX → PDF | LibreOffice headless | 우수 |
| HWPX → DOCX | LibreOffice headless | 양호 |

### 5-4. HWP 주의사항
- **생성은 불가** — HWP 파일 생성은 한컴오피스(유료)만 가능. 대안: DOCX로 생성 후 한컴오피스에서 열기
- **LibreOffice 필수** — 변환 품질이 가장 높음. 설치: https://www.libreoffice.org/download/
- **pyhwp는 HWP v5만 지원** — 구버전 HWP(v3, v5 이전)는 미지원
- **HWPX vs HWP** — HWPX는 XML 기반 신형식, HWP는 바이너리 구형식. HWPX가 변환 호환성 더 좋음
- **표/이미지** — 텍스트 추출은 잘 되지만, 복잡한 표/이미지 레이아웃은 LibreOffice 변환이 가장 정확

---

## Phase 6. 변환 매트릭스

형식 간 변환 방법:

| From → To | 방법 |
|-----------|------|
| DOCX → PDF | `soffice --convert-to pdf doc.docx` 또는 Chrome headless |
| PPTX → PDF | `soffice --convert-to pdf pres.pptx` |
| XLSX → PDF | `soffice --convert-to pdf data.xlsx` |
| **HWP → PDF** | `soffice --convert-to pdf doc.hwp` |
| **HWP → DOCX** | `soffice --convert-to docx doc.hwp` |
| **HWP → HTML** | `hwp5html doc.hwp > output.html` |
| **HWP → TXT** | `hwp5txt doc.hwp > output.txt` |
| PDF → DOCX | `pandoc input.pdf -o output.docx` (텍스트만) |
| MD → PDF | `pandoc input.md -o output.pdf --pdf-engine=xelatex -V mainfont="Malgun Gothic"` |
| MD → DOCX | `pandoc input.md -o output.docx` |
| HTML → PDF | Chrome headless `--print-to-pdf` |
| CSV → XLSX | pandas `pd.read_csv().to_excel()` |

**LibreOffice 변환 (범용)**:
```bash
# soffice.py 스크립트 사용 (샌드박스 환경 자동 처리)
python scripts/office/soffice.py --headless --convert-to pdf input.docx
python scripts/office/soffice.py --headless --convert-to pdf input.pptx
```

---

## Phase 7. 서브에이전트 위임 패턴

문서 생성은 서브에이전트에게 위임. **모델은 작업 복잡도에 따라 선택:**

| 작업 | 모델 | 이유 |
|------|------|------|
| 단순 PDF 변환 (HTML→PDF) | `haiku` | 변환 작업만 |
| 보고서/기획서 생성 | `sonnet` | 구조화+창작 필요 |
| PPTX 발표자료 | `sonnet` | 디자인+레이아웃 판단 |
| 단순 XLSX 데이터 입력 | `haiku` | 반복 작업 |
| XLSX 재무모델/분석 | `sonnet` | 수식 설계 필요 |
| HWP 텍스트 추출 | `haiku` | 단순 변환 |

```javascript
// PDF 보고서 생성 (구조화 필요 → sonnet)
Task({
  description: "PDF 보고서 생성",
  prompt: "reportlab + Malgun Gothic으로 A4 보고서 생성. [상세 내용]",
  subagent_type: "general-purpose",
  model: "sonnet",
  mode: "bypassPermissions"
})

// DOCX 계약서 생성 (법률 문서 → sonnet)
Task({
  description: "DOCX 계약서 생성",
  prompt: "docx-js + Malgun Gothic으로 A4 계약서 생성. [상세 내용]",
  subagent_type: "general-purpose",
  model: "sonnet",
  mode: "bypassPermissions"
})

// PPTX 발표자료 생성 (디자인 필요 → sonnet)
Task({
  description: "PPTX 발표자료 생성",
  prompt: "pptxgenjs + Malgun Gothic으로 10장 발표자료 생성. [상세 내용]",
  subagent_type: "general-purpose",
  model: "sonnet",
  mode: "bypassPermissions"
})

// XLSX 단순 데이터 정리 (반복 작업 → haiku)
Task({
  description: "XLSX 데이터 정리",
  prompt: "openpyxl + Malgun Gothic으로 데이터 정리. [상세 내용]",
  subagent_type: "general-purpose",
  model: "haiku",
  mode: "bypassPermissions"
})

// XLSX 재무모델 (수식 설계 → sonnet)
Task({
  description: "XLSX 재무모델 생성",
  prompt: "openpyxl + Malgun Gothic으로 재무모델 설계. [상세 내용]",
  subagent_type: "general-purpose",
  model: "sonnet",
  mode: "bypassPermissions"
})
```

---

## Phase 8. 의존성 설치

### Python
```bash
pip install pypdf pdfplumber reportlab openpyxl pandas pytesseract pdf2image
pip install "markitdown[pptx]"
pip install pyhwp olefile   # HWP 지원
```

### Node.js
```bash
npm install -g docx pptxgenjs
```

### CLI 도구
```bash
# poppler (PDF 도구)
# Windows: scoop install poppler 또는 choco install poppler
# 제공: pdftotext, pdftoppm, pdfimages

# pandoc (문서 변환)
winget install pandoc

# LibreOffice (범용 변환)
# https://www.libreoffice.org/download/
```

---

## Troubleshooting

### 한글이 깨진다
| 형식 | 해결 |
|------|------|
| PDF (reportlab) | `pdfmetrics.registerFont(TTFont('MalgunGothic', 'C:/Windows/Fonts/malgun.ttf'))` |
| PDF (Chrome) | HTML에 `font-family: 'Malgun Gothic'` CSS 추가 |
| PDF (pandoc) | `-V mainfont="Malgun Gothic"` |
| DOCX | `run: { font: "Malgun Gothic" }` |
| PPTX | `fontFace: "Malgun Gothic"` |
| XLSX | `Font(name='Malgun Gothic')` |

### PDF가 비어있다
- Chrome headless에 `--virtual-time-budget=10000` 추가
- `--run-all-compositor-stages-before-draw` 플래그 추가
- 입력 파일 URL이 `file:///` 형식인지 확인 (슬래시 3개)

### Chrome headless PDF가 캐싱 문제로 업데이트 안 된다
- `--headless` 대신 `--headless=new` 사용

### pandoc + CSS가 적용 안 된다
- `--standalone` 플래그 필수 (없으면 `<head>` 태그 미생성)
- CSS 경로가 절대경로인지 확인

### DOCX 테이블이 깨진다
- `WidthType.DXA` 사용 (PERCENTAGE 금지)
- columnWidths 합 = 테이블 width

### XLSX 수식이 안 보인다
- `python scripts/recalc.py output.xlsx` 실행 필수

### PPTX 폰트가 다르게 보인다
- fontFace를 시스템에 설치된 정확한 폰트명으로 지정
- 대상 PC에 해당 폰트가 없으면 기본 폰트로 대체됨

### HWP 파일이 안 열린다
- `pip install pyhwp olefile` 설치 확인
- HWP v5 이전 버전은 pyhwp 미지원 → LibreOffice로 시도
- LibreOffice 최신 버전 권장 (HWP 호환성 개선)

### HWP → PDF 변환 시 레이아웃이 다르다
- LibreOffice는 한컴오피스와 100% 동일하지 않음 (특히 복잡한 표/그림)
- 최선: HWPX 형식 사용 (XML 기반이라 호환성 더 높음)
- 대안: 한컴오피스에서 직접 PDF 내보내기

---

## 출처

본 스킬은 [Anthropic 공식 document-skills](https://github.com/anthropics/skills)를 기반으로 한글 최적화를 추가한 통합본입니다.
- PDF: `anthropics/skills/pdf` (Proprietary license)
- DOCX: `anthropics/skills/docx` (Proprietary license)
- PPTX: `anthropics/skills/pptx` (Proprietary license)
- XLSX: `anthropics/skills/xlsx` (Proprietary license)
