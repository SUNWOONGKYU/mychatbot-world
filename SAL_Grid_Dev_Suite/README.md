# SAL Grid Dev Suite

**SAL Grid 3D 좌표계 개발방법론** 기반의 Claude Code 완전 패키지.
스킬 · 서브에이전트 · CPC 커맨드를 한 곳에 모아 관리한다.

---

## 구성

```
SAL_Grid_Dev_Suite/
├── skills/          # Core Skills (9개)
├── agents/          # Core Sub-Agent Package (10개)
└── commands/        # CPC 커맨드 (3개)
```

---

## skills/ — Sunny Core Skill Package (9개)

| 슬래시 커맨드 | 레이어 | 설명 |
|---|---|---|
| `/sal-grid-dev-슈퍼스킬-core` | METHODOLOGY ⭐ | SAL Grid 개발방법론 — 프로젝트 전 과정 일괄 관리 |
| `/review-evaluate-core` | 명령·통제 (C2) | 산출물 검토 + 5가지 기준 100점 품질 평가 |
| `/deploy-subagent-core` | DEPLOYMENT | Claude Code 서브에이전트 편성 + 최적 모델 선택 전략 |
| `/deploy-skill-core` | DEPLOYMENT | 스킬 조합 편성 / 커뮤니티 검색 |
| `/create-image-core` | CAPABILITY | 이미지 생성 (SVG / HTML / Mermaid / Pillow) |
| `/doc-generator-core` | CAPABILITY | 문서 생성 (PDF / DOCX / PPTX / XLSX / HWP) |
| `/youtube-generate-core` | CAPABILITY | YouTube 영상 올인원 제작 |
| `/find-skills-core` | CAPABILITY | 스킬 검색 + 설치 (skills.sh 오픈 생태계) |
| `/cpc-setup` | CPC 인프라 | CPC 1회 인프라 구축 (Supabase + Vercel + 소대 등록) |

> 설치 위치: `~/.claude/skills/{폴더명}/SKILL.md`

---

## agents/ — Sunny Core Sub-Agent Package (10개)

| 파일명 | 역할 | 모델 |
|---|---|---|
| `frontend-developer-core.md` | UI/UX 구현, 컴포넌트 개발 | Sonnet |
| `backend-developer-core.md` | API, 서버 로직, 인증 | Sonnet |
| `database-developer-core.md` | 스키마 설계, 쿼리 최적화 | Sonnet |
| `ui-designer-core.md` | 디자인 시스템, 레이아웃 | Sonnet |
| `code-reviewer-core.md` | 코드 품질 검토, 개선 제안 | Sonnet |
| `test-runner-core.md` | 테스트 실행 및 결과 보고 | Haiku |
| `debugger-core.md` | 버그 추적 및 수정 | Sonnet |
| `security-specialist-core.md` | 보안 취약점 분석 및 대응 | Sonnet |
| `documentation-writer-core.md` | 문서 작성 (README / API docs) | Haiku |
| `devops-troubleshooter-core.md` | 배포, CI/CD, 인프라 트러블슈팅 | Sonnet |

> 설치 위치: `~/.claude/agents/{파일명}.md`

---

## commands/ — CPC 커맨드 (3개)

| 커맨드 | 설명 |
|---|---|
| `cpc-engage-1.md` | 1소대장으로 CPC 접속 (매 세션 실행) |
| `cpc-engage-2.md` | 2소대장으로 CPC 접속 |
| `cpc-engage-3.md` | 3소대장으로 CPC 접속 |

> 설치 위치: `~/.claude/commands/{파일명}.md`

---

## 설치 방법

```bash
# skills 복사
cp -r skills/* ~/.claude/skills/

# agents 복사
cp agents/* ~/.claude/agents/

# commands 복사
cp commands/* ~/.claude/commands/
```

---

## 사용 권한 모델

| 대상 | 사용 가능 스킬 |
|---|---|
| 소대장 (메인 세션, Opus) | 모든 스킬 |
| 분대장 (Teammate, Sonnet) | `/deploy-subagent-core` 제외 전부 |
| 서브에이전트 (Haiku/Sonnet) | `/deploy-subagent-core` 제외 전부 |

---

## SAL Grid 개발방법론

**SAL** = **S**tage × **A**rea × **L**evel (3D 좌표계)

| Stage | 한글명 | 설명 |
|---|---|---|
| S0 | Project SAL Grid 생성 | 방법론 인프라 셋업 |
| S1 | 개발 준비 | 환경 구성, 기획 확정 |
| S2 | 개발 1차 | 핵심 기능 구현 |
| S3 | 개발 2차 | 추가 기능 구현 |
| S4 | 개발 마무리 | 안정화, 배포 |

슈퍼스킬 `/sal-grid-dev-슈퍼스킬-core` 하나로 S0~S4 전 과정을 자동 관리한다.

---

*Built with Claude Code · Opus 4.6 · 2026*
