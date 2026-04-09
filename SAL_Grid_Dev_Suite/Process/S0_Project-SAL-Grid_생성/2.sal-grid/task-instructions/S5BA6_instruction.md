# S5BA6: OCR 파이프라인 통합 — 스캔 PDF/이미지 → 텍스트 추출 → Wiki Ingest

## Task 정보
- **Task ID**: S5BA6
- **Task Name**: OCR 파이프라인 통합 — 스캔 PDF/이미지 → 텍스트 추출 → Wiki Ingest
- **Stage**: S5 (Wiki-e-RAG 적용)
- **Area**: BA
- **Dependencies**: ['S5BA1']
- **Agent**: backend-developer-core

## Task 목표
OCR 파이프라인 통합 — 스캔 PDF/이미지 → 텍스트 추출 → Wiki Ingest 구현

## 생성/수정 파일
app/api/kb/ocr/route.ts, lib/ocr-client.ts, supabase/migrations/20260406_kb_ocr_columns.sql
