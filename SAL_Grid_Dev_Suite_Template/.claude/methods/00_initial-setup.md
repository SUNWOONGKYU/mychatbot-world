# 00. 초기 설정 (Dev Package 첫 실행 시)

> **적용 시점**: 사용자가 Dev Package 폴더를 복사한 후 처음 `claude` 명령어를 실행했을 때
> **트리거 표현**: "개발 환경 확인해줘", "프로젝트 초기 설정 해줘", "개발 환경 설정"

---

## 핵심 원칙

```
사용자가 Dev Package를 프로젝트 폴더에 복사하고 Claude Code를 실행했다면,
나머지는 모두 Claude Code가 알아서 처리한다.
```

---

## 1. 개발 도구 확인 (필수)

### 확인할 도구 목록

| 도구 | 확인 명령어 | 필수 여부 |
|------|------------|----------|
| Git | `git --version` | 필수 |
| Node.js | `node --version` | 설치됨 (Claude Code 실행 가능하면) |
| npm | `npm --version` | 설치됨 (Node.js에 포함) |

### 확인 프로세스

```bash
# Step 1: Git 확인
git --version

# Step 2: Git 사용자 설정 확인
git config user.name
git config user.email

# Step 3: Node.js 확인
node --version

# Step 4: npm 확인
npm --version
```

### Git 사용자 설정 안내

**미설정 시 안내:**
```
"Git 사용자 정보가 설정되어 있지 않습니다.

다음 명령어로 설정해주세요:
git config --global user.name \"이름\"
git config --global user.email \"이메일@example.com\"

설정 완료 후 '다시 확인해줘'라고 말씀해주세요."
```

### 결과별 대응

**모두 설치됨:**
```
"개발 도구가 모두 설치되어 있습니다.

- Git: v2.x.x
- Node.js: v20.x.x
- npm: v10.x.x

다음 단계로 프로젝트 초기화를 진행하겠습니다."
```

**Git 미설치:**
```
"Git이 설치되어 있지 않습니다.

설치 방법:
- Windows: https://git-scm.com 에서 다운로드
- Mac: 터미널에서 'xcode-select --install' 실행

설치 완료 후 '다시 확인해줘'라고 말씀해주세요."
```

---

## 2. 프로젝트 초기화

### Git 저장소 확인 및 초기화

```bash
# .git 폴더 존재 확인
ls -la .git

# 없으면 초기화
git init
```

### 설정 파일 확인

| 파일 | 용도 | 없으면? |
|------|------|---------|
| `.claude/CLAUDE.md` | AI 최상위 지침 | Dev Package 손상 — 재설치 안내 |
| `.gitignore` | Git 제외 설정 | 존재해야 함 |
| `README.md` | 패키지 설명 | 존재해야 함 |

### 환경 변수 설정 안내

외부 서비스(DB, API 등)가 필요한 경우:

```
"외부 서비스 연동을 위해 환경 변수 설정이 필요합니다.

프로젝트 루트에 .env.local 파일을 생성하고 아래 항목을 입력해주세요:

[필요한 항목 — 프로젝트별로 다름]

.env.local은 .gitignore에 포함되어 있어 절대 커밋되지 않습니다."
```

> ⚠️ 환경 변수 값은 절대 코드나 문서에 하드코딩하지 않는다.

---

## 3. 초기 커밋

```bash
git add .
git commit -m "Initial commit: Project setup complete"
```

---

## 4. 다음 단계 안내

```
"프로젝트 초기 설정이 완료되었습니다!

현재 상태:
- Git 저장소: 초기화 완료
- 개발 도구: 모두 설치됨

다음 단계:
1. /sal-grid-dev-슈퍼스킬-core 실행 → SAL Grid 구조 자동 생성
2. S0 단계부터 순서대로 개발 진행

'/sal-grid-dev' 라고 말씀해주세요."
```

---

## 5. GitHub 배포 안내 (S0 완료 후)

### 사전 조건 확인

```bash
gh --version
gh auth status
```

### 미설치 시 안내

```
"GitHub Pages 배포를 위해 설정이 필요합니다.

1. GitHub CLI 설치:
   - Windows: winget install GitHub.cli
   - Mac: brew install gh

2. GitHub 로그인:
   gh auth login

설정 완료 후 '배포해줘'라고 말씀해주세요."
```

### 배포 프로세스

```bash
# Step 1: 커밋
git add .
git commit -m "Initial commit: Project SAL Grid setup complete"

# Step 2: GitHub 레포 생성 + 푸시
gh repo create {프로젝트명} --public --source=. --push

# Step 3: GitHub Pages 활성화
gh api repos/{owner}/{repo}/pages -X POST --input - <<< '{"build_type":"legacy","source":{"branch":"main","path":"/"}}'
```

**배포 완료 후 Viewer URL:**
```
https://{username}.github.io/{repo}/Process/S0_Project-SAL-Grid_생성/viewer/viewer_json.html
```

---

## 체크리스트

- [ ] Git 설치 확인
- [ ] Node.js 설치 확인
- [ ] Git 사용자 정보 설정
- [ ] `.claude/CLAUDE.md` 존재 확인
- [ ] 환경 변수 (.env.local) 설정
- [ ] Git 저장소 초기화
- [ ] 초기 커밋

---

---

## [Optional] SSAL Works Integration

> Apply only when integrating with the SSAL Works platform (www.ssalworks.ai.kr).
> Skip this section for general projects not using SSAL Works.

### Project ID Auto-Lookup (.ssal-project.json)

For projects registered on SSAL Works, auto-fetch the project_id via API and generate `.ssal-project.json`.

**자동 설정 프로세스:**

```
Step 1: 사용자 이메일 입력 요청
  → "SSAL Works 가입 시 사용한 이메일을 알려주세요"

Step 2: API로 project_id 조회
  → users 테이블: email → user_id 조회
  → projects 테이블: user_id → project_id 조회

Step 3: .ssal-project.json 자동 생성
  → project_id, project_name, owner_email 입력
```

**API 조회 코드 (bash):**

```bash
SUPABASE_URL="https://gybgkehtonqhosuutoxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3am1mZXd5c2hod3Bnd2R0cnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NTk5MDUsImV4cCI6MjA0ODIzNTkwNX0.2MzKf9o08rsVjNGzUkdgaGpULBvDVSQ1_X8QXhopPmg"
USER_EMAIL="사용자이메일@example.com"

# users 테이블에서 email로 user_id 조회
USER_ID=$(curl -s "${SUPABASE_URL}/rest/v1/users?select=user_id&email=eq.${USER_EMAIL}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" | jq -r '.[0].user_id')

# projects 테이블에서 project_id, project_name 조회
PROJECT_DATA=$(curl -s "${SUPABASE_URL}/rest/v1/projects?select=project_id,project_name&user_id=eq.${USER_ID}&status=eq.in_progress" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")
```

**생성되는 .ssal-project.json:**

```json
{
  "project_id": "A3B5C7D9-P001",
  "project_name": "내 SaaS 프로젝트",
  "owner_email": "user@example.com",
  "created_at": "2025-01-12T12:00:00.000Z"
}
```

**에러 처리:**

| 에러 상황 | 대응 |
|----------|------|
| 이메일 미등록 | SSAL Works 가입 확인 안내 |
| 프로젝트 없음 | 프로젝트 등록 안내 (www.ssalworks.ai.kr) |
| API 연결 실패 | 인터넷 연결 확인 |

---

### Viewer Connection ("Viewer 연결해줘")

After GitHub Pages deployment, register the GitHub URL in the SSAL Works platform.

```bash
# Git remote URL 확인
git remote get-url origin

# SSAL Works users 테이블에 github_repo_url 등록
curl -X PATCH "https://gybgkehtonqhosuutoxx.supabase.co/rest/v1/users?email=eq.{사용자이메일}" \
  -H "apikey: {SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"github_repo_url": "https://github.com/{username}/{repo}"}'
```

**완료 메시지:**
```
"SSAL Works 플랫폼 연동 완료!

www.ssalworks.ai.kr에서 확인:
1. 사이트 접속 후 로그인
2. "Project SAL Grid" 섹션 → Viewer 열기

Task 완료 후 git push하면 실시간으로 반영됩니다."
```

---

### SSAL Works Integration Checklist

- [ ] SSAL Works 가입 확인 (www.ssalworks.ai.kr)
- [ ] project_id 자동 조회 완료
- [ ] .ssal-project.json 생성 완료
- [ ] GitHub 배포 완료
- [ ] Viewer URL 연동 완료 (github_repo_url 등록)
