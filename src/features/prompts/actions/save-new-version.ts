'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const newVersionSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(20000, 'Content must be 20000 characters or less'),
  version_note: z.string().trim().max(200, 'Version note must be 200 characters or less').optional(),
});

export type SaveNewVersionResult =
  | { success: true; newVersion: number }
  | { success: false; error: string };

export async function saveNewVersion(
  promptId: string,
  input: { content: string; version_note?: string }
): Promise<SaveNewVersionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const validation = newVersionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { content, version_note } = validation.data;

  // Get current max version number
  const { data: maxVersionData, error: maxVersionError } = await supabase
    .from('prompt_versions')
    .select('version_number')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (maxVersionError) {
    return { success: false, error: 'Failed to determine next version' };
  }

  const nextVersionNumber = (maxVersionData?.version_number ?? 0) + 1;

  const { error: insertError } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptId,
      version_number: nextVersionNumber,
      content,
      version_note: version_note ?? '',
    });

  if (insertError) {
    return { success: false, error: 'Failed to save new version: ' + insertError.message };
  }

  await supabase
    .from('prompts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', promptId);

  revalidatePath('/');

  return { success: true, newVersion: nextVersionNumber };
}
