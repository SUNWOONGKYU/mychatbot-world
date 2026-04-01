# Task Instruction - S1CS1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

---

## Task ID
S1CS1

## Task Name
직종별 템플릿 10개 (소급)

## Task Goal
챗봇 생성 시 사용할 수 있는 직종별 템플릿 10개가 JSON 파일로 정의된 상태를 문서화한다. 이 Task는 이미 구현 완료되어 소급 등록된 항목이다. 각 템플릿의 내용을 확인하고 `bot_templates` 테이블에 반영된 상태를 검증한다.

## Prerequisites (Dependencies)
- S1DB1 (기본 DB 스키마 — `bot_templates` 테이블) — 소급 완료된 상태

## Specific Instructions

### 1. 기존 구현 내용 확인 (소급)
아래 파일들이 실제로 존재하는지 확인한다:

```
templates/
  template-customer-service.json   ← 고객 서비스
  template-sales-assistant.json    ← 영업 어시스턴트
  template-hr-recruiter.json       ← HR/채용 담당자
  template-education-tutor.json    ← 교육 튜터
  template-tech-support.json       ← 기술 지원
  template-legal-advisor.json      ← 법률 어드바이저
  template-medical-info.json       ← 의료 정보
  template-real-estate.json        ← 부동산 안내
  template-restaurant.json         ← 레스토랑/F&B
  template-ecommerce.json          ← 이커머스 지원
```

### 2. 템플릿 JSON 구조

각 템플릿은 아래 구조를 따른다:

```json
{
  "id": "template-customer-service",
  "name": "고객 서비스 봇",
  "description": "고객 문의를 친절하게 처리하고 문제를 해결하는 챗봇",
  "category": "customer_service",
  "icon": "🎧",
  "is_featured": true,
  "system_prompt": "당신은 [회사명]의 고객 서비스 담당자입니다...",
  "default_settings": {
    "tone": "friendly",
    "language": "ko",
    "max_tokens": 500,
    "temperature": 0.7
  },
  "sample_questions": [
    "환불은 어떻게 하나요?",
    "배송 기간은 얼마나 걸리나요?",
    "주문을 취소하고 싶어요"
  ],
  "tags": ["고객서비스", "CS", "문의처리"]
}
```

### 3. 10개 템플릿 카테고리 정의

| 번호 | 파일명 | 카테고리 | 한글명 |
|------|--------|----------|--------|
| 1 | `template-customer-service.json` | customer_service | 고객 서비스 |
| 2 | `template-sales-assistant.json` | sales | 영업 어시스턴트 |
| 3 | `template-hr-recruiter.json` | hr | HR/채용 |
| 4 | `template-education-tutor.json` | education | 교육 튜터 |
| 5 | `template-tech-support.json` | tech_support | 기술 지원 |
| 6 | `template-legal-advisor.json` | legal | 법률 어드바이저 |
| 7 | `template-medical-info.json` | medical | 의료 정보 |
| 8 | `template-real-estate.json` | real_estate | 부동산 안내 |
| 9 | `template-restaurant.json` | food_beverage | 레스토랑/F&B |
| 10 | `template-ecommerce.json` | ecommerce | 이커머스 지원 |

### 4. templates/index.json (목록 파일)

```json
{
  "version": "1.0.0",
  "total": 10,
  "templates": [
    {
      "id": "template-customer-service",
      "name": "고객 서비스 봇",
      "category": "customer_service",
      "is_featured": true
    }
  ]
}
```

### 5. Supabase bot_templates 테이블 INSERT
템플릿 JSON 데이터를 `bot_templates` 테이블에 삽입하는 SQL:

```sql
-- @task S1CS1
INSERT INTO bot_templates (name, description, category, system_prompt, default_settings, is_featured)
VALUES
  ('고객 서비스 봇', '고객 문의를 친절하게 처리', 'customer_service', '당신은 ...', '{"tone":"friendly"}', true),
  ('영업 어시스턴트', '제품/서비스 안내 및 영업 지원', 'sales', '당신은 ...', '{"tone":"professional"}', true),
  -- ... 나머지 8개
```

## Expected Output Files
- `templates/template-customer-service.json`
- `templates/template-sales-assistant.json`
- `templates/template-hr-recruiter.json`
- `templates/template-education-tutor.json`
- `templates/template-tech-support.json`
- `templates/template-legal-advisor.json`
- `templates/template-medical-info.json`
- `templates/template-real-estate.json`
- `templates/template-restaurant.json`
- `templates/template-ecommerce.json`
- `templates/index.json`

## Completion Criteria
- [ ] `templates/` 폴더에 JSON 파일 10개 존재
- [ ] `templates/index.json` 존재 및 10개 템플릿 목록 포함
- [ ] 각 JSON 파일이 유효한 JSON 형식
- [ ] 각 템플릿에 `name`, `category`, `system_prompt`, `default_settings` 필드 존재
- [ ] `bot_templates` Supabase 테이블에 10개 레코드 존재

## Tech Stack
- JSON
- Supabase (bot_templates 테이블)
- SQL

## Tools
- Supabase Dashboard (INSERT SQL)

## Execution Type
AI-Only (JSON 파일 작성) + Human-AI (Supabase INSERT는 PO 수행)

## Remarks
- 이 Task는 소급(Retroactive) 등록 항목 — 이미 구현 완료
- 템플릿 JSON 파일은 Git으로 버전 관리
- `system_prompt`는 [회사명], [제품명] 등의 플레이스홀더 포함
- S2FE 템플릿 선택 UI에서 이 데이터를 사용

---

## ⚠️ 작업 결과물 저장 2대 규칙

### 제1 규칙: Stage + Area 폴더에 저장
- S1CS1 → `Process/S1_개발_준비/Content_System/`

### 제2 규칙: Production 코드는 이중 저장
- CS Area는 Production 저장 대상 아님
- 템플릿 JSON은 `templates/` 폴더에만 존재 (배포 불필요, DB에 저장)
