// ---------------------------------------------------------------------------
// API Key domain types
// ---------------------------------------------------------------------------

/** Row shape returned from the `user_api_keys` table (sans key_hash). */
export interface ApiKey {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
  /** ISO timestamp if the key has been revoked; null while the key is active. */
  revoked_at: string | null;
}

/** Result returned from key creation — the plaintext is exposed exactly once. */
export interface CreateApiKeyResult {
  apiKey: ApiKey;
  /** The full plaintext key. MUST be shown to the user immediately; it is not
   *  stored and cannot be retrieved again after this response. */
  plaintext: string;
}

/** Scopes that can be associated with an API key (extensible union). */
export type ApiKeyScope = 'prompts:read';
