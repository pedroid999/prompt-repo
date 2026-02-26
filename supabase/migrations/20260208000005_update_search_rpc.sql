-- Function to get latest prompt version ID
CREATE OR REPLACE FUNCTION public.get_latest_prompt_version_id(p_id UUID)
RETURNS UUID AS $$
  SELECT id FROM public.prompt_versions
  WHERE prompt_id = p_id
  ORDER BY version_number DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Drop existing function first because we are changing the return table signature
DROP FUNCTION IF EXISTS public.search_prompts(TEXT, UUID, UUID);

-- Update Search RPC Function to include latest_version_id
CREATE OR REPLACE FUNCTION public.search_prompts(
  query_text TEXT,
  filter_user_id UUID DEFAULT NULL,
  filter_collection_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  latest_content TEXT,
  latest_version_id UUID,
  rank REAL
) AS $$
DECLARE
  search_query tsquery;
BEGIN
  -- Handle empty or whitespace only query
  IF query_text IS NULL OR trim(query_text) = '' THEN
    RETURN;
  END IF;

  -- Create a search query that supports prefix matching
  SELECT string_agg(lexeme || ':*', ' & ')::tsquery INTO search_query
  FROM unnest(to_tsvector('english', query_text));

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.title,
    p.description,
    p.created_at,
    p.updated_at,
    public.get_latest_prompt_content(p.id) as latest_content,
    public.get_latest_prompt_version_id(p.id) as latest_version_id,
    ts_rank(p.search_tokens, search_query) as rank
  FROM public.prompts p
  WHERE p.search_tokens @@ search_query
  AND (filter_user_id IS NULL OR p.user_id = filter_user_id)
  AND (filter_collection_id IS NULL OR EXISTS (
    SELECT 1 FROM collection_prompts cp 
    WHERE cp.prompt_id = p.id AND cp.collection_id = filter_collection_id
  ))
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql STABLE;
