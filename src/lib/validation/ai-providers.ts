import { z } from 'zod';

/** Valid provider names. */
export const providerNameSchema = z.enum(['claude', 'openai', 'gemini', 'ollama']);

/**
 * Schema for saving (create or update) a provider configuration.
 *
 * Discriminated validation:
 * - Cloud providers (claude, openai, gemini) require `api_key`.
 * - Ollama requires `endpoint_url` and does NOT accept an API key.
 */
export const saveProviderSchema = z
  .object({
    provider: providerNameSchema,
    api_key: z
      .string()
      .trim()
      .min(1, 'API key is required')
      .max(500, 'API key must be 500 characters or less')
      .optional(),
    endpoint_url: z
      .string()
      .trim()
      .url('Must be a valid URL')
      .max(500, 'Endpoint URL must be 500 characters or less')
      .optional(),
  })
  .superRefine((data, ctx) => {
    const isCloud = ['claude', 'openai', 'gemini'].includes(data.provider);

    if (isCloud && !data.api_key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'API key is required for cloud providers',
        path: ['api_key'],
      });
    }

    if (data.provider === 'ollama' && !data.endpoint_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Endpoint URL is required for Ollama',
        path: ['endpoint_url'],
      });
    }
  });

export type SaveProviderInput = z.infer<typeof saveProviderSchema>;

/** Schema for deleting a provider configuration. */
export const deleteProviderSchema = z.object({
  provider: providerNameSchema,
});

export type DeleteProviderInput = z.infer<typeof deleteProviderSchema>;

/** Schema for toggling a provider's active state. */
export const toggleProviderSchema = z.object({
  provider: providerNameSchema,
  is_active: z.boolean(),
});

export type ToggleProviderInput = z.infer<typeof toggleProviderSchema>;
