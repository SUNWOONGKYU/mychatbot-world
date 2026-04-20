-- 위저드 Step 6(아바타) / Step 7(테마)에서 저장하는 컬럼 추가
-- 기존 mcw_bots에 avatar_url, theme_mode, theme_color 추가

ALTER TABLE mcw_bots
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS theme_mode  TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'purple';

-- 봇 아바타 이미지 전용 Storage 버킷 (공개 — /bot/{username} 페이지에서 직접 표시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bot-avatars', 'bot-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS 정책 (재실행 안전: 기존 정책 DROP 후 재생성)
DROP POLICY IF EXISTS "bot_avatars_read"   ON storage.objects;
DROP POLICY IF EXISTS "bot_avatars_write"  ON storage.objects;
DROP POLICY IF EXISTS "bot_avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "bot_avatars_delete" ON storage.objects;

-- 읽기: 모두 허용
CREATE POLICY "bot_avatars_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'bot-avatars');

-- 쓰기: 인증 사용자 또는 service-role
CREATE POLICY "bot_avatars_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bot-avatars');

CREATE POLICY "bot_avatars_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'bot-avatars');

CREATE POLICY "bot_avatars_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'bot-avatars');
