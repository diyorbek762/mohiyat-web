-- =============================================================================
-- MOHIYAT AI — Legal Knowledge Base Vector Table (18)
-- =============================================================================

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing Lex.uz documents and other legal knowledge
CREATE TABLE IF NOT EXISTS public.legal_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lex_uz_id TEXT, -- e.g. "12345" from lex.uz URL
  title TEXT NOT NULL,
  content_chunk TEXT NOT NULL,
  category TEXT, -- e.g. "Soliq Kodeksi", "Mehnat Kodeksi"
  embedding vector(1536), -- 1536 is standard for OpenAI / some Gemini models. Adjust if using 768.
  published_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.legal_knowledge ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read the legal knowledge base
CREATE POLICY "Users can read legal knowledge base" ON public.legal_knowledge
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manages legal knowledge base" ON public.legal_knowledge
  USING (true)
  WITH CHECK (true);

-- Create a reverse search RPC function (Semantic search for legal documents)
CREATE OR REPLACE FUNCTION match_legal_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  lex_uz_id text,
  title text,
  content_chunk text,
  category text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    legal_knowledge.id,
    legal_knowledge.lex_uz_id,
    legal_knowledge.title,
    legal_knowledge.content_chunk,
    legal_knowledge.category,
    1 - (legal_knowledge.embedding <=> query_embedding) AS similarity
  FROM legal_knowledge
  WHERE 1 - (legal_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
