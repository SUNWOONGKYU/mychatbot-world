# S3BI1: Obsidian 지식베이스 연동

## Task 정보
- **Task ID**: S3BI1
- **Task Name**: Obsidian 지식베이스 연동
- **Stage**: S3 (개발 3차)
- **Area**: BI (Backend Infrastructure)
- **Dependencies**: S1BI1, S1D1

## Task 목표

Obsidian MD 파일을 챗봇의 지식베이스로 활용할 수 있도록 연동 기능을 구현한다.
MD 파일 업로드 → 청킹(chunking) → 임베딩(embedding) → pgvector 벡터 검색 파이프라인 구축.

## 생성/수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `api/obsidian.js` | (NEW) Obsidian MD 파일 파싱, 청킹, 임베딩, pgvector 저장 API |
| `js/home.js` | Obsidian 지식베이스 업로드/관리 UI 연동 |
