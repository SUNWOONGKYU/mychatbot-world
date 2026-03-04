-- @task S4DB1
-- Critical 버그 수정: bot_growth 테이블 누락 컬럼 추가
-- Stage: S4 — 개발 마무리
-- Created: 2026-03-05
--
-- 배경:
--   growth.js API가 참조하는 4개 컬럼(faq_count, positive_feedback,
--   negative_feedback, avg_rating)이 bot_growth 테이블에 존재하지 않아
--   PostgREST "column does not exist" 에러 발생 (S3 PO 테스트 Critical 이슈)
--
-- 해결:
--   IF NOT EXISTS 옵션으로 안전하게 컬럼 추가 (멱등성 보장)

-- ============================================================
-- bot_growth 누락 컬럼 추가
-- ============================================================

ALTER TABLE bot_growth
  ADD COLUMN IF NOT EXISTS faq_count         INTEGER        DEFAULT 0;

ALTER TABLE bot_growth
  ADD COLUMN IF NOT EXISTS positive_feedback INTEGER        DEFAULT 0;

ALTER TABLE bot_growth
  ADD COLUMN IF NOT EXISTS negative_feedback INTEGER        DEFAULT 0;

ALTER TABLE bot_growth
  ADD COLUMN IF NOT EXISTS avg_rating        NUMERIC(3, 2)  DEFAULT 0.00;

-- 컬럼 설명
COMMENT ON COLUMN bot_growth.faq_count         IS 'FAQ 항목 수 (growth.js 참조)';
COMMENT ON COLUMN bot_growth.positive_feedback IS '긍정 피드백 누적 수';
COMMENT ON COLUMN bot_growth.negative_feedback IS '부정 피드백 누적 수';
COMMENT ON COLUMN bot_growth.avg_rating        IS '평균 평점 (0.00 ~ 5.00)';

-- 인덱스: avg_rating 정렬 조회 최적화
CREATE INDEX IF NOT EXISTS idx_bot_growth_avg_rating
  ON bot_growth(avg_rating DESC);
