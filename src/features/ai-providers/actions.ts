'use server';

// ---------------------------------------------------------------------------
// AI Providers — Server Actions (CRUD + toggle)
// ---------------------------------------------------------------------------

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { encryptApiKey } from '@/lib/crypto/provider-keys';
import {
  saveProviderSchema,
  deleteProviderSchema,
  toggleProviderSchema,
  type SaveProviderInput,
  type DeleteProviderInput,
  type ToggleProviderInput,
} from '@/lib/validation/ai-providers';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// saveProvider — upsert a provider configuration
// ---------------------------------------------------------------------------

export type SaveProviderActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Create or update a provider configuration for the authenticated user.
 *
 * For cloud providers (claude, openai, gemini) the API key is encrypted via
 * pgcrypto before being stored. For Ollama, only the endpoint URL is stored.
 *
 * Uses Supabase upsert on the (user_id, provider) unique constraint.
 */
export async function saveProvider(
  input: SaveProviderInput,
): Promise<SaveProviderActionResult> {
  // 1. Validate input
  const validation = saveProviderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { provider, api_key, endpoint_url } = validation.data;

  // 2. Resolve authenticated user
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 3. Encrypt API key for cloud providers
  let encryptedKey: string | null = null;
  const isCloud = ['claude', 'openai', 'gemini'].includes(provider);

  if (isCloud && api_key) {
    try {
      encryptedKey = await encryptApiKey(api_key);
    } catch (err) {
      console.error('[saveProvider] encryption error:', err);
      return { success: false, error: 'Failed to encrypt API key' };
    }
  }

  // 4. Upsert the provider row
  const { error: upsertError } = await supabase
    .from('user_ai_providers')
    .upsert(
      {
        user_id: user.id,
        provider,
        encrypted_api_key: encryptedKey,
        endpoint_url: provider === 'ollama' ? (endpoint_url ?? null) : null,
        is_active: true,
      },
      { onConflict: 'user_id,provider' },
    );

  if (upsertError) {
    console.error('[saveProvider] upsert error:', upsertError);
    return { success: false, error: 'Failed to save provider configuration' };
  }

  revalidatePath('/profile');
  return { success: true };
}

// ---------------------------------------------------------------------------
// deleteProvider — remove a provider configuration
// ---------------------------------------------------------------------------

export type DeleteProviderActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Delete a provider configuration for the authenticated user.
 * RLS ensures users can only delete their own providers.
 */
export async function deleteProvider(
  input: DeleteProviderInput,
): Promise<DeleteProviderActionResult> {
  // 1. Validate input
  const validation = deleteProviderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { provider } = validation.data;

  // 2. Resolve authenticated user
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 3. Delete the provider row
  const { error: deleteError } = await supabase
    .from('user_ai_providers')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider);

  if (deleteError) {
    console.error('[deleteProvider] delete error:', deleteError);
    return { success: false, error: 'Failed to delete provider' };
  }

  revalidatePath('/profile');
  return { success: true };
}

// ---------------------------------------------------------------------------
// toggleProvider — enable/disable a provider
// ---------------------------------------------------------------------------

export type ToggleProviderActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Toggle the `is_active` state of a provider configuration.
 * RLS ensures users can only update their own providers.
 */
export async function toggleProvider(
  input: ToggleProviderInput,
): Promise<ToggleProviderActionResult> {
  // 1. Validate input
  const validation = toggleProviderSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { provider, is_active } = validation.data;

  // 2. Resolve authenticated user
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 3. Update active state
  const { error: updateError } = await supabase
    .from('user_ai_providers')
    .update({ is_active })
    .eq('user_id', user.id)
    .eq('provider', provider);

  if (updateError) {
    console.error('[toggleProvider] update error:', updateError);
    return { success: false, error: 'Failed to toggle provider' };
  }

  revalidatePath('/profile');
  return { success: true };
}
