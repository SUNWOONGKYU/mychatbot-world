-- Create kb-files storage bucket for KB file uploads
-- Used by /api/kb/upload/route.ts and /api/kb/ocr/route.ts

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb-files',
  'kb-files',
  false,
  52428800,  -- 50MB limit
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "kb_files_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kb-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can read files in their own folder
CREATE POLICY "kb_files_read_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'kb-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Owner can delete their own files
CREATE POLICY "kb_files_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'kb-files' AND (storage.foldername(name))[1] = auth.uid()::text);
