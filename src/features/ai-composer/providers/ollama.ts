import 'server-only';

// ---------------------------------------------------------------------------
// Ollama (local) provider adapter
// ---------------------------------------------------------------------------

import type {
  AiProvider,
  AiStructureResult,
  ProviderAdapterConfig,
} from '@/features/ai-composer/types';

import { DEFAULT_MODELS, PROVIDER_TIMEOUT_MS } from './constants';

/** Shape of the Ollama /api/chat response. */
interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

/** Shape of the Ollama /api/tags response. */
interface OllamaTagsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

export class OllamaAdapter implements AiProvider {
  readonly name = 'ollama' as const;

  private readonly endpoint: string;
  private readonly model: string;

  constructor(config: ProviderAdapterConfig) {
    if (!config.endpoint) {
      throw new Error('Ollama adapter requires an endpoint URL');
    }

    // Strip trailing slash for consistent URL construction
    this.endpoint = config.endpoint.replace(/\/+$/, '');
    this.model = config.model ?? DEFAULT_MODELS.ollama;
  }

  async structure(
    brainstormText: string,
    systemPrompt: string,
  ): Promise<AiStructureResult> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PROVIDER_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: brainstormText },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Ollama API error (${response.status}): ${errorText}`,
        );
      }

      const data: OllamaChatResponse = await response.json();

      return {
        structuredContent: data.message.content,
        model: data.model,
        tokensUsed:
          data.prompt_eval_count != null || data.eval_count != null
            ? {
                input: data.prompt_eval_count ?? 0,
                output: data.eval_count ?? 0,
              }
            : undefined,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * List locally available models from the Ollama instance.
   * Calls the `/api/tags` endpoint.
   */
  async listModels(): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PROVIDER_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Ollama /api/tags error (${response.status})`,
        );
      }

      const data: OllamaTagsResponse = await response.json();
      return data.models.map((m) => m.name);
    } finally {
      clearTimeout(timeout);
    }
  }
}
