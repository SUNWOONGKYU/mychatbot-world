\---

name: youtube-generate-코어4
description: 유튜브 영상 올인원 자동화 — 소재 파일 → 리서치 → 대본 → 재료 생성 → 블로그
argument-hint: "<소재파일경로>"
allowed-tools: "Bash(python \*), Read, Write, Edit"
---

# YouTube 영상 올인원 자동화

소재 파일 하나로 유튜브 영상 제작에 필요한 모든 재료를 자동 생성합니다.

## 시스템 경로

```
프로젝트 루트: $YOUTUBE\_ROOT  (기본값 예시: C:\\YouTube\\ 또는 \~/YouTube/)
오케스트레이터: $YOUTUBE\_ROOT/orchestrator.py
설정 파일: $YOUTUBE\_ROOT/config/settings.yaml
소재 입력: $YOUTUBE\_ROOT/input/
결과 출력: $YOUTUBE\_ROOT/output/\[타임스탬프]/
```

> 모든 python 명령어는 프로젝트 루트 디렉토리에서 실행한다.
> Windows 기본 경로: `C:\\YouTube\\` / macOS·Linux 기본 경로: `\~/YouTube/`

\---

## 전체 워크플로우

```
\[선택] Step 0-A: 경쟁 영상 자동 검색 + 분석 (--research)
\[선택] Step 0-B: 특정 URL 경쟁 영상 분석 (--analyze)
         ↓
Step 1: 제목 + 썸네일 + 대본 생성 (--write)
         ↓
Step 2: 영상 재료 일괄 생성 (롱폼 or 숏폼)
         - 이미지 프롬프트 생성
         - 음성 생성 (ElevenLabs)
         - Vrew 편집 가이드 생성
         - 메타데이터 생성
         ↓
\[수동] Step 3: 이미지 생성 (Whisk / 나노바나나)
\[수동] Step 4: Vrew 편집 + YouTube 업로드
         ↓
\[선택] Step 5: 블로그 글 생성 (--blog)
```

\---

## Step 0-A: 경쟁 영상 자동 검색 (선택)

소재와 유사한 인기 유튜브 영상을 자동 검색하고 대본·구조를 분석합니다.

```bash
cd "$YOUTUBE\_ROOT"  # 또는 cd C:/YouTube (Windows 기본)
python orchestrator.py --research $ARGUMENTS
```

완료 후 보고:

* 검색된 영상 수와 제목
* 분석 결과 요약
* 출력 경로: `output/research/\[타임스탬프]/`

사용자에게 확인: "리서치 결과를 확인하셨나요? 대본 작성으로 넘어갈까요?"

\---

## Step 0-B: 특정 경쟁 영상 분석 (선택)

분석할 유튜브 URL을 지정하여 해당 영상의 대본·구조를 분석합니다.

```bash
cd "$YOUTUBE\_ROOT"  # 또는 cd C:/YouTube (Windows 기본)
python orchestrator.py --analyze <유튜브URL>
```

완료 후 출력 경로: `output/research/\[타임스탬프]/`

\---

## Step 1: 제목 + 썸네일 + 대본 생성

소재 파일 + 리서치 결과(선택)를 바탕으로 제목, 썸네일 문구, 대본을 한 번에 생성합니다.

```bash
cd "$YOUTUBE\_ROOT"  # 또는 cd C:/YouTube (Windows 기본)

# 리서치 결과 없이 소재만으로 생성
python orchestrator.py --write $ARGUMENTS

# 리서치 결과를 참고하여 생성
python orchestrator.py --write $ARGUMENTS --ref output/research/\[타임스탬프]
```

완료 후:

1. `title.txt` 내용을 사용자에게 표시
2. `thumbnail.txt` 내용을 사용자에게 표시
3. `script.txt` 내용을 사용자에게 표시
4. **반드시** 확인: "대본 내용이 괜찮으신가요? 수정할 부분이 있으면 말씀해주세요."

사용자가 수정 요청하면 `00\_script/script.txt`를 수정합니다.
사용자가 OK하면 Step 2로.

\---

## Step 2: 영상 재료 일괄 생성

확정된 대본으로 음성, 이미지 프롬프트, Vrew 편집 가이드, 메타데이터를 자동 생성합니다.

먼저 사용자에게 확인: **"롱폼과 숏폼 중 어떤 형식으로 만드실 건가요?"**

```bash
cd "$YOUTUBE\_ROOT"  # 또는 cd C:/YouTube (Windows 기본)

# 롱폼 (기본)
python orchestrator.py output/\[타임스탬프]/00\_script/script.txt --source $ARGUMENTS

# 숏폼
python orchestrator.py output/\[타임스탬프]/00\_script/script.txt --source $ARGUMENTS --short
```

### 자동 생성 항목

|항목|도구|자동화 수준|
|-|-|-|
|스크립트 분석 + 키워드 추출|Claude|✅ 완전 자동|
|이미지 프롬프트 생성|Claude|✅ 완전 자동|
|프롬프트 클립보드 자동 복사|pyperclip|✅ 완전 자동|
|음성 파일 생성|ElevenLabs API|✅ 완전 자동|
|Vrew 편집 가이드 생성|Claude|✅ 완전 자동|
|메타데이터 생성 (제목·설명·태그)|Claude|✅ 완전 자동|
|이미지 생성|Whisk / 나노바나나|⚠️ 프롬프트 준비만|
|영상 편집|Vrew|❌ 가이드 제공만|

완료 후 사용자에게 보고:

```
생성된 파일 목록:
- 00\_script/script.txt    ← 최종 대본
- 01\_voice/narration.mp3  ← ElevenLabs 음성
- 02\_images/              ← 이미지 저장 위치 (수동)
- 03\_prompts/image\_prompts.txt  ← 이미지 생성 프롬프트
- 04\_guide/vrew\_guide.md  ← Vrew 편집 가이드
- 04\_guide/timeline.md    ← 타임라인
- 05\_metadata/title.txt   ← 업로드 제목
- 05\_metadata/description.txt ← 업로드 설명
- 05\_metadata/tags.txt    ← 태그

출력 폴더: C:\\YouTube\\output\\\[타임스탬프]\\

다음 단계:
1. 첫 번째 이미지 프롬프트가 클립보드에 복사됨 → Whisk/나노바나나에 붙여넣기
2. 이미지 생성 후 02\_images/ 폴더에 저장
3. Vrew 실행 → vrew\_guide.md 가이드에 따라 편집
4. YouTube 업로드 후 블로그 글이 필요하면 URL을 알려주세요.
```

\---

## Step 3 (수동): 이미지 생성

이미지 프롬프트를 순차적으로 Whisk 또는 나노바나나에 입력하여 이미지를 생성합니다.

**사용자가 "다음 프롬프트"라고 하면:**

`03\_prompts/image\_prompts.txt`에서 다음 프롬프트를 읽어 사용자에게 제공합니다.

```bash
cd "$YOUTUBE\_ROOT"  # 또는 cd C:/YouTube (Windows 기본)
python -c "
with open('output/latest/03\_prompts/image\_prompts.txt', 'r', encoding='utf-8') as f:
    prompts = \[p.strip() for p in f.read().split('---') if p.strip()]
print(prompts\[0] if prompts else '프롬프트 없음')
"
```

\---



## Step 4 (수동): Vrew 편집 + YouTube 업로드

Step 2에서 생성된 재료를 사용하여 영상을 편집하고 업로드합니다.

### 4-1. Vrew 편집

1. Vrew 실행 후 `01\_voice/narration.mp3` 불러오기
2. `04\_guide/vrew\_guide.md` 가이드에 따라 편집:

   * 자막 자동 생성 확인 및 수정
   * `02\_images/` 폴더의 이미지를 타임라인에 배치 (`04\_guide/timeline.md` 참고)
   * 배경음악 추가 (선택)
   * 인트로/아웃트로 추가 (선택)
3. 최종 영상 내보내기 (MP4, 1080p 권장)

### 4-2. YouTube 업로드

`05\_metadata/` 폴더의 파일을 참고하여 업로드합니다:

|항목|파일|내용|
|-|-|-|
|제목|`05\_metadata/title.txt`|업로드용 최종 제목|
|설명|`05\_metadata/description.txt`|영상 설명 (타임스탬프 포함)|
|태그|`05\_metadata/tags.txt`|검색 태그 목록|
|썸네일|`00\_script/thumbnail.txt`|썸네일 문구 → 이미지 제작 후 업로드|

업로드 완료 후 YouTube URL을 복사해두세요 → Step 5 블로그 글 생성에 사용됩니다.

\---

## Step 5: 블로그 글 생성 (선택)

YouTube 업로드 후 사용자가 URL을 제공하면 블로그 글을 자동 생성합니다.

```bash
cd "$YOUTUBE\_ROOT"  # 또는 cd C:/YouTube (Windows 기본)
python orchestrator.py --blog <유튜브URL> output/\[Step2 타임스탬프 폴더]
```

완료 후:

* 생성된 블로그 글 전체 내용을 사용자에게 표시
* 파일 경로: `output/\[타임스탬프]/06\_blog/blog\_post.txt`

\---

## 출력 폴더 구조

```
C:\\YouTube\\output\\\[YYYYMMDD\_HHMMSS]\\
├── 00\_script/
│   ├── source.txt          # 원본 소재 파일
│   ├── title.txt           # 영상 제목 (초안)
│   ├── thumbnail.txt       # 썸네일 문구
│   └── script.txt          # 최종 대본
├── 01\_voice/
│   └── narration.mp3       # ElevenLabs 생성 음성
├── 02\_images/              # 이미지 저장 위치 (수동으로 저장)
│   ├── 01\_intro.png
│   ├── 02\_main1.png
│   └── ...
├── 03\_prompts/
│   └── image\_prompts.txt   # Whisk/나노바나나 복붙용 프롬프트
├── 04\_guide/
│   ├── vrew\_guide.md       # Vrew 편집 단계별 가이드
│   └── timeline.md         # 이미지 배치 타임라인
├── 05\_metadata/
│   ├── title.txt           # 업로드용 제목
│   ├── description.txt     # 업로드용 설명
│   └── tags.txt            # 태그
└── 06\_blog/                # 블로그 글 (선택)
    └── blog\_post.txt
```

\---

## API 설정 확인

스킬 실행 전 설정이 되어 있는지 확인합니다.

```bash
cd "$YOUTUBE\_ROOT"  # 또는 cd C:/YouTube (Windows 기본)
cat config/settings.yaml
```

### 필수 API

|API|용도|설정 위치|
|-|-|-|
|Gemini API|경쟁 영상 리서치 + 분석|`config/settings.yaml` → `api\_keys.gemini.api\_key`|

### 선택 API

|API|용도|설정 위치|
|-|-|-|
|ElevenLabs|음성 자동 생성|`config/settings.yaml` → `api\_keys.elevenlabs.api\_key`|

API 키 미설정 시:

* Gemini: 리서치 단계 실행 불가
* ElevenLabs: 음성 생성 건너뜀 (나머지는 정상 실행)

\---

## 사용 예시

```
/youtube-generate C:/YouTube/input/topic.txt
/youtube-generate input/건강정보\_소재.txt
```

\---

## 관련 모듈

|모듈|역할|
|-|-|
|`orchestrator.py`|메인 파이프라인 조율|
|`modules/competitor\_analyzer.py`|경쟁 영상 검색 + 분석 (Gemini)|
|`modules/script\_writer.py`|제목 + 썸네일 + 대본 생성|
|`modules/script\_analyzer.py`|대본 섹션 분할 + 키워드 추출|
|`modules/prompt\_generator.py`|이미지 프롬프트 생성|
|`modules/voice\_generator.py`|ElevenLabs 음성 생성|
|`modules/guide\_generator.py`|Vrew 편집 가이드 생성|
|`modules/metadata\_generator.py`|제목 + 설명 + 태그 생성|
|`modules/clipboard\_helper.py`|프롬프트 클립보드 자동 복사|
|`modules/blog\_generator.py`|블로그 글 생성|
|`config/settings.yaml`|API 키 + 모델 + 스타일 설정|



