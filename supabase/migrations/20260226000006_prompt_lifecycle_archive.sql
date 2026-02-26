-- Prompt lifecycle: soft archive support + archive-aware search

ALTER TABLE public.prompts
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_prompts_user_archived_at
  ON public.prompts(user_id, archived_at);

-- Replace search RPC to support archived filtering
DROP FUNCTION IF EXISTS public.search_prompts(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.search_prompts(TEXT, UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.search_prompts(
  query_text TEXT,
  filter_user_id UUID DEFAULT NULL,
  filter_collection_id UUID DEFAULT NULL,
  filter_archived BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  latest_content TEXT,
  latest_version_id UUID,
  rank REAL
) AS $$
DECLARE
  search_query tsquery;
BEGIN
  IF query_text IS NULL OR trim(query_text) = '' THEN
    RETURN;
  END IF;

  SELECT string_agg(lexeme || ':*', ' & ')::tsquery INTO search_query
  FROM unnest(to_tsvector('english', query_text));

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.title,
    p.description,
    p.archived_at,
    p.created_at,
    p.updated_at,
    public.get_latest_prompt_content(p.id) AS latest_content,
    public.get_latest_prompt_version_id(p.id) AS latest_version_id,
    ts_rank(p.search_tokens, search_query) AS rank
  FROM public.prompts p
  WHERE p.search_tokens @@ search_query
    AND (filter_user_id IS NULL OR p.user_id = filter_user_id)
    AND (filter_collection_id IS NULL OR EXISTS (
      SELECT 1 FROM collection_prompts cp
      WHERE cp.prompt_id = p.id AND cp.collection_id = filter_collection_id
    ))
    AND (
      (filter_archived IS TRUE AND p.archived_at IS NOT NULL)
      OR (filter_archived IS FALSE AND p.archived_at IS NULL)
    )
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql STABLE;
