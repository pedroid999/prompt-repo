'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { promptCreateSchema, PromptCreateInput } from '@/lib/validation/prompt';

export type SavePromptResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export async function savePrompt(input: PromptCreateInput): Promise<SavePromptResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const validation = promptCreateSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input data' };
  }

  const { title, description, content, version_note } = validation.data;

  // 3. Insert into prompts
  const { data: promptData, error: promptError } = await supabase
    .from('prompts')
    .insert({
      title,
      description,
      user_id: user.id,
    })
    .select('id')
    .single();

  if (promptError) {
    console.error('Error creating prompt:', promptError);
    return { success: false, error: 'Failed to create prompt: ' + promptError.message };
  }

  // 4. Insert into prompt_versions
  const { error: versionError } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptData.id,
      version_number: 1,
      content,
      version_note,
    })
    .select('id')
    .single();

  if (versionError) {
    console.error('Error creating prompt version:', versionError);
    // Rollback: Attempt to delete the created prompt since the version failed
    const { error: deleteError } = await supabase.from('prompts').delete().eq('id', promptData.id);
    if (deleteError) {
       console.error('CRITICAL: Failed to rollback prompt creation after version error:', deleteError);
    }
    return { success: false, error: 'Failed to create initial version: ' + versionError.message };
  }

  return { success: true, data: { id: promptData.id } };
}
