-- Create user_api_keys table for MCP bearer-token authentication
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  key_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can read their own keys (hashed — plaintext is never stored)
CREATE POLICY "Users can view their own API keys" ON public.user_api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own keys
CREATE POLICY "Users can insert their own API keys" ON public.user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can revoke (soft-delete via revoked_at) their own keys
CREATE POLICY "Users can update their own API keys" ON public.user_api_keys
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can hard-delete their own keys
CREATE POLICY "Users can delete their own API keys" ON public.user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast key-hash lookups (used on every MCP request)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_api_keys_key_hash
  ON public.user_api_keys(key_hash);

-- Index for listing a user's keys on the profile page
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id
  ON public.user_api_keys(user_id);
