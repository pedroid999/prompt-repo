import { z } from 'zod';

export const snapshotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  prompt_version_id: z.string().uuid('Invalid prompt version ID'),
  variables: z.record(z.string(), z.string()),
});

export type SnapshotInput = z.infer<typeof snapshotSchema>;
