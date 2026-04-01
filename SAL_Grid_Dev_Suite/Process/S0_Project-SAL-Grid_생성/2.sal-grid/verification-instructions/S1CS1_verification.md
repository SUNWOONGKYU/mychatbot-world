# Verification Instruction - S1CS1

---

## 📌 필수 참조 규칙 파일

> **⚠️ 검증 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/04_grid-writing-json.md` | Grid 속성 검증 | 결과 기록 시 |
| `.claude/rules/05_execution-process.md` | 검증 프로세스 | 검증 수행 순서 |
| `.claude/rules/06_verification.md` | 검증 기준 | **핵심 참조** |

---

## Task ID
S1CS1

## Task Name
직종별 템플릿 10개 (소급)

## Verification Checklist

### 1. 파일 존재 검증
- [ ] `templates/template-customer-service.json` 존재
- [ ] `templates/template-sales-assistant.json` 존재
- [ ] `templates/template-hr-recruiter.json` 존재
- [ ] `templates/template-education-tutor.json` 존재
- [ ] `templates/template-tech-support.json` 존재
- [ ] `templates/template-legal-advisor.json` 존재
- [ ] `templates/template-medical-info.json` 존재
- [ ] `templates/template-real-estate.json` 존재
- [ ] `templates/template-restaurant.json` 존재
- [ ] `templates/template-ecommerce.json` 존재
- [ ] `templates/index.json` 존재

### 2. JSON 유효성 검증
- [ ] 10개 파일 모두 유효한 JSON 형식
- [ ] `index.json` 유효한 JSON 형식
- [ ] `index.json`의 `total` 필드가 10

### 3. 필수 필드 검증 (각 템플릿)
- [ ] `id` 필드 존재 (kebab-case)
- [ ] `name` 필드 존재 (한글명)
- [ ] `description` 필드 존재
- [ ] `category` 필드 존재
- [ ] `system_prompt` 필드 존재 및 비어있지 않음
- [ ] `default_settings` 필드 존재 (객체)
- [ ] `default_settings.tone` 필드 존재

### 4. 카테고리 다양성 검증
- [ ] `customer_service` 카테고리 존재
- [ ] `sales` 카테고리 존재
- [ ] `hr` 카테고리 존재
- [ ] `education` 카테고리 존재
- [ ] `tech_support` 카테고리 존재
- [ ] 각 템플릿의 카테고리가 서로 다름 (중복 없음)

### 5. 콘텐츠 품질 검증
- [ ] `system_prompt`가 해당 직종에 맞는 내용 포함
- [ ] `system_prompt`에 커스터마이즈 플레이스홀더 (`[회사명]` 등) 포함
- [ ] 각 템플릿이 서로 다른 내용으로 구성됨 (복사/붙여넣기 금지)
- [ ] `sample_questions` 필드가 있으면 최소 3개 이상 포함

### 6. Supabase 데이터 검증
- [ ] `bot_templates` 테이블에 10개 이상 레코드 존재
- [ ] `is_featured: true` 템플릿 최소 3개 이상
- [ ] 각 레코드의 `category` 필드가 JSON 파일과 일치

### 7. 통합 검증
- [ ] S1DB1의 `bot_templates` 테이블 구조와 JSON 필드 일치
- [ ] `index.json`의 `templates` 배열이 실제 파일 10개와 일치

### 8. 저장 위치 검증
- [ ] `Process/S1_개발_준비/Content_System/`에 템플릿 문서 저장됨
- [ ] `templates/` 폴더가 프로젝트 루트에 존재

## Test Commands
```bash
# 파일 개수 확인
ls templates/*.json | wc -l
# → 11 (10개 템플릿 + 1개 index.json)

# JSON 유효성 일괄 확인
for f in templates/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8')); console.log('PASS: $f')" \
  || echo "FAIL: $f"
done

# index.json total 확인
node -e "const d = JSON.parse(require('fs').readFileSync('templates/index.json', 'utf8')); console.log('total:', d.total)"

# system_prompt 비어있지 않음 확인
for f in templates/template-*.json; do
  node -e "
    const d = JSON.parse(require('fs').readFileSync('$f', 'utf8'));
    console.log(d.system_prompt?.length > 10 ? 'PASS' : 'FAIL', '$f');
  "
done

# Supabase 데이터 확인 (REST API)
# curl -X GET 'https://[project-ref].supabase.co/rest/v1/bot_templates?select=count' \
#   -H 'apikey: [anon-key]'
```

## Expected Results
- `ls templates/*.json | wc -l` → 11
- 모든 JSON 파일 파싱 성공 (PASS)
- `index.json total: 10`
- 각 `system_prompt` 길이 > 10
- `bot_templates` 테이블 레코드 10개 이상

## Verification Agent
qa-specialist

## Pass Criteria
- [ ] 모든 체크리스트 항목 통과
- [ ] 10개 JSON 파일 유효성 확인
- [ ] 각 템플릿 필수 필드 존재
- [ ] Supabase 데이터 확인
- [ ] Blocker 없음
