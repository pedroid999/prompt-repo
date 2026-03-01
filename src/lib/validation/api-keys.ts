import { z } from 'zod';

export const apiKeyLabelSchema = z
  .string()
  .trim()
  .min(1, 'Label is required')
  .max(100, 'Label must be 100 characters or less');

export const createApiKeySchema = z.object({
  label: apiKeyLabelSchema,
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
