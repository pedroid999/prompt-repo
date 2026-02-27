'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { promptMetadataSchema, PromptMetadataInput } from '@/lib/validation/prompt';

type PromptActionResult =
  | { success: true }
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

export async function archivePrompt(promptId: string): Promise<PromptActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('prompts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', promptId)
    .is('archived_at', null);

  if (error) {
    return { success: false, error: `Failed to archive prompt: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

export async function restorePrompt(promptId: string): Promise<PromptActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('prompts')
    .update({ archived_at: null })
    .eq('id', promptId);

  if (error) {
    return { success: false, error: `Failed to restore prompt: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

export async function deletePrompt(promptId: string): Promise<PromptActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId);

  if (error) {
    return { success: false, error: `Failed to delete prompt: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

export async function togglePromptPublic(
  promptId: string,
  isPublic: boolean,
): Promise<PromptActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('prompts')
    .update({ is_public: isPublic })
    .eq('id', promptId);

  if (error) {
    return { success: false, error: `Failed to update sharing: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}

export async function updatePromptMetadata(
  promptId: string,
  input: PromptMetadataInput,
): Promise<PromptActionResult> {
  const validation = promptMetadataSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { title, description } = validation.data;
  const normalizedDescription = description?.trim() ? description.trim() : null;

  const { error } = await supabase
    .from('prompts')
    .update({
      title: title.trim(),
      description: normalizedDescription,
      updated_at: new Date().toISOString(),
    })
    .eq('id', promptId);

  if (error) {
    return { success: false, error: `Failed to update prompt details: ${error.message}` };
  }

  revalidatePath('/');
  return { success: true };
}
