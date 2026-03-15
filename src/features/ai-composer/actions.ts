'use server';

// ---------------------------------------------------------------------------
// AI Composer — Server Actions (structuring + Ollama model listing)
// ---------------------------------------------------------------------------

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { structureRequestSchema } from '@/lib/validation/ai-composer';
import { getProviderConfig } from '@/features/ai-providers/queries';
import { createProvider, STRUCTURING_SYSTEM_PROMPT } from '@/features/ai-composer/providers';
import type { AiStructureResult, ProviderAdapterConfig } from '@/features/ai-composer/types';
import { OllamaAdapter } from '@/features/ai-composer/providers/ollama';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// structurePrompt — AI-assisted prompt structuring
// ---------------------------------------------------------------------------

export type StructurePromptActionResult =
  | { success: true; data: AiStructureResult }
  | { success: false; error: string };

/**
 * Takes brainstorm text and uses the selected AI provider to produce
 * a well-structured markdown prompt.
 *
 * Flow:
 * 1. Validate input (brainstormText, provider, optional model)
 * 2. Authenticate user
 * 3. Fetch and decrypt user's provider configuration
 * 4. Create provider adapter via factory
 * 5. Call adapter.structure() with brainstorm text
 * 6. Return the structured result
 */
export async function structurePrompt(
  input: {
    brainstormText: string;
    provider: string;
    model?: string;
  },
): Promise<StructurePromptActionResult> {
  // 1. Validate input
  const validation = structureRequestSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { brainstormText, provider, model } = validation.data;

  // 2. Authenticate user
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 3. Fetch user's provider config (with decrypted key)
  const configResult = await getProviderConfig(user.id, provider);
  if (!configResult.success) {
    return { success: false, error: configResult.error };
  }

  // 4. Create provider adapter
  const adapterConfig: ProviderAdapterConfig = {
    provider,
    apiKey: configResult.data.apiKey,
    endpoint: configResult.data.endpoint,
    model,
  };

  let adapter;
  try {
    adapter = createProvider(adapterConfig);
  } catch (err) {
    console.error('[structurePrompt] adapter creation error:', err);
    return {
      success: false,
      error: `Failed to initialize ${provider} provider`,
    };
  }

  // 5. Call the adapter
  try {
    const result = await adapter.structure(brainstormText, STRUCTURING_SYSTEM_PROMPT);

    return { success: true, data: result };
  } catch (err) {
    console.error('[structurePrompt] structuring error:', err);

    // Provide user-friendly error messages
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('abort') || message.includes('timeout')) {
      return {
        success: false,
        error: `Request to ${provider} timed out. Please try again or choose a different provider.`,
      };
    }

    if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) {
      return {
        success: false,
        error: `Authentication failed with ${provider}. Please check your API key in settings.`,
      };
    }

    if (message.includes('429') || message.includes('rate')) {
      return {
        success: false,
        error: `Rate limit reached for ${provider}. Please wait a moment and try again.`,
      };
    }

    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      return {
        success: false,
        error: `Could not connect to ${provider}. Please check that the service is running.`,
      };
    }

    return {
      success: false,
      error: `Failed to structure prompt with ${provider}: ${message}`,
    };
  }
}

// ---------------------------------------------------------------------------
// listOllamaModels — fetch available models from an Ollama instance
// ---------------------------------------------------------------------------

/** Zod schema for the Ollama endpoint URL input. */
const ollamaEndpointSchema = z
  .string()
  .trim()
  .url('Must be a valid URL')
  .max(500, 'Endpoint URL must be 500 characters or less');

export type ListOllamaModelsResult =
  | { success: true; data: string[] }
  | { success: false; error: string };

/**
 * Fetches the list of locally available models from an Ollama instance.
 *
 * Does not require a stored provider config — the endpoint URL is passed
 * directly so the UI can probe Ollama before saving the configuration.
 */
export async function listOllamaModels(
  endpointUrl: string,
): Promise<ListOllamaModelsResult> {
  // 1. Validate endpoint URL
  const validation = ollamaEndpointSchema.safeParse(endpointUrl);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? 'Invalid endpoint URL',
    };
  }

  // 2. Create a temporary Ollama adapter just to list models
  const adapter = new OllamaAdapter({
    provider: 'ollama',
    endpoint: validation.data,
  });

  try {
    const models = await adapter.listModels();
    return { success: true, data: models };
  } catch (err) {
    console.error('[listOllamaModels] error:', err);

    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('abort') || message.includes('timeout')) {
      return {
        success: false,
        error: 'Connection to Ollama timed out. Is the service running?',
      };
    }

    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      return {
        success: false,
        error: 'Could not connect to Ollama. Please check that the service is running and the URL is correct.',
      };
    }

    return {
      success: false,
      error: `Failed to list Ollama models: ${message}`,
    };
  }
}
