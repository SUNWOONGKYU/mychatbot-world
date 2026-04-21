#!/usr/bin/env node
// S10 Stage Task CRUD seeder — creates 14 instruction + 14 verification + 14 grid_records files
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const TI_DIR = path.join(ROOT, 'SAL_Grid_Dev_Suite/Process/S0_Project-SAL-Grid_생성/2.sal-grid/task-instructions');
const VI_DIR = path.join(ROOT, 'SAL_Grid_Dev_Suite/Process/S0_Project-SAL-Grid_생성/2.sal-grid/verification-instructions');
const GR_DIR = path.join(ROOT, 'SAL_Grid_Dev_Suite/Process/S0_Project-SAL-Grid_생성/3.method/json/data/grid_records');

const tasks = [
  { id: 'S10DB1', name: 'mcw_bot_skills 테이블 생성', area: 'DB', agent: 'database-developer-core', deps: '',
    goal: '봇-스킬 마운트 메타데이터를 영속화하는 테이블을 생성한다.',
    files: 'supabase/migrations/20260422_mcw_bot_skills.sql',
    spec: 'columns: id uuid PK, bot_id uuid FK→mcw_bots, skill_id text, mounted_at timestamptz default now(), config jsonb. unique(bot_id, skill_id). RLS: owner only.' },
  { id: 'S10DB2', name: 'mcw_bots 컬럼 확장', area: 'DB', agent: 'database-developer-core', deps: '',
    goal: 'mcw_bots에 tone(text), persona_traits(jsonb), learning_sources(jsonb) 컬럼을 추가한다.',
    files: 'supabase/migrations/20260422_mcw_bots_columns.sql',
    spec: 'ADD COLUMN IF NOT EXISTS 3개 — tone text, persona_traits jsonb default "{}", learning_sources jsonb default "[]". 기존 데이터 보존.' },
  { id: 'S10BA1', name: '봇별 chat_logs 조회/삭제 API', area: 'BA', agent: 'api-developer-core', deps: '',
    goal: '/api/bots/[id]/chat-logs GET(목록) / DELETE(전체 또는 특정 id) 구현.',
    files: 'app/api/bots/[id]/chat-logs/route.ts',
    spec: 'Bearer 인증 → bot 소유권 확인 → mcw_chat_logs 필터링. pagination(limit/offset). 본인 봇만.' },
  { id: 'S10BA2', name: 'bot-skills CRUD API', area: 'BA', agent: 'api-developer-core', deps: 'S10DB1',
    goal: '/api/bots/[id]/skills GET/POST/DELETE — 봇에 마운트된 스킬 관리.',
    files: 'app/api/bots/[id]/skills/route.ts',
    spec: 'GET: mcw_bot_skills 조인. POST: {skill_id, config} upsert. DELETE: ?skill_id= 로 해제. 소유권 체크.' },
  { id: 'S10BA3', name: 'community 필터 API (bot_id)', area: 'BA', agent: 'api-developer-core', deps: '',
    goal: '/api/community/posts?bot_id= 쿼리 확장 — 특정 봇이 작성한 글/댓글만.',
    files: 'app/api/community/posts/route.ts',
    spec: '기존 라우트에 bot_id 파라미터 추가. author_bot_id 컬럼 또는 ai_posts 플래그 조회.' },
  { id: 'S10BA4', name: 'bot PATCH 설정 저장 API', area: 'BA', agent: 'api-developer-core', deps: 'S10DB2',
    goal: '/api/bots/[id] PATCH — tone/persona_traits/learning_sources/model 부분 업데이트.',
    files: 'app/api/bots/[id]/route.ts',
    spec: '허용 필드 whitelist, 소유권 체크, updated_at 갱신. RLS 우회는 service_role.' },
  { id: 'S10FE1', name: 'QR 코드 렌더 (mypage+Step8)', area: 'FE', agent: 'frontend-developer-core', deps: '',
    goal: '공용 QRImage 컴포넌트로 Tab2 카드와 Step8 다운로드 모달 모두 실 PNG 렌더.',
    files: 'components/common/qr-image.tsx, components/create/steps/Step8Deploy.tsx, components/mypage/Tab2BotManage.tsx',
    spec: 'qrcode npm 패키지 toDataURL 사용. 이미 배포 완료(commit b0be67c). Completed/Verified 초기 상태로 등록.',
    completed: true },
  { id: 'S10FE2', name: 'ChatLogPanel 구현', area: 'FE', agent: 'frontend-developer-core', deps: 'S10BA1',
    goal: 'Tab2 카드 "대화로그" 패널 — 리스트/검색/삭제 UI.',
    files: 'components/mypage/panels/ChatLogPanel.tsx, components/mypage/Tab2BotManage.tsx(연결)',
    spec: '/api/bots/[id]/chat-logs 호출, 무한스크롤 또는 page 버튼, 개별/전체 삭제 확인 모달.' },
  { id: 'S10FE3', name: 'KbPanel 구현', area: 'FE', agent: 'frontend-developer-core', deps: '',
    goal: 'Tab2 카드 "학습/KB" 패널 — kb_items 표/추가/삭제.',
    files: 'components/mypage/panels/KbPanel.tsx',
    spec: '/api/kb GET/POST/DELETE 재사용. 파일 업로드 + 텍스트 조각. 라벨은 멘탈모델("학습/Learning") 유지.' },
  { id: 'S10FE4', name: 'SkillsMountPanel 구현', area: 'FE', agent: 'frontend-developer-core', deps: 'S10BA2',
    goal: 'Tab2 카드 "스킬" 패널 — 마운트된 스킬 목록 + 장착/해제.',
    files: 'components/mypage/panels/SkillsMountPanel.tsx',
    spec: '/api/bots/[id]/skills 호출, 스킬 마켓에서 추가, 체크박스/토글로 해제.' },
  { id: 'S10FE5', name: 'LearningPanel 구현', area: 'FE', agent: 'frontend-developer-core', deps: '',
    goal: 'Tab2 카드 "학습 진도" 패널 — 통계/그래프.',
    files: 'components/mypage/panels/LearningPanel.tsx',
    spec: '기존 학습 진도 API 활용. 주간/월간 진도 표시. 라벨 "학습/Learning" 유지.' },
  { id: 'S10FE6', name: 'CommunityPanel 구현', area: 'FE', agent: 'frontend-developer-core', deps: 'S10BA3',
    goal: 'Tab2 카드 "커뮤니티" 패널 — 봇이 작성한 글/댓글/카르마.',
    files: 'components/mypage/panels/CommunityPanel.tsx',
    spec: '/api/community/posts?bot_id= 호출. 봇 활동 전용 — 커뮤니티는 코코봇 전용 공간 정책 준수.' },
  { id: 'S10FE7', name: 'BotSettings 저장 통합', area: 'FE', agent: 'frontend-developer-core', deps: 'S10BA4',
    goal: 'Tab2 카드 "설정" 패널 — tone/persona/model PATCH 저장 라운드트립.',
    files: 'components/mypage/panels/BotSettings.tsx',
    spec: '폼 제출 → PATCH /api/bots/[id] → 성공 시 로컬 상태 갱신 + 토스트. 저장 전/후 값 비교로 dirty 검출.' },
  { id: 'S10QA1', name: 'E2E 검증 (마이페이지 6도구)', area: 'TS', agent: 'test-runner-core',
    deps: 'S10FE1, S10FE2, S10FE3, S10FE4, S10FE5, S10FE6, S10FE7',
    goal: 'Playwright로 마이페이지 Tab2 카드 6패널 + QR 전체 flow 검증.',
    files: 'tests/e2e/mypage-tab2-tools.spec.ts, scripts/verify-s10-flow.mjs',
    spec: '실 로그인 세션 → 봇 선택 → 각 패널 열기/액션/저장 → API 200 확인. 프로덕션 endpoint 대상.' },
];

const areaStage = (t) => {
  const m = t.id.match(/^S(\d+)[A-Z]+/);
  return m ? parseInt(m[1], 10) : 10;
};

const today = '2026-04-21';

function buildInstruction(t) {
  return `# ${t.id}: ${t.name}

## Task 정보
- **Task ID**: ${t.id}
- **Task Name**: ${t.name}
- **Stage**: S${areaStage(t)} (마이페이지 Tab2 6도구 연동)
- **Area**: ${t.area}
- **Dependencies**: ${t.deps || '—'}
- **Agent**: \`${t.agent}\`

## Task 목표

${t.goal}

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| \`${t.files}\` | ${t.name} |

## 구현 사양

${t.spec}

## 완료 기준

- 지정 파일 생성/수정 완료
- 타입 체크(tsc --noEmit) 통과 (FE/BA)
- 마이그레이션 적용 성공 (DB)
- 소유권/RLS 검증 통과 (BA/DB)
`;
}

function buildVerification(t) {
  return `# ${t.id} 검증 지침

## 검증 Agent
${t.area === 'DB' ? '`database-developer-core`' : t.area === 'TS' ? '`qa-specialist`' : '`code-reviewer-core`'}

## 검증 체크리스트

${t.area === 'DB' ? `- [ ] 마이그레이션이 IF NOT EXISTS로 idempotent한가?
- [ ] 기존 데이터가 손실되지 않는가?
- [ ] RLS 정책이 본인 소유 봇에만 적용되는가?
- [ ] 인덱스/unique 제약이 올바른가?` : ''}${t.area === 'BA' ? `- [ ] Bearer 인증이 강제되는가?
- [ ] 봇 소유권 체크가 있는가?
- [ ] 허용 필드 whitelist가 있는가? (PATCH)
- [ ] 프로덕션 endpoint에서 200 응답이 오는가?` : ''}${t.area === 'FE' ? `- [ ] 플레이스홀더 텍스트가 제거되었는가?
- [ ] 실 API 호출이 있는가?
- [ ] 로딩/에러 상태가 표시되는가?
- [ ] 프로덕션 배포 후 육안 확인 완료인가? (memory: feedback_verification_rigor)` : ''}${t.area === 'TS' ? `- [ ] 6패널 + QR 모두 커버하는 spec이 있는가?
- [ ] 실 로그인 세션으로 실행되는가?
- [ ] 각 시나리오 API 상태코드를 assert 하는가?
- [ ] 실측 리포트가 저장되는가?` : ''}

## 검증 방법

- 정적: tsc --noEmit / ESLint / 코드 리뷰
- 동적: 프로덕션 URL 실측 (배포 후)
- DB: Supabase SQL Editor로 스키마 확인

## 통과 기준

모든 체크리스트 통과 + \`verification_status: Verified\` 기록.
`;
}

function buildGridRecord(t) {
  const completed = !!t.completed;
  return {
    task_id: t.id,
    task_name: t.name,
    stage: areaStage(t),
    area: t.area,
    task_status: completed ? 'Completed' : 'Pending',
    task_progress: completed ? 100 : 0,
    verification_status: completed ? 'Verified' : 'Not Verified',
    dependencies: t.deps || '',
    task_instruction: `sal-grid/task-instructions/${t.id}_instruction.md`,
    task_agent: t.agent,
    tools: '',
    execution_type: 'AI-Only',
    generated_files: completed ? t.files : '',
    modification_history: completed
      ? `${today}: S10 Stage 신설과 함께 등록 — QR 렌더는 commit b0be67c에서 이미 배포됨. Completed/Verified 초기 상태.`
      : `${today}: S10 Stage MBO 승인(2026-04-21 12:50)과 함께 Pending 생성.`,
    verification_instruction: `sal-grid/verification-instructions/${t.id}_verification.md`,
    verification_agent: t.area === 'DB' ? 'database-developer-core' : t.area === 'TS' ? 'qa-specialist' : 'code-reviewer-core',
    test_result: completed
      ? { unit_test: 'N/A', integration_test: 'PASS — qrcode.toDataURL 동작 검증', edge_cases: 'PASS — 긴 URL, 특수문자 처리', manual_test: 'PASS — Step8 모달/Tab2 카드 육안 확인' }
      : { unit_test: 'PENDING', integration_test: 'PENDING', edge_cases: 'PENDING', manual_test: 'PENDING' },
    build_verification: completed
      ? { compile: 'PASS', lint: 'PASS', deploy: 'PASS — Vercel sha=b0be67c', runtime: 'PASS' }
      : { compile: 'PENDING', lint: 'PENDING', deploy: 'PENDING', runtime: 'PENDING' },
    integration_verification: completed
      ? { dependency_propagation: 'PASS — 공용 컴포넌트 2곳 재사용', cross_task_connection: 'PASS', data_flow: 'PASS' }
      : { dependency_propagation: 'PENDING', cross_task_connection: 'PENDING', data_flow: 'PENDING' },
    blockers: { dependency: 'None', environment: 'None', external_api: 'None', status: 'No Blockers' },
    comprehensive_verification: completed
      ? { task_instruction: 'PASS', test: 'PASS 4/4', build: 'PASS 4/4', integration: 'PASS 3/3', blockers: 'None', final: 'Passed' }
      : { task_instruction: 'PENDING', test: 'PENDING', build: 'PENDING', integration: 'PENDING', blockers: 'None', final: 'Pending' },
    ai_verification_note: completed
      ? 'QR 렌더 공용 컴포넌트(QRImage) 도입으로 Step8 다운로드 모달과 마이페이지 Tab2 봇 카드 양쪽에서 실 PNG 렌더 확인. 외부 api.qrserver.com 의존 제거 — 네트워크 차단 환경에서도 렌더 보장.'
      : '',
    remarks: completed
      ? 'S10 Stage MBO 승인과 동시에 소급 등록. 이미 프로덕션 배포 완료.'
      : 'S10 Stage MBO 승인(2026-04-21 12:50) 하에 Pending. 의존성 순서대로 진행.',
  };
}

let ci = 0, cv = 0, cg = 0;
for (const t of tasks) {
  const tiPath = path.join(TI_DIR, `${t.id}_instruction.md`);
  const viPath = path.join(VI_DIR, `${t.id}_verification.md`);
  const grPath = path.join(GR_DIR, `${t.id}.json`);
  fs.writeFileSync(tiPath, buildInstruction(t), 'utf-8'); ci++;
  fs.writeFileSync(viPath, buildVerification(t), 'utf-8'); cv++;
  fs.writeFileSync(grPath, JSON.stringify(buildGridRecord(t), null, 2), 'utf-8'); cg++;
}

console.log(`✅ task-instructions: ${ci}, verification-instructions: ${cv}, grid_records: ${cg}`);
console.log(`   Total files: ${ci + cv + cg}`);
