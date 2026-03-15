import 'server-only';

// ---------------------------------------------------------------------------
// Provider adapter factory
// ---------------------------------------------------------------------------

import type { AiProvider, ProviderAdapterConfig } from '@/features/ai-composer/types';

import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini';
import { OllamaAdapter } from './ollama';
import { OpenAiAdapter } from './openai';

/**
 * Create an AI provider adapter from the given configuration.
 *
 * The factory selects the correct adapter class based on `config.provider`
 * and passes through the credentials / model override.
 *
 * @throws Error if the provider name is not recognised.
 */
export function createProvider(config: ProviderAdapterConfig): AiProvider {
  switch (config.provider) {
    case 'claude':
      return new ClaudeAdapter(config);
    case 'openai':
      return new OpenAiAdapter(config);
    case 'gemini':
      return new GeminiAdapter(config);
    case 'ollama':
      return new OllamaAdapter(config);
    default: {
      // Exhaustiveness check — TypeScript will error if a ProviderName case
      // is missing above.
      const _exhaustive: never = config.provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}
