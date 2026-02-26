import { z } from 'zod';

export const promptCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional(),
  content: z.string().trim().min(1, 'Content is required').max(20000, 'Content must be 20000 characters or less'),
  version_note: z.string().trim().max(200, 'Version note must be 200 characters or less').optional(),
});

export type PromptCreateInput = z.infer<typeof promptCreateSchema>;

export const promptMetadataSchema = promptCreateSchema.pick({
  title: true,
  description: true,
});

export type PromptMetadataInput = z.infer<typeof promptMetadataSchema>;
