-- Add is_public flag to prompts for public read-only sharing
ALTER TABLE public.prompts ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Allow anyone (including anonymous users) to read prompts where is_public = true
-- Existing "Users can view their own prompts" policy still applies for owners.
-- Supabase ORs policies for the same operation.
CREATE POLICY "Public prompts are readable by anyone" ON public.prompts
  FOR SELECT USING (is_public = true);

-- Partial index for efficient lookup of public prompts
CREATE INDEX IF NOT EXISTS idx_prompts_is_public ON public.prompts(is_public)
  WHERE is_public = true;
