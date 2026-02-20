-- kb-files 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb-files',
  'kb-files',
  true,
  52428800,  -- 50MB
  ARRAY['application/pdf','text/plain','text/csv','application/json','image/png','image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS 정책 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kb_files_select' AND tablename = 'objects') THEN
    EXECUTE 'CREATE POLICY kb_files_select ON storage.objects FOR SELECT USING (bucket_id = ''kb-files'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kb_files_insert' AND tablename = 'objects') THEN
    EXECUTE 'CREATE POLICY kb_files_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''kb-files'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kb_files_update' AND tablename = 'objects') THEN
    EXECUTE 'CREATE POLICY kb_files_update ON storage.objects FOR UPDATE USING (bucket_id = ''kb-files'')';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kb_files_delete' AND tablename = 'objects') THEN
    EXECUTE 'CREATE POLICY kb_files_delete ON storage.objects FOR DELETE USING (bucket_id = ''kb-files'')';
  END IF;
END $$;
