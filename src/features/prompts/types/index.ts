export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  content: string;
  version_note: string | null;
  created_at: string;
}

export interface PromptWithLatestVersion extends Prompt {
  latest_content: string;
  collection_ids: string[];
}
