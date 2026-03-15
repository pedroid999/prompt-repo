import 'server-only';

// ---------------------------------------------------------------------------
// Claude (Anthropic) provider adapter
// ---------------------------------------------------------------------------

import Anthropic from '@anthropic-ai/sdk';

import type {
  AiProvider,
  AiStructureResult,
  ProviderAdapterConfig,
} from '@/features/ai-composer/types';

import { DEFAULT_MODELS, PROVIDER_TIMEOUT_MS } from './constants';

export class ClaudeAdapter implements AiProvider {
  readonly name = 'claude' as const;

  private readonly client: Anthropic;
  private readonly model: string;

  constructor(config: ProviderAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('Claude adapter requires an API key');
    }

    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model ?? DEFAULT_MODELS.claude;
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
      const response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: brainstormText }],
        },
        { signal: controller.signal },
      );

      const textBlock = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === 'text',
      );
      const structuredContent = textBlock?.text ?? '';

      return {
        structuredContent,
        model: response.model,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
