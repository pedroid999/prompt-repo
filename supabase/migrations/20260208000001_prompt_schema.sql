-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create prompt_versions table
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  content TEXT NOT NULL,
  version_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Prompts Policies
CREATE POLICY "Users can view their own prompts" ON public.prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" ON public.prompts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = user_id);

-- Prompt Versions Policies
CREATE POLICY "Users can view versions of their own prompts" ON public.prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE public.prompts.id = public.prompt_versions.prompt_id
      AND public.prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions for their own prompts" ON public.prompt_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE public.prompts.id = public.prompt_versions.prompt_id
      AND public.prompts.user_id = auth.uid()
    )
  );

-- Note: No UPDATE or DELETE policies for prompt_versions as history is immutable.

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);

-- Enforce unique version numbers per prompt
ALTER TABLE public.prompt_versions ADD CONSTRAINT unique_prompt_version UNIQUE (prompt_id, version_number);

-- Trigger for updated_at on prompts
CREATE TRIGGER on_prompts_updated
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
