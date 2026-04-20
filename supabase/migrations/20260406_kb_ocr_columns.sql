-- S5BA6: mcw_kb_items OCR 컬럼 추가
ALTER TABLE mcw_kb_items
  ADD COLUMN IF NOT EXISTS is_ocr_processed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ocr_engine TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence FLOAT,
  ADD COLUMN IF NOT EXISTS ocr_page_count INT DEFAULT 0;
