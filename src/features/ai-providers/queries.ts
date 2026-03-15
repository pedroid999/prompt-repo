'use server';

// ---------------------------------------------------------------------------
// AI Providers — data-fetching queries (server-only)
// ---------------------------------------------------------------------------

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { UserAiProvider, UserAiProviderDisplay, ProviderName } from './types';
import { decryptApiKey } from '@/lib/crypto/provider-keys';

// ---------------------------------------------------------------------------
// getProviderDisplayList — client-safe list with masked keys
// ---------------------------------------------------------------------------

export type GetProviderDisplayListResult =
  | { success: true; data: UserAiProviderDisplay[] }
  | { success: false; error: string };

/**
 * Returns all AI provider configurations for the authenticated user,
 * with API keys masked for safe client display.
 */
export async function getProviderDisplayList(): Promise<GetProviderDisplayListResult> {
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
    .from('user_ai_providers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getProviderDisplayList] query error:', error);
    return { success: false, error: 'Failed to load providers' };
  }

  const rows = (data ?? []) as UserAiProvider[];

  const displayList: UserAiProviderDisplay[] = rows.map((row) => ({
    id: row.id,
    provider: row.provider,
    masked_key: row.encrypted_api_key ? '••••••••' : null,
    endpoint_url: row.endpoint_url,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return { success: true, data: displayList };
}

// ---------------------------------------------------------------------------
// getProviderConfig — server-side config with decrypted key
// ---------------------------------------------------------------------------

export type GetProviderConfigResult =
  | { success: true; data: { provider: ProviderName; apiKey?: string; endpoint?: string } }
  | { success: false; error: string };

/**
 * Returns the decrypted provider configuration for a specific provider.
 * This is server-side only and should NEVER be exposed to the client.
 * Used internally by the AI structuring action.
 */
export async function getProviderConfig(
  userId: string,
  providerName: ProviderName,
): Promise<GetProviderConfigResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('user_ai_providers')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', providerName)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: `Provider "${providerName}" is not configured or is disabled`,
    };
  }

  const row = data as UserAiProvider;
  const isCloud = ['claude', 'openai', 'gemini'].includes(row.provider);

  let apiKey: string | undefined;

  if (isCloud && row.encrypted_api_key) {
    try {
      apiKey = await decryptApiKey(row.encrypted_api_key);
    } catch (err) {
      console.error('[getProviderConfig] decryption error:', err);
      return { success: false, error: 'Failed to decrypt API key' };
    }
  }

  return {
    success: true,
    data: {
      provider: row.provider,
      apiKey,
      endpoint: row.endpoint_url ?? undefined,
    },
  };
}
