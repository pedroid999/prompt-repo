export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  archived_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicPrompt {
  id: string;
  title: string;
  description: string | null;
  latest_content: string;
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
  latest_version_id: string;
  collection_ids: string[];
}
