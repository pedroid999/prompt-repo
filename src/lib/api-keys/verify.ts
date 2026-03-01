// NOTE: This module must ONLY be imported from server-side code (Route Handlers,
// Server Actions, middleware). It uses createServiceClient() which relies on
// SUPABASE_SERVICE_ROLE_KEY — importing it from a Client Component would expose
// the service-role key and bypass RLS.

import { hashApiKey } from './hash';
import { createServiceClient } from '@/lib/supabase/service';

export type VerifyApiKeyResult =
  | { valid: true; userId: string }
  | { valid: false };

/**
 * Verifies a plaintext API key against the hashed values stored in the
 * `user_api_keys` table.
 *
 * Uses the service-role Supabase client so it can read any row regardless of
 * RLS policies (RLS would otherwise block the lookup because no session exists
 * in an API key context).
 *
 * Returns `{ valid: true, userId }` when a matching, non-revoked key is found,
 * or `{ valid: false }` if the key is unknown, revoked, or on any error.
 */
export async function verifyApiKey(plaintext: string): Promise<VerifyApiKeyResult> {
  let keyHash: string;

  try {
    keyHash = await hashApiKey(plaintext);
  } catch (err) {
    console.error('[verifyApiKey] hashing failed:', err);
    return { valid: false };
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) {
    console.error('[verifyApiKey] database error:', error);
    return { valid: false };
  }

  if (!data) {
    return { valid: false };
  }

  return { valid: true, userId: data.user_id as string };
}
