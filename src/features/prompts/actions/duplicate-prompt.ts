'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export type DuplicatePromptResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

async function requireUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

export async function duplicatePrompt(promptId: string): Promise<DuplicatePromptResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: source, error: fetchError } = await supabase
    .from('prompts')
    .select('title, description, prompt_versions(content, version_number)')
    .eq('id', promptId)
    .eq('user_id', user.id)
    .order('version_number', { referencedTable: 'prompt_versions', ascending: false })
    .limit(1, { referencedTable: 'prompt_versions' })
    .single();

  if (fetchError || !source) return { success: false, error: 'Prompt not found' };

  const content = (source.prompt_versions as { content: string }[] | null)?.[0]?.content ?? '';

  const { data: newPrompt, error: insertError } = await supabase
    .from('prompts')
    .insert({ title: `Copy of ${source.title}`, description: source.description, user_id: user.id })
    .select('id')
    .single();

  if (insertError || !newPrompt) return { success: false, error: 'Failed to create prompt' };

  const { error: versionError } = await supabase
    .from('prompt_versions')
    .insert({ prompt_id: newPrompt.id, version_number: 1, content });

  if (versionError) {
    await supabase.from('prompts').delete().eq('id', newPrompt.id);
    return { success: false, error: 'Failed to create version' };
  }

  revalidatePath('/');
  return { success: true, data: { id: newPrompt.id } };
}
