'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getSnapshots(promptVersionId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase
    .from('prompt_snapshots')
    .select('*')
    .eq('prompt_version_id', promptVersionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching snapshots:', error);
    return [];
  }

  return data;
}
