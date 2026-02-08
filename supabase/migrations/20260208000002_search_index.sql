-- Add search_tokens column to prompts
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS search_tokens tsvector;

-- Index for search_tokens
CREATE INDEX IF NOT EXISTS idx_prompts_search_tokens ON public.prompts USING GIN(search_tokens);

-- Function to get latest prompt content
CREATE OR REPLACE FUNCTION public.get_latest_prompt_content(p_id UUID)
RETURNS TEXT AS $$
  SELECT content FROM public.prompt_versions
  WHERE prompt_id = p_id
  ORDER BY version_number DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Trigger function to update search_tokens
CREATE OR REPLACE FUNCTION public.update_prompt_search_tokens_trigger()
RETURNS TRIGGER AS $$
DECLARE
  p_title TEXT;
  p_description TEXT;
  p_content TEXT;
  p_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'prompts' THEN
    p_id := NEW.id;
    p_title := NEW.title;
    p_description := NEW.description;
    p_content := public.get_latest_prompt_content(p_id);
    
    NEW.search_tokens := (
      setweight(to_tsvector('english', COALESCE(p_title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(p_description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(p_content, '')), 'C')
    );
    RETURN NEW;
  ELSIF TG_TABLE_NAME = 'prompt_versions' THEN
    p_id := NEW.prompt_id;
    SELECT title, description INTO p_title, p_description FROM public.prompts WHERE id = p_id;
    p_content := NEW.content; -- Since this is AFTER INSERT, this IS the latest content
    
    UPDATE public.prompts
    SET search_tokens = (
      setweight(to_tsvector('english', COALESCE(p_title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(p_description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(p_content, '')), 'C')
    )
    WHERE id = p_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS tr_prompts_search_update ON public.prompts;
CREATE TRIGGER tr_prompts_search_update
  BEFORE INSERT OR UPDATE OF title, description ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_prompt_search_tokens_trigger();

DROP TRIGGER IF EXISTS tr_prompt_versions_search_update ON public.prompt_versions;
CREATE TRIGGER tr_prompt_versions_search_update
  AFTER INSERT ON public.prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_prompt_search_tokens_trigger();

-- Search RPC Function
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
  rank REAL
) AS $$
DECLARE
  search_query tsquery;
BEGIN
  -- Create a search query that supports prefix matching
  -- We take the plain query, and append :* to each word for partial matching
  -- This is a common pattern for search-as-you-type
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
    ts_rank(p.search_tokens, search_query) as rank
  FROM public.prompts p
  WHERE p.search_tokens @@ search_query
  AND (filter_user_id IS NULL OR p.user_id = filter_user_id)
  -- Collection filter placeholder (schema dependency not yet present)
  -- AND (filter_collection_id IS NULL OR p.collection_id = filter_collection_id)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql STABLE;
