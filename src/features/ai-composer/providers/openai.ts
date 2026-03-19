import 'server-only';

// ---------------------------------------------------------------------------
// OpenAI provider adapter
// ---------------------------------------------------------------------------

import OpenAI from 'openai';

import type {
  AiProvider,
  AiStructureResult,
  ProviderAdapterConfig,
} from '@/features/ai-composer/types';

import { DEFAULT_MODELS, PROVIDER_TIMEOUT_MS } from './constants';

export class OpenAiAdapter implements AiProvider {
  readonly name = 'openai' as const;

  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: ProviderAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI adapter requires an API key');
    }

    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? DEFAULT_MODELS.openai;
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
      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: brainstormText },
          ],
          max_completion_tokens: 4096,
        },
        { signal: controller.signal },
      );

      const choice = response.choices[0];
      const structuredContent = choice?.message?.content ?? '';

      return {
        structuredContent,
        model: response.model,
        tokensUsed: response.usage
          ? {
              input: response.usage.prompt_tokens,
              output: response.usage.completion_tokens ?? 0,
            }
          : undefined,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
