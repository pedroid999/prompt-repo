import { z } from 'zod';
import { providerNameSchema } from './ai-providers';

/**
 * Schema for the AI structuring request sent from the client to the
 * Server Action. Validates the brainstorm text and provider selection.
 */
export const structureRequestSchema = z.object({
  brainstormText: z
    .string()
    .trim()
    .min(1, 'Brainstorm text is required')
    .max(50000, 'Brainstorm text must be 50,000 characters or less'),
  provider: providerNameSchema,
  model: z
    .string()
    .trim()
    .max(100, 'Model name must be 100 characters or less')
    .optional(),
});

export type StructureRequestInput = z.infer<typeof structureRequestSchema>;
