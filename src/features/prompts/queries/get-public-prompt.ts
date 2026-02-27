import { createPublicClient } from '@/lib/supabase/server';
import { PublicPrompt } from '../types';

interface DbPublicPromptResponse {
  id: string;
  title: string;
  description: string | null;
  prompt_versions: {
    content: string;
    version_number: number;
  }[];
}

export async function getPublicPrompt(promptId: string): Promise<PublicPrompt | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      description,
      prompt_versions (
        content,
        version_number
      )
    `)
    .eq('id', promptId)
    .eq('is_public', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const response = data as unknown as DbPublicPromptResponse;
  const versions = response.prompt_versions || [];
  const latestVersion = versions.sort((a, b) => b.version_number - a.version_number)[0];

  return {
    id: response.id,
    title: response.title,
    description: response.description,
    latest_content: latestVersion?.content || '',
  };
}
