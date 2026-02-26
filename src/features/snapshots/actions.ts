'use server';

import { createClient } from '@/lib/supabase/server';
import { snapshotSchema } from '@/lib/validation/snapshot';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function saveSnapshot(input: unknown) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = snapshotSchema.safeParse(input);
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.issues.map(e => e.message).join(', ') 
    };
  }

  const { data, error } = await supabase
    .from('prompt_snapshots')
    .insert({
      ...result.data,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving snapshot:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  
  return { success: true, data };
}
