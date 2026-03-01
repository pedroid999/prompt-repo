'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey, hashApiKey } from '@/lib/api-keys/hash';
import { createApiKeySchema } from '@/lib/validation/api-keys';
import type { ApiKey, CreateApiKeyResult } from './types';

/** Maximum number of active (non-revoked) API keys a user may hold. */
const MAX_ACTIVE_KEYS = 10;

// ---------------------------------------------------------------------------
// createApiKey
// ---------------------------------------------------------------------------

export type CreateApiKeyActionResult =
  | { success: true; data: CreateApiKeyResult }
  | { success: false; error: string };

/**
 * Creates a new API key for the currently authenticated user.
 *
 * The plaintext key is returned exactly once in the response and is NEVER
 * stored. Only the SHA-256 hash is persisted in `user_api_keys.key_hash`.
 */
export async function createApiKey(
  label: string,
): Promise<CreateApiKeyActionResult> {
  // 1. Validate label
  const validation = createApiKeySchema.safeParse({ label });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Invalid label',
    };
  }

  // 2. Resolve authenticated user via session-aware client
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 3. Enforce per-user key limit
  const { count, error: countError } = await supabase
    .from('user_api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if (countError) {
    console.error('[createApiKey] count error:', countError);
    return { success: false, error: 'Failed to check existing keys' };
  }

  if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
    return {
      success: false,
      error: `You may only have ${MAX_ACTIVE_KEYS} active API keys. Revoke one before creating a new key.`,
    };
  }

  // 4. Generate key and hash
  const plaintext = generateApiKey();
  const keyHash = await hashApiKey(plaintext);

  // 5. Insert row
  const { data: inserted, error: insertError } = await supabase
    .from('user_api_keys')
    .insert({
      user_id: user.id,
      key_hash: keyHash,
      label: validation.data.label,
    })
    .select('id, user_id, label, created_at, revoked_at')
    .single();

  if (insertError || !inserted) {
    console.error('[createApiKey] insert error:', insertError);
    return { success: false, error: 'Failed to create API key' };
  }

  // 6. Return the row + plaintext (plaintext exposed only here)
  return {
    success: true,
    data: {
      apiKey: inserted as ApiKey,
      plaintext,
    },
  };
}

// ---------------------------------------------------------------------------
// listApiKeys
// ---------------------------------------------------------------------------

export type ListApiKeysActionResult =
  | { success: true; data: ApiKey[] }
  | { success: false; error: string };

/**
 * Returns all API keys (active and revoked) for the currently authenticated
 * user, ordered by creation date descending. The `key_hash` column is never
 * selected.
 */
export async function listApiKeys(): Promise<ListApiKeysActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, user_id, label, created_at, revoked_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listApiKeys] query error:', error);
    return { success: false, error: 'Failed to load API keys' };
  }

  return { success: true, data: (data ?? []) as ApiKey[] };
}

// ---------------------------------------------------------------------------
// revokeApiKey
// ---------------------------------------------------------------------------

export type RevokeApiKeyActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Revokes an API key by setting `revoked_at` to the current timestamp.
 *
 * The operation is idempotent — revoking an already-revoked key returns
 * `success: true` without error. The `user_id` filter ensures a user can
 * only revoke their own keys.
 */
export async function revokeApiKey(
  keyId: string,
): Promise<RevokeApiKeyActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('user_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if (error) {
    console.error('[revokeApiKey] update error:', error);
    return { success: false, error: 'Failed to revoke API key' };
  }

  // Idempotent: if no row matched (already revoked), we still return success.
  return { success: true };
}
