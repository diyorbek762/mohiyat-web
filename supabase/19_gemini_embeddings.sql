-- =============================================================================
-- MOHIYAT AI — Switch to Gemini Embeddings (768 dimensions) (19)
-- =============================================================================

-- 1. Alter the existing column to support 768 dimensions instead of 1536
ALTER TABLE public.legal_knowledge 
  ALTER COLUMN embedding TYPE vector(768);

-- 2. Drop the old search function
DROP FUNCTION IF EXISTS match_legal_knowledge(vector(1536), float, int);

-- 3. Recreate the search function with 768 dimensions
CREATE OR REPLACE FUNCTION match_legal_knowledge (
  query_embedding vector(768),
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
