export interface PromptSnapshot {
  id: string;
  user_id: string;
  prompt_version_id: string;
  name: string;
  variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateSnapshotInput {
  prompt_version_id: string;
  name: string;
  variables: Record<string, string>;
}
