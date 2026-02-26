-- Create prompt_snapshots table
CREATE TABLE IF NOT EXISTS public.prompt_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_version_id UUID NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prompt_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies for prompt_snapshots
CREATE POLICY "Users can view their own snapshots" ON public.prompt_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots" ON public.prompt_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshots" ON public.prompt_snapshots
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots" ON public.prompt_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_snapshots_user_id ON public.prompt_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_snapshots_prompt_version_id ON public.prompt_snapshots(prompt_version_id);

-- Trigger for updated_at
CREATE TRIGGER on_prompt_snapshots_updated
  BEFORE UPDATE ON public.prompt_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
