---
name: youtube-generate
description: 유튜브 영상 올인원 생성 - 소재 파일 → 리서치 → 대본 → 재료 생성 → 블로그
argument-hint: "<소재파일경로>"
allowed-tools: "Bash(python *), Read, AskUserQuestion"
---

# YouTube 영상 올인원 자동화

소재 파일 하나로 유튜브 영상 제작에 필요한 모든 재료를 자동 생성합니다.

## 프로세스

### Step 1: 경쟁 영상 리서치 (Gemini)

소재와 유사한 인기 유튜브 영상을 자동 검색하고 대본/구조를 분석합니다.

```bash
python orchestrator.py --research $ARGUMENTS
```

실행 디렉토리: 현재 프로젝트의 Git 레포지토리 루트 (`git rev-parse --show-toplevel`로 확인)

완료 후 사용자에게 보고:
- 검색된 영상 수와 제목
- 분석 결과 요약
- output/research/[타임스탬프]/ 폴더 경로

사용자에게 "리서치 결과를 확인하셨나요? 대본 생성으로 넘어갈까요?" 확인 후 Step 2로.

### Step 2: 올인원 스크립트 생성 (Claude)

소재 + Step 1 리서치 결과를 참고하여 제목, 썸네일 문구, 대본을 한 번에 생성합니다.

```bash
python orchestrator.py --write $ARGUMENTS
```

완료 후:
1. 생성된 title.txt 내용을 사용자에게 보여주기
2. 생성된 thumbnail.txt 내용을 사용자에게 보여주기
3. 생성된 script.txt 내용을 사용자에게 보여주기
4. **반드시** "대본 내용이 괜찮으신가요? 수정할 부분이 있으면 말씀해주세요." 확인

사용자가 수정 요청하면 script.txt를 수정합니다.
사용자가 OK하면 Step 3으로.

### Step 3: 영상 재료 생성

확정된 대본으로 음성, 이미지 프롬프트, Vrew 가이드, 메타데이터를 자동 생성합니다.

사용자에게 롱폼/숏폼 여부를 확인합니다.

```bash
# 롱폼
python orchestrator.py output/scripts/[타임스탬프]/script.txt

# 숏폼
python orchestrator.py output/scripts/[타임스탬프]/script.txt --short
```

완료 후 사용자에게 보고:
- 생성된 파일 목록 (음성, 이미지 프롬프트, 가이드, 메타데이터)
- output 폴더 경로
- "Vrew에서 편집 후 유튜브에 업로드하세요. 업로드 후 블로그 글이 필요하면 유튜브 URL을 알려주세요."

### Step 4: 블로그 글 생성 (선택)

사용자가 유튜브 URL을 제공하면 블로그 글을 생성합니다.

```bash
python orchestrator.py --blog <유튜브URL> output/[Step3 폴더경로]
```

완료 후 사용자에게 보고:
- 생성된 블로그 글 미리보기
- 파일 경로

## 사용 예시

```
/youtube-generate input/topic.txt
/youtube-generate input/건강정보_소재.txt
```

## 관련 파일

- 오케스트레이터: `orchestrator.py`
- 경쟁 분석: `modules/competitor_analyzer.py`
- 스크립트 생성: `modules/script_writer.py`
- 음성 생성: `modules/voice_generator.py`
- 이미지 프롬프트: `modules/prompt_generator.py`
- Vrew 가이드: `modules/guide_generator.py`
- 메타데이터: `modules/metadata_generator.py`
- 블로그: `modules/blog_generator.py`
- 설정: `config/settings.yaml`

## 사전 준비 (이 스킬을 사용하기 전에)

이 SKILL.md는 **실행 지시서**입니다. 아래 파일/환경이 프로젝트에 먼저 준비되어 있어야 동작합니다.

1. **Python 프로젝트 구조**: 위 관련 파일 목록의 Python 파일들을 직접 구축해야 합니다.
   - `orchestrator.py` - 전체 파이프라인을 조율하는 메인 스크립트
   - `modules/` - 각 단계별 모듈 (리서치, 대본, 음성, 이미지, 블로그 등)
   - `config/settings.yaml` - API 키, 모델 설정 등
2. **Python 환경**: Python 3.x + 필요한 패키지 설치 (`pip install -r requirements.txt`)
3. **외부 API 키**: 사용하는 AI 모델(Gemini, Claude 등)의 API 키 설정
4. **Claude Code**: `.claude/skills/youtube-generate/SKILL.md`에 배치하면 `/youtube-generate` 명령 사용 가능

위 파일들은 이 스킬에 포함되어 있지 않습니다. 이 스킬은 "이미 구축된 YouTube 영상 자동화 프로젝트"를 Claude Code에서 편리하게 실행하기 위한 명령 템플릿입니다. 자신의 프로젝트 구조에 맞게 명령어와 경로를 수정하여 사용하세요.
