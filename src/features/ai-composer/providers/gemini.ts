import 'server-only';

// ---------------------------------------------------------------------------
// Google Gemini provider adapter
// ---------------------------------------------------------------------------

import { GoogleGenerativeAI } from '@google/generative-ai';

import type {
  AiProvider,
  AiStructureResult,
  ProviderAdapterConfig,
} from '@/features/ai-composer/types';

import { DEFAULT_MODELS, PROVIDER_TIMEOUT_MS } from './constants';

export class GeminiAdapter implements AiProvider {
  readonly name = 'gemini' as const;

  private readonly client: GoogleGenerativeAI;
  private readonly model: string;

  constructor(config: ProviderAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini adapter requires an API key');
    }

    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model ?? DEFAULT_MODELS.gemini;
  }

  async structure(
    brainstormText: string,
    systemPrompt: string,
  ): Promise<AiStructureResult> {
    const generativeModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PROVIDER_TIMEOUT_MS,
    );

    try {
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: brainstormText }] }],
        generationConfig: { maxOutputTokens: 4096 },
      });

      const response = result.response;
      const structuredContent = response.text();
      const usageMetadata = response.usageMetadata;

      return {
        structuredContent,
        model: this.model,
        tokensUsed: usageMetadata
          ? {
              input: usageMetadata.promptTokenCount ?? 0,
              output: usageMetadata.candidatesTokenCount ?? 0,
            }
          : undefined,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
