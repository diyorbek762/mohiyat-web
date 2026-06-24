-- 1. Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 2. Create the table for storing legal codex articles and their embeddings
create table if not exists legal_codex_vectors (
  id uuid primary key default gen_random_uuid(),
  codex_name text not null, -- e.g., 'Yangi Mehnat Kodeksi 2023'
  article_num text, -- e.g., '104-modda'
  content text not null, -- The actual text of the article
  embedding vector(768), -- Gemini text-embedding-004 outputs 768 dimensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table legal_codex_vectors enable row level security;

-- 4. Create RLS Policies
-- Anyone can read the codexes (for Semantic Search)
create policy "Allow public read access to legal vectors"
  on legal_codex_vectors for select
  using (true);

-- Only service role (admin scripts) can insert/update/delete
create policy "Allow service role full access"
  on legal_codex_vectors for all
  using (auth.role() = 'service_role');

-- 5. Create an HNSW index for super fast vector similarity search
-- Adjust 'm' and 'ef_construction' based on dataset size. Defaults are good for standard codebases.
create index on legal_codex_vectors using hnsw (embedding vector_cosine_ops);

-- 6. Create the Semantic Search RPC function
-- This function will be called from our Next.js API
create or replace function match_legal_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  codex_name text,
  article_num text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    legal_codex_vectors.id,
    legal_codex_vectors.codex_name,
    legal_codex_vectors.article_num,
    legal_codex_vectors.content,
    1 - (legal_codex_vectors.embedding <=> query_embedding) as similarity
  from legal_codex_vectors
  where 1 - (legal_codex_vectors.embedding <=> query_embedding) > match_threshold
  order by legal_codex_vectors.embedding <=> query_embedding
  limit match_count;
$$;
