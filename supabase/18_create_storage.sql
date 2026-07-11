-- Add document_path to scan_sessions
ALTER TABLE public.scan_sessions ADD COLUMN IF NOT EXISTS document_path TEXT;

-- Insert 'documents' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Policies for documents bucket
-- Policy to allow authenticated users to upload to documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'documents' AND auth.uid() = owner );

-- Policy to allow authenticated users to read their own documents
CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT TO authenticated
USING ( bucket_id = 'documents' AND auth.uid() = owner );

-- Allow service role full access (for cron jobs / API routes)
CREATE POLICY "Service role full access to documents"
ON storage.objects FOR ALL
USING ( bucket_id = 'documents' );
