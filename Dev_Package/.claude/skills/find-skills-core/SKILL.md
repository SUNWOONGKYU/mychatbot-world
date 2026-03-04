---
description: "AI 에이전트 스킬 검색 및 설치 (skills.sh 오픈 생태계)"
user-invocable: true
---

# /find-skills — AI 에이전트 스킬 검색 및 설치

오픈 에이전트 스킬 생태계에서 필요한 스킬을 검색하고 설치한다.

## 사용 시점

- 특정 작업에 적합한 스킬이 있는지 찾고 싶을 때
- 새로운 기능을 에이전트에 추가하고 싶을 때
- 스킬 업데이트/관리가 필요할 때

## 실행 절차

### 1단계: 요구사항 파악

사용자가 원하는 것을 분석한다:
- 도메인 (React, 테스트, 배포, 문서 등)
- 구체적 작업 (PR 리뷰, 성능 최적화, 디자인 시스템 등)

### 2단계: 스킬 검색

```bash
npx skills find "검색어"
```

검색어 예시:
| 필요한 기능 | 검색어 |
|------------|--------|
| React 성능 최적화 | `react performance` |
| PR 리뷰 자동화 | `pr review` |
| 체인지로그 생성 | `changelog` |
| 프론트엔드 디자인 | `frontend design` |
| MCP 통합 | `mcp integration` |
| 데이터 분석 | `data scientist` |
| Tailwind CSS | `tailwind css` |
| 테스트 작성 | `testing jest` |

### 3단계: 결과 표시

검색 결과를 사용자에게 보여준다:
- 스킬 이름
- 설명
- 설치 명령어
- skills.sh 링크

### 4단계: 설치

사용자가 원하면 설치 실행:

```bash
# 글로벌 설치 (모든 프로젝트에서 사용)
npx skills add owner/repo@skill-name -g -y

# 프로젝트 로컬 설치
npx skills add owner/repo@skill-name -y
```

### 5단계: 관리

```bash
# 설치된 스킬 업데이트 확인
npx skills check

# 전체 업데이트
npx skills update
```

## 스킬 카테고리

| 카테고리 | 검색 키워드 |
|---------|-----------|
| 웹 개발 | react, nextjs, typescript, css, tailwind |
| 테스트 | testing, jest, playwright, e2e |
| DevOps | deploy, docker, kubernetes, ci-cd |
| 문서화 | docs, readme, changelog, api-docs |
| 코드 품질 | review, lint, refactor, best-practices |
| 디자인 | ui, ux, design-system, accessibility |
| 생산성 | workflow, automation, git |

## 참고

- 스킬 레지스트리: https://skills.sh/
- 소스: https://github.com/vercel-labs/skills
- 새 스킬 생성: `npx skills init my-skill-name`
