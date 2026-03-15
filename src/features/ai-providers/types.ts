// ---------------------------------------------------------------------------
// AI Providers domain types
// ---------------------------------------------------------------------------

/** Supported AI provider identifiers. */
export type ProviderName = 'claude' | 'openai' | 'gemini' | 'ollama';

/** All supported provider names as a readonly array (useful for iteration). */
export const PROVIDER_NAMES: readonly ProviderName[] = [
  'claude',
  'openai',
  'gemini',
  'ollama',
] as const;

/** Cloud providers that require an API key. */
export const CLOUD_PROVIDERS: readonly ProviderName[] = [
  'claude',
  'openai',
  'gemini',
] as const;

/** Row shape from the `user_ai_providers` table. */
export interface UserAiProvider {
  id: string;
  user_id: string;
  provider: ProviderName;
  /** pgcrypto-encrypted API key — only present server-side. */
  encrypted_api_key: string | null;
  /** Endpoint URL for self-hosted providers (e.g. Ollama). */
  endpoint_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Client-safe representation of a provider configuration.
 * The API key is masked (e.g. "sk-...abc") — the full key is never sent to the client.
 */
export interface UserAiProviderDisplay {
  id: string;
  provider: ProviderName;
  /** Masked key hint (e.g. "sk-...abc") or null for Ollama. */
  masked_key: string | null;
  endpoint_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Server-side provider configuration with the decrypted API key.
 * Used by the AI provider adapters to make LLM calls.
 */
export interface ProviderConfig {
  provider: ProviderName;
  /** Decrypted API key — present for cloud providers. */
  apiKey?: string;
  /** Endpoint URL — present for Ollama (default http://localhost:11434). */
  endpoint?: string;
}
