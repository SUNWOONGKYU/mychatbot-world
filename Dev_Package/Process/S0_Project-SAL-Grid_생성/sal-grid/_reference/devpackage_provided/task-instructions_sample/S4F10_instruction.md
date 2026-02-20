# S4F10: File System Access API 로컬 폴더 연결

## Task 정보
- **Task ID**: S4F10
- **Task Name**: File System Access API 로컬 폴더 연결
- **Stage**: S4 (개발 3차)
- **Area**: F (Frontend)
- **Dependencies**: S4F9

## Task 목표

File System Access API를 사용하여 사용자의 로컬 프로젝트 폴더에 웹 플랫폼에서 직접 접근(읽기/쓰기)할 수 있는 기능을 구현한다.

## 기술 배경

### File System Access API
- Chrome/Edge v86+ 지원 (Chromium 기반 브라우저)
- `window.showDirectoryPicker()`로 폴더 선택
- 선택한 폴더 내 모든 파일에 대한 읽기/쓰기/생성/삭제 가능
- `FileSystemDirectoryHandle`을 IndexedDB에 저장하여 세션 간 유지
- 재방문 시 `requestPermission()`으로 권한 재확인 (폴더 재선택 불필요)

### 브라우저 지원

| 브라우저 | 지원 |
|----------|:----:|
| Chrome (데스크톱) | ✅ v86+ |
| Edge (데스크톱) | ✅ v86+ |
| Opera | ✅ |
| Brave | ✅ |
| Firefox | ❌ |
| Safari | ❌ |
| 모바일 전체 | ❌ |

## 수정 사항

### 1. "폴더 연결" 버튼 기능 구현

S4F9에서 생성한 "폴더 연결" 버튼에 실제 기능을 연결한다.

```javascript
// 폴더 연결 흐름
async function connectLocalFolder(projectId) {
    // 1. 브라우저 지원 확인
    if (!('showDirectoryPicker' in window)) {
        alert('이 브라우저에서는 폴더 연결을 지원하지 않습니다.\nChrome 또는 Edge 브라우저를 사용해주세요.');
        return;
    }

    // 2. 기존 저장된 핸들 확인 (IndexedDB)
    const savedHandle = await getSavedDirectoryHandle(projectId);
    if (savedHandle) {
        const perm = await savedHandle.requestPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
            // 기존 연결 복원 성공
            return savedHandle;
        }
    }

    // 3. 새 폴더 선택
    const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });

    // 4. 프로젝트 폴더 구조 검증 (선택사항)
    // Dev Package 구조가 맞는지 확인

    // 5. IndexedDB에 핸들 저장
    await saveDirectoryHandle(projectId, dirHandle);

    return dirHandle;
}
```

### 2. IndexedDB 핸들 저장/복원

```javascript
// IndexedDB에 디렉토리 핸들 저장
async function saveDirectoryHandle(projectId, handle) { ... }

// IndexedDB에서 디렉토리 핸들 복원
async function getSavedDirectoryHandle(projectId) { ... }
```

### 3. 파일 탐색 및 읽기/쓰기 유틸리티

```javascript
// 폴더 내 파일 목록 조회
async function listFiles(dirHandle, path) { ... }

// 파일 읽기
async function readFile(dirHandle, filePath) { ... }

// 파일 쓰기
async function writeFile(dirHandle, filePath, content) { ... }

// 하위 폴더 접근
async function getSubDirectory(dirHandle, ...pathParts) { ... }
```

### 4. 연결 상태 UI 표시

- 폴더 연결 완료 시: "폴더 연결" 버튼 → "연결됨 ✓" 상태 표시
- 연결 해제 기능 제공
- 연결된 폴더 경로명 표시

### 5. 비지원 브라우저 안내

Chrome/Edge 외 브라우저에서 "폴더 연결" 클릭 시:
- 안내 메시지: "이 기능은 Chrome 또는 Edge 브라우저에서만 사용 가능합니다."
- 대안 안내: GitHub를 통한 파일 접근 방법 안내

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | File System Access API 관련 함수 추가 |
| `index.html` | IndexedDB 핸들 저장/복원 함수 |
| `index.html` | 연결 상태 UI 업데이트 로직 |
| `assets/css/main.css` | 연결 상태 배지/버튼 스타일 (필요 시) |

## 보안 고려사항

1. HTTPS 필수 (Vercel 자동 제공) - secure context에서만 API 작동
2. 사용자 제스처 필수 - 버튼 클릭 없이 자동 호출 불가
3. 사용자가 명시적으로 폴더 선택 - OS 폴더 선택 대화상자
4. 매 세션 권한 재확인 - 브라우저 재시작 시 권한 프롬프트
5. 민감 디렉토리 접근 자동 차단 (OS 수준)

---

## 필수 참조 규칙

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |
