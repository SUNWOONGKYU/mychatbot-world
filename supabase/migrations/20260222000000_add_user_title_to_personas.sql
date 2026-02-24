-- mcw_personas에 user_title 컬럼 추가 (페르소나별 사용자 호칭)
ALTER TABLE mcw_personas ADD COLUMN IF NOT EXISTS user_title TEXT DEFAULT '';
