# Work Log - 2026-02-28 (자율 품질 개선)

> Bravo 2분대장 자율 진행: RAG 채팅 주입 연결, 테스트 추가, CORS 수정

---

## 자율 품질 개선 작업 (2026-02-28)

### 작업 상태: ✅ 완료

### 1. Obsidian RAG ↔ 채팅 연결 (S3BI1 후속)

| 파일 | 변경 내용 |
|------|----------|
| `api/_shared.js` | `fetchRagChunks()` + `buildRagSection()` 추가 (+105 lines) |
| `api/chat.js` | personaId/ownerId 기반 RAG 자동 주입 연결 |
| `api/chat-stream.js` | SSE 스트리밍에도 RAG 주입 동일 적용 |
| `js/chat.js` | botConfig에 personaId, ownerId 포함하여 서버 전달 |

### 2. 단위 테스트 확장 (_shared.test.js)

- `buildRagSection()` 테스트 6개 추가 (총 34개 → 전부 PASS)
- `vitest.config.js` 생성 (api/_shared.test.js 범위 한정)
- `package.json` test 스크립트 업데이트

### 3. Vercel CORS 헤더 수정 (vercel.json)

- `/api/(.*)` CORS에 `Authorization` 헤더 추가 (JWT 인증 허용)
- `DELETE` 메서드 추가 (Obsidian 문서 삭제 허용)

### 검증 결과
- 34개 단위 테스트 전부 PASS
- 5개 API 파일 구문 검증 OK
- pgvector 함수 시그니처 일치 확인

---

# Work Log - 2026-02-28

> SAL Grid Task CRUD 프로세스: 프로토타입 완료 기능 7개 Task 등록 (시나리오 B)

---

## SAL Grid Task CRUD - 프로토타입 완료 기능 7개 Task 등록 (2026-02-28)

### 작업 상태: ✅ 완료

### 담당: Bravo (2분대장)

### 추가된 Task (시나리오 B - Completed 상태)

| Task ID | Task Name | Area | Stage |
|---------|-----------|------|-------|
| S3F4 | 챗봇 생성 위저드 8단계 확장 | F | S3 |
| S3BI1 | Obsidian 지식베이스 연동 | BI | S3 |
| S3E2 | 스킬 외부 API 연동 7개 | E | S3 |
| S3F5 | 유료 스킬 마이페이지 설정 UI | F | S3 |
| S3BA3 | 수익활동 중개 시스템 | BA | S3 |
| S3BA4 | 크레딧 결제 시스템 | BA | S3 |
| S3D1 | DB 스키마 확장 (15개 신규 테이블) | D | S3 |

### 업데이트된 파일 (총 22개)

**TASK_PLAN.md**: v0.1 → v0.2, 총 Task 수 28→35, S3 Task 목록 추가, Task 분포표 업데이트, 변경 이력 추가

**task-instructions/ (7개 신규)**:
- S3F4_instruction.md, S3BI1_instruction.md, S3E2_instruction.md
- S3F5_instruction.md, S3BA3_instruction.md, S3BA4_instruction.md, S3D1_instruction.md

**verification-instructions/ (7개 신규)**:
- S3F4_verification.md, S3BI1_verification.md, S3E2_verification.md
- S3F5_verification.md, S3BA3_verification.md, S3BA4_verification.md, S3D1_verification.md

**index.json**: total_tasks 28→35, task_ids에 7개 추가 (S3F4, S3F5, S3BI1, S3BA3, S3BA4, S3D1, S3E2)

**grid_records/ (7개 신규)**:
- S3F4.json, S3BI1.json, S3E2.json, S3F5.json, S3BA3.json, S3BA4.json, S3D1.json

### SAL ID 의존성 검증 결과
- S3F4 → S2F1~S2F4 ✅ (S2 < S3)
- S3BI1 → S1BI1, S1D1 ✅ (S1 < S3)
- S3E2 → S3E1, S1BI1 ✅ (E1 < E2, S1 < S3)
- S3F5 → S2F1, S2F2, S3F4 ✅ (S2 < S3, F4 < F5)
- S3D1 → S1D1 ✅ (S1 < S3)
- S3BA3 → S2BA1, S2BA2, S3BA1, S3D1 ✅
- S3BA4 → S2BA1, S2BA2, S3BA1, S3D1 ✅

---

# Work Log - 2026-02-16

> 마이페이지 봇 목록 DB 동적 로딩 + Supabase 통합 + 모바일 UI 수정

---

## 1. 마이페이지 봇 목록 - DB 동적 로딩

### 작업 내용
- `pages/home/index.html` 하드코딩된 SunnyBot 카드 제거 → `<div id="botListContainer">` 동적 렌더링으로 교체
- `js/kb-manager.js`에 `loadUserBotsFromCloud()` 함수 추가 (Supabase `mcw_bots` + `mcw_personas` 조회)
- `js/home.js`의 `init()`에서 클라우드 봇 로드 → localStorage 머지 → `renderBotList()` 호출
- `js/migration.js`에 SunnyBot 생성/업데이트 시 `StorageManager.syncBotToCloud()` 호출 추가

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `js/kb-manager.js` | `loadUserBotsFromCloud()` 추가, `syncBotToCloud()` 전체 페르소나 동기화, public API에 추가 |
| `js/migration.js` | SunnyBot 생성/업데이트 후 cloud sync 호출 |
| `pages/home/index.html` | 하드코딩 제거, 스크립트 추가 (kb-manager.js, home.js), HomePage.init() 호출 |
| `js/home.js` | init()에서 cloud bot 로드 후 renderBotList(), createBotBtn 표시 제어 |

### 커밋
- `0240c3c` - Load bot list dynamically from Supabase on mypage

---

## 2. CSS 404 수정

### 문제
- `pages/home/index.html`에서 `dashboard.css` 참조 → 404 에러
- 봇 카드 스타일이 적용되지 않음

### 해결
- `dashboard.css` → `home.css`로 변경 (실제 스타일이 있는 파일)

### 커밋
- `610f7f5` - Fix 404: replace missing dashboard.css with home.css

---

## 3. "새 챗봇 생성" 버튼 숨김

### 문제
- 봇이 이미 있는 유저에게도 "새 챗봇 생성" 버튼 노출

### 해결
- 버튼 기본 `display:none`, `renderBotList()`에서 봇 없을 때만 표시
- 1인 1봇, 최대 10 페르소나 정책 반영

### 커밋
- `ad10338` - Hide create-bot button when user already has a bot

---

## 4. 로그인 불가 - secrets.js 404

### 문제
- `.gitignore`에 `js/secrets.js`, `js/config.js` 포함 → Vercel 배포 시 404
- Supabase 클라이언트 초기화 실패 → "Auth not initialized" 에러

### 해결
- `.gitignore`에서 `js/secrets.js`, `js/config.js` 제거
- `git add -f` 로 강제 추가

### 커밋
- `11e4dcd` - Include secrets.js and config.js in deployment
- `ccac786` - Remove debug logging from login page (디버그 코드 정리)

---

## 5. 채팅 페이지 - 클라우드 봇 로드

### 문제
- `pages/bot/index.html`에서 SunnyBot이 하드코딩 → 다른 봇(honggildong-bot) 방문 시 SunnyBot 표시
- `chat.js`의 `loadBotData()`가 localStorage만 확인

### 해결
- `chat.js`의 `loadBotData()` async로 변경, Supabase fallback 추가
- `pages/bot/index.html`에서 하드코딩 텍스트 제거, kb-manager.js 스크립트 추가

### 커밋
- `ae2e7ed` - Load bot from cloud when not in localStorage

---

## 6. 페르소나 1개일 때 환영 메시지 수정

### 문제
- 페르소나 1개인데 "페르소나를 선택해주세요" 문구 표시

### 해결
- 1개: 해당 페르소나의 greeting 바로 표시
- 2개 이상: 봇 greeting + 선택 안내

### 커밋
- `878cd41` - Show persona greeting instead of selection prompt when only 1 persona

---

## 7. Supabase 채팅 로그 + KB 클라우드 동기화

### 작업 내용
- `mcw_chat_logs` 테이블 생성 (BIGSERIAL id, RLS 정책)
- `chat.js`에 dual-write 패턴 (localStorage + Supabase insert)
- `kb-manager.js`에 KB save→Supabase sync, load→Supabase fallback 추가

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/20260216040000_create_chat_logs.sql` | mcw_chat_logs 테이블 생성 |
| `js/chat.js` | 채팅 로그 Supabase insert (session_id 기반) |
| `js/kb-manager.js` | KB save/load Supabase 동기화 |

### 커밋
- `bc9233c` - Add Supabase chat logging, KB cloud sync, fix mobile input
- `0b2774d` - Fix chat log insert: use insert instead of upsert for BIGSERIAL id

---

## 8. 모바일 입력 영역 숨김 수정

### 문제
- 모바일 브라우저에서 채팅 입력 영역이 화면 아래로 밀려 보이지 않음

### 해결
- `css/chat.css`: `height: 100dvh` (dynamic viewport height)
- `.chat-messages`: `min-height: 0` (flex 오버플로우 해결)
- `.chat-input-area`: `flex-shrink: 0`, `padding-bottom: env(safe-area-inset-bottom)`

### 커밋
- `bc9233c` (위와 동일 커밋에 포함)

---

## 9. 시뮬레이션 - 홍길동 유저

### 작업 내용
- Supabase Auth에 `wksun999@hanmail.net` / `na5215900` / 홍길동 계정 생성
- `mcw_bots`에 `honggildong-bot` 생성 (owner: wksun999@hanmail.net)
- `mcw_personas`에 `hong-mayor` 페르소나 생성 (홍길동 시장후보, 율도국 율도시)

---

## Supabase DB 현황

| 테이블 | 데이터 |
|--------|--------|
| Auth Users | wksun999@gmail.com (Sunny), wksun999@hanmail.net (홍길동) |
| mcw_bots | sunny-official (Sunny), honggildong-bot (홍길동) |
| mcw_personas | SunnyBot 6개, hong-mayor 1개 |
| mcw_chat_logs | 신규 테이블 (BIGSERIAL id) |
| mcw_kb_items | KB 동기화 대상 |

## Git 커밋 목록 (오늘)

| # | Hash | Message |
|---|------|---------|
| 1 | `0240c3c` | Load bot list dynamically from Supabase on mypage |
| 2 | `610f7f5` | Fix 404: replace missing dashboard.css with home.css |
| 3 | `ad10338` | Hide create-bot button when user already has a bot |
| 4 | `0603e1a` | Add debug logging to login error display |
| 5 | `4970c4a` | Add init diagnostics to login page |
| 6 | `11e4dcd` | Include secrets.js and config.js in deployment |
| 7 | `ccac786` | Remove debug logging from login page |
| 8 | `ae2e7ed` | Load bot from cloud when not in localStorage |
| 9 | `878cd41` | Show persona greeting instead of selection prompt when only 1 persona |
| 10 | `bc9233c` | Add Supabase chat logging, KB cloud sync, fix mobile input |
| 11 | `0b2774d` | Fix chat log insert: use insert instead of upsert for BIGSERIAL id |

## 10. API 서버리스 함수 404 수정 + TTS 복구

### 원인 분석
1. **API 404**: `package.json`에 `"type": "module"` 설정인데 `api/*.js` 파일들이 CJS(`module.exports`) 사용 → Vercel이 ESM으로 로드 실패
2. **TTS 미작동**: API 404로 인해 TTS API 자체 호출 불가. 추가로 Vercel 환경변수 `OPENAI_API_KEY`가 구버전
3. **모바일 입력 숨김**: `html` 태그에 `height: 100%` 미설정 + `position: fixed` 미적용

### 수정 내용
| 파일 | 변경 |
|------|------|
| `api/chat.js` | `module.exports` → `export default function handler` |
| `api/tts.js` | CJS→ESM + API키 없을 때 503 반환 |
| `api/health.js` | CJS→ESM |
| `api/create-bot.js` | CJS→ESM |
| `api/stt.js` | CJS→ESM, `require` → `import` |
| `js/chat.js` | TTS fallback 순서 변경: SpeechSynthesis 우선 (모바일 안정성), Content-Type 검증 |
| `css/chat.css` | `html.chat-page` 추가, `.chat-body`에 `position: fixed` |
| `pages/bot/index.html` | `<html>` 태그에 `class="chat-page"` 추가 |
| `vercel.json` | `outputDirectory: "."` 복원 (서버리스 + 정적 공존) |

### Vercel 환경변수
- `OPENAI_API_KEY` 재설정 (production)

### 검증 결과
- `/api/health` → 200 OK
- `/api/chat` → 200, Gemini 2.5 Flash 응답
- `/api/tts` → 200, audio/mpeg 11KB 반환

### 커밋
- `2bca653` - Fix API 404, TTS fallback order, and mobile chat input
- `25708e1` - Add explicit functions config (이후 에러로 롤백)
- `2fe14e6` - Remove functions config, let Vercel auto-detect
- `6b87656` - Restore outputDirectory for Vercel static + serverless co-existence

---

## 미해결 사항

- [ ] 모바일 입력 영역 수정 결과 미확인 (유저 피드백 대기)
- [x] 모바일 TTS → OpenAI TTS-1 정상 작동 확인, SpeechSynthesis fallback 추가
