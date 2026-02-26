import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { PromptWithLatestVersion } from '../types';

interface DbPromptResponse {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  prompt_versions: {
    id: string;
    content: string;
    version_number: number;
  }[];
  collection_prompts: {
    collection_id: string;
  }[];
}

export async function getPrompts(collectionId?: string): Promise<PromptWithLatestVersion[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let queryBuilder = supabase.from('prompts').select(`
      id,
      user_id,
      title,
      description,
      created_at,
      updated_at,
      prompt_versions (
        id,
        content,
        version_number
      )
      ${collectionId ? ', collection_prompts!inner(collection_id)' : ', collection_prompts(collection_id)'}
    `);

  if (collectionId) {
    queryBuilder = queryBuilder.eq('collection_prompts.collection_id', collectionId);
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  if (!data) return [];

  const typedData = data as unknown as DbPromptResponse[];

  return typedData.map((prompt) => {
    const versions = prompt.prompt_versions || [];
    // Sort descending by version_number and take the first one
    const latestVersion = versions.sort((a, b) => b.version_number - a.version_number)[0];

    return {
      id: prompt.id,
      user_id: prompt.user_id,
      title: prompt.title,
      description: prompt.description,
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      latest_content: latestVersion?.content || '',
      latest_version_id: latestVersion?.id || '',
      collection_ids: prompt.collection_prompts?.map(cp => cp.collection_id) || [],
    };
  });
}
