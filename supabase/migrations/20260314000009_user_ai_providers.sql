-- Enable pgcrypto for symmetric encryption of API keys
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- User AI provider configurations (one per provider per user)
CREATE TABLE IF NOT EXISTS public.user_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('claude', 'openai', 'gemini', 'ollama')),
  encrypted_api_key TEXT,
  endpoint_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- One configuration per provider per user
  CONSTRAINT uq_user_ai_providers_user_provider UNIQUE (user_id, provider),

  -- Cloud providers require an API key; Ollama requires an endpoint URL
  CONSTRAINT chk_provider_credentials CHECK (
    CASE
      WHEN provider IN ('claude', 'openai', 'gemini') THEN encrypted_api_key IS NOT NULL
      WHEN provider = 'ollama' THEN endpoint_url IS NOT NULL
      ELSE false
    END
  )
);

-- Enable RLS
ALTER TABLE public.user_ai_providers ENABLE ROW LEVEL SECURITY;

-- Users can only read their own provider configurations
CREATE POLICY "Users can view their own AI providers" ON public.user_ai_providers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own provider configurations
CREATE POLICY "Users can insert their own AI providers" ON public.user_ai_providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own provider configurations
CREATE POLICY "Users can update their own AI providers" ON public.user_ai_providers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own provider configurations
CREATE POLICY "Users can delete their own AI providers" ON public.user_ai_providers
  FOR DELETE USING (auth.uid() = user_id);

-- Index for listing a user's providers on the profile page
CREATE INDEX IF NOT EXISTS idx_user_ai_providers_user_id
  ON public.user_ai_providers(user_id);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_user_ai_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_ai_providers_updated_at
  BEFORE UPDATE ON public.user_ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_ai_providers_updated_at();

-- ---------------------------------------------------------------------------
-- RPC wrappers for pgcrypto symmetric encryption.
-- These are called from the application via supabase.rpc() so that encryption
-- happens inside the database and plaintext keys never travel unencrypted
-- beyond the TLS connection to Supabase.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt_text(
  plaintext_value TEXT,
  passphrase_value TEXT
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
  SELECT pgp_sym_encrypt(plaintext_value, passphrase_value)::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt_text(
  ciphertext_value TEXT,
  passphrase_value TEXT
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
  SELECT pgp_sym_decrypt(ciphertext_value::BYTEA, passphrase_value);
$$;
